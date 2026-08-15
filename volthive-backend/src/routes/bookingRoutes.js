// volthive-backend/src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');
const { getChargerEffectiveRate } = require('../utils/rateEngine');
const { publishToUser, publishToOwner, publishToStation } = require('../utils/eventBus');

// Statuses that still occupy a charger slot (used for overlap checks)
const ACTIVE_SLOT_STATUSES = ['Pending', 'Confirmed', 'Active_Charging'];

/**
 * Parse "HH:MM" into minutes since midnight. Returns NaN for invalid input.
 */
const timeToMinutes = (time) => {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(String(time || ''))) return NaN;
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
};

/**
 * Check whether [startA,endA] overlaps [startB,endB] (half-open intervals).
 */
const timeRangesOverlap = (startA, endA, startB, endB) => startA < endB && endA > startB;

/**
 * Find an active (non-terminal) booking on the same charger/date that would
 * overlap the requested slot, excluding the given booking id (used on edits).
 */
const findOverlappingBooking = async (stationId, chargerId, date, startTime, endTime, excludeId = null) => {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  if (!Number.isFinite(startMins) || !Number.isFinite(endMins)) return null;

  const sameDay = await Booking.find({
    station: stationId,
    chargerId,
    date,
    status: { $in: ACTIVE_SLOT_STATUSES },
    _id: { $ne: excludeId }
  }).lean();

  return sameDay.find((b) => timeRangesOverlap(startMins, endMins, timeToMinutes(b.startTime), timeToMinutes(b.endTime))) || null;
};

/**
 * Resolve the authenticated user from Firebase UID.
 */
const findUserByReq = async (req) => User.findOne({ firebaseUid: req.user.uid });

/**
 * Verify the authenticated user owns the station a booking belongs to (owner),
 * or is the driver who created the booking. Returns { ok, user, booking, station }.
 */
const authorizeBookingAccess = async (req, booking, { requireOwner = false } = {}) => {
  const user = await findUserByReq(req);
  if (!user) return { ok: false, status: 401, error: 'User not authorized.' };

  if (requireOwner && user.role !== 'owner') {
    return { ok: false, status: 403, error: 'Only station owners can perform this action.' };
  }

  const station = await Station.findById(booking.station);
  const isStationOwner = !!station && String(station.ownerId) === String(user._id);
  const isBookingDriver = String(booking.driver) === String(user._id);

  if (requireOwner) {
    if (!isStationOwner) {
      return { ok: false, status: 403, error: 'You can only manage bookings for your own stations.' };
    }
  } else if (!isStationOwner && !isBookingDriver) {
    return { ok: false, status: 403, error: 'You can only manage your own bookings.' };
  }

  return { ok: true, user, booking, station };
};

/**
 * Validate booking input
 */
const validateBookingInput = (req, res) => {
  const { stationId, chargerId, date, startTime, endTime, lockedPricePerKwh } = req.body;

  // Validate required fields
  if (!stationId || !chargerId || !date || !startTime || !endTime || typeof lockedPricePerKwh !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid required fields',
      required: ['stationId', 'chargerId', 'date', 'startTime', 'endTime', 'lockedPricePerKwh (number)']
    });
  }

  // Validate MongoDB ObjectIds
  if (!mongoose.Types.ObjectId.isValid(stationId) || !mongoose.Types.ObjectId.isValid(chargerId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid stationId or chargerId format'
    });
  }

  // Validate price is positive
  if (lockedPricePerKwh < 0) {
    return res.status(400).json({
      success: false,
      message: 'Price per kWh cannot be negative'
    });
  }

  // Validate date format (YYYY-MM-DD)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(date)) {
    return res.status(400).json({
      success: false,
      message: 'Date must be in YYYY-MM-DD format'
    });
  }

  // Validate time format (HH:MM)
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
    return res.status(400).json({
      success: false,
      message: 'Time must be in HH:MM format (24-hour)'
    });
  }

  // Validate start time is before end time
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes >= endMinutes) {
    return res.status(400).json({
      success: false,
      message: 'Start time must be before end time'
    });
  }

  return null; // No validation errors
};

/**
 * POST /api/bookings - Driver requests a reservation
 */
router.post('/', verifyToken, async (req, res) => {
  // Validate input
  const validationError = validateBookingInput(req, res);
  if (validationError) return;

  const { stationId, chargerId, date, startTime, endTime, lockedPricePerKwh } = req.body;
  
  try {
    // Check user role
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || (user.role !== 'driver' && user.role !== 'owner')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create bookings.'
      });
    }

    // Find station
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found.'
      });
    }

    // Find specific charger
    const charger = station.chargers.id(chargerId);
    if (!charger) {
      return res.status(404).json({
        success: false,
        message: 'Charger not found at this station.'
      });
    }

    // NOTE: We do NOT reject here just because the charger is busy. The
    // overlap check below (findOverlappingBooking) handles slot conflicts, so
    // drivers can schedule a future, non-overlapping slot even while the
    // charger is currently in use.

    // --- Contact details (mandatory) ---
    // Owner-created (walk-in / phone) bookings REQUIRE name + phone.
    // Driver bookings require a reachable phone (prefilled from profile on the frontend).
    const cName = (req.body.customerName || req.body.driverName || user.name || '').trim();
    const cPhone = (req.body.customerPhone || user.telephone || user.phone || '').trim();

    if (user.role === 'owner') {
      if (!cName || !cPhone) {
        return res.status(400).json({
          success: false,
          message: 'Customer Name and Contact Phone are mandatory for walk-in / phone bookings.'
        });
      }
    } else if (!cPhone) {
      return res.status(400).json({
        success: false,
        message: 'A contact phone number is required to make a booking. Add it to your profile or provide it now.'
      });
    }

    // --- Can't book a slot that already started or passed ---
    const slotStart = new Date(`${date}T${startTime}:00`);
    if (Number.isNaN(slotStart.getTime()) || slotStart.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book a time slot that has already started or passed.'
      });
    }

    // --- Prevent double-booking the same charger/date/time ---
    const overlapping = await findOverlappingBooking(stationId, chargerId, date, startTime, endTime);
    if (overlapping) {
      return res.status(409).json({
        success: false,
        message: `This charger is already booked for an overlapping slot (${overlapping.startTime} - ${overlapping.endTime}).`
      });
    }

    // Lock the price SERVER-SIDE from the SELECTED CHARGER's current effective
    // rate (AI multiplier applied to this charger's own base, or its TOU rate).
    // Never trust the client price — prevents 0-LKR / spoofed bookings.
    const effectiveRate = await getChargerEffectiveRate(station, charger);
    if (!(effectiveRate > 0)) {
      return res.status(400).json({
        success: false,
        message: 'This station has no price configured. Please contact the station owner.'
      });
    }

    // Create booking record
    const newBooking = new Booking({
      driver: user._id,
      customerName: cName,
      customerPhone: cPhone,
      station: stationId,
      chargerId: chargerId,
      date,
      startTime,
      endTime,
      lockedPricePerKwh: effectiveRate,
      status: 'Pending'
    });

    await newBooking.save();

    // Lock the charger only if it is currently free. This allows scheduling
    // future, non-overlapping slots on a charger that is busy earlier.
    if (charger.status === 'AVAILABLE') {
      charger.status = 'PENDING_APPROVAL';
      charger.activeBookingId = newBooking._id;
      await station.save();
    }

    // ── Realtime: notify the station owner + station followers ──
    const bookingEventData = {
      bookingId: newBooking._id,
      stationId: String(newBooking.station),
      stationName: station.stationName,
      chargerId: newBooking.chargerId,
      status: newBooking.status,
      date: newBooking.date,
      startTime: newBooking.startTime,
      endTime: newBooking.endTime,
      driverName: newBooking.customerName || user.name || 'EV Driver',
      createdAt: newBooking.createdAt,
    };
    publishToOwner(station.ownerId, 'booking.created', bookingEventData);
    publishToStation(String(newBooking.station), 'availability.updated', bookingEventData);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: newBooking
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/bookings/driver - Get driver's booking history
 */
router.get('/driver', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can view their bookings.'
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const total = await Booking.countDocuments({ driver: user._id });
    const bookings = await Booking.find({ driver: user._id })
      .populate('station', 'stationName address location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: bookings
    });

  } catch (error) {
    console.error('Error fetching driver bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

/**
 * GET /api/bookings/station/:stationId - Get bookings for a station
 * WARNING: Must come BEFORE /:id routes
 */
router.get('/station/:stationId', verifyToken, async (req, res) => {
  try {
    const { stationId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(stationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid station ID format'
      });
    }

    const bookings = await Booking.find({ station: stationId })
      .select('date startTime endTime status chargerId driver')
      .sort({ date: 1, startTime: 1 })
      .lean();
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error('Error fetching station bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch station bookings'
    });
  }
});

/**
 * GET /api/bookings/owner - Get owner's Point-of-Sale queue (with pagination)
 */
router.get('/owner', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only station owners can view the POS queue.'
      });
    }

    // Get all stations for this owner
    const myStations = await Station.find({ ownerId: user._id }).select('_id');
    const stationIds = myStations.map(s => s._id);

    if (stationIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No stations found for this owner',
        count: 0,
        total: 0,
        page: 1,
        totalPages: 0,
        data: []
      });
    }

    const statusFilter = req.query.all === 'true' 
      ? ['Pending', 'Confirmed', 'Active_Charging', 'Completed', 'Cancelled', 'No_Show', 'Expired']
      : ['Pending', 'Confirmed', 'Active_Charging'];

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filterQuery = {
      station: { $in: stationIds },
      status: { $in: statusFilter }
    };

    const total = await Booking.countDocuments(filterQuery);
    const bookings = await Booking.find(filterQuery)
      .populate('driver', 'name email telephone')
      .populate('station', 'stationName address location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/bookings - Global/Admin booking list with pagination
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filterQuery = {};
    if (req.query.status) {
      filterQuery.status = req.query.status;
    }

    const total = await Booking.countDocuments(filterQuery);
    const bookings = await Booking.find(filterQuery)
      .populate('driver', 'name email telephone')
      .populate('station', 'stationName address location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});


// 5. PATCH /api/bookings/:id/status - THE BOOKING STATE MACHINE
// Owner flow:   Pending -> Confirmed -> Active_Charging -> Completed
//               Pending -> Cancelled (reject)
// Driver has NO manual actions (no edit/delete/cancel).
// NOTE: No automatic billing — the owner settles the agreed lockedPricePerKwh
// manually. Cancelled/rejected bookings are purged from the DB after 10 min.
const ALLOWED_TRANSITIONS = {
  Pending: { owner: ['Confirmed', 'Cancelled'], driver: [] },
  Confirmed: { owner: ['Active_Charging'], driver: [] },
  Active_Charging: { owner: ['Completed'], driver: [] },
  Completed: { owner: [], driver: [] },
  Cancelled: { owner: [], driver: [] },
  Expired: { owner: [], driver: [] },
};

router.patch('/:id/status', verifyToken, async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'A target status is required.' });
  }

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const { ok, error, status: errStatus, user, station } = await authorizeBookingAccess(req, booking);
    if (!ok) return res.status(errStatus).json({ success: false, message: error });

    const currentStatus = booking.status;
    const role = user.role;

    // Validate the transition is legal for this role
    const allowedForRole = ALLOWED_TRANSITIONS[currentStatus]?.[role] || [];
    if (!allowedForRole.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move a '${currentStatus}' booking to '${status}' as a ${role}.`
      });
    }

    // Drivers cannot cancel/edit/delete bookings themselves.
    const charger = station ? station.chargers.id(booking.chargerId) : null;

    // The charger's lock (status + activeBookingId) belongs to AT MOST ONE
    // booking at a time — the one that booked it while it was AVAILABLE, or
    // the one that started charging on it. Non-overlapping future bookings
    // on a busy charger do NOT hold the lock. So every charger mutation below
    // is guarded: only mutate if THIS booking owns the charger (DELETE and
    // the 15-min expiry job already guard this way).
    const ownsCharger = !!charger && !!charger.activeBookingId &&
      String(charger.activeBookingId) === String(booking._id);

    // Apply charger state transitions + booking timestamps.
    // NOTE: The system does NOT calculate energy/cost. The station owner
    // settles the amount manually using the agreed lockedPricePerKwh.
    if (status === 'Confirmed') {
      if (ownsCharger) charger.status = 'RESERVED';
    } else if (status === 'Active_Charging') {
      booking.actualStartedAt = new Date();
      if (ownsCharger) {
        charger.status = 'CHARGING';
      } else if (charger && charger.status === 'AVAILABLE') {
        // Session actually started on a currently-free charger — claim the lock.
        charger.status = 'CHARGING';
        charger.activeBookingId = booking._id;
      }
    } else if (status === 'Completed') {
      booking.actualEndedAt = new Date();
      if (ownsCharger) {
        charger.status = 'AVAILABLE';
        charger.activeBookingId = null;
      }
      // No automatic billing — lockedPricePerKwh remains the agreed rate.
    } else if (status === 'Cancelled') {
      if (ownsCharger) {
        charger.status = 'AVAILABLE';
        charger.activeBookingId = null;
      }
      // Rejected/cancelled -> visible for 10 more minutes, then purged.
      booking.removableAt = new Date(Date.now() + 10 * 60 * 1000);
    }

    booking.status = status;
    await booking.save();
    if (station) await station.save();

    // ── Realtime: notify driver, station owner, and station followers ──
    const updatedEventData = {
      bookingId: booking._id,
      stationId: String(booking.station),
      stationName: station ? station.stationName : '',
      chargerId: booking.chargerId,
      status: booking.status,
      previousStatus: currentStatus,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      updatedAt: booking.updatedAt,
    };
    publishToUser(booking.driver, 'booking.updated', updatedEventData);
    if (station) publishToOwner(station.ownerId, 'booking.updated', updatedEventData);
    publishToStation(String(booking.station), 'availability.updated', updatedEventData);

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// NOTE: The old /api/bookings/:id/auto-cancel endpoint was removed.
// NOTE: Payments are settled manually by the station owner (off-system).
//       There is intentionally NO payment endpoint.
// Unapproved Pending bookings are now auto-marked 'Expired' by the server's
// 15-minute background job (kept in DB, charger released) — never deleted.

// NOTE: Editing bookings (PUT) has been removed — bookings are created via
// the booking wizard and managed with approve / reject / delete / complete.

// 10. DELETE /api/bookings/:id - Station Owner Deletes a Booking Record (cleanup)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Only the station owner can permanently delete booking records
    const { ok, error, status: errStatus } = await authorizeBookingAccess(req, booking, { requireOwner: true });
    if (!ok) return res.status(errStatus).json({ success: false, message: error });

    // Pending/Confirmed can be deleted (frees the slot). Active/Completed
    // bookings are never removable — the owner must complete, not delete.
    if (['Active_Charging', 'Completed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Bookings in '${booking.status}' state cannot be deleted.`
      });
    }

    // Release charger if locked by this booking
    let station = null;
    if (booking.station && booking.chargerId) {
      station = await Station.findById(booking.station);
      if (station) {
        const charger = station.chargers.id(booking.chargerId);
        if (charger && charger.activeBookingId?.toString() === booking._id.toString()) {
          charger.status = 'AVAILABLE';
          charger.activeBookingId = null;
          await station.save();
        }
      }
    }

    await Booking.findByIdAndDelete(req.params.id);

    // ── Realtime: notify driver, station owner, and station followers ──
    const deletedEventData = {
      bookingId: booking._id,
      stationId: String(booking.station),
      stationName: station ? station.stationName : '',
      chargerId: booking.chargerId,
      status: booking.status,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
    };
    publishToUser(booking.driver, 'booking.deleted', deletedEventData);
    if (station) publishToOwner(station.ownerId, 'booking.deleted', deletedEventData);
    publishToStation(String(booking.station), 'availability.updated', deletedEventData);

    return res.status(200).json({ success: true, message: 'Booking deleted successfully. Slot released.' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete booking', error: error.message });
  }
});

module.exports = router;