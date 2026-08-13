// volthive-backend/src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');
const { getStationEffectiveRate } = require('../utils/rateEngine');

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
 * POST /api/bookings/test-postman
 * Dedicated route for Postman testing (Bypasses Auth & DB Checks)
 */
router.post('/test-postman', (req, res) => {
  const { driverId, stationId, chargerType, startTime, endTime, energyRequestedKwh, aiPredictedPricePerKwh } = req.body;

  res.status(201).json({
    success: true,
    message: 'Booking created successfully (Postman Test Mode)',
    data: {
      _id: new mongoose.Types.ObjectId(),
      driver: driverId || new mongoose.Types.ObjectId(),
      station: stationId || new mongoose.Types.ObjectId(),
      chargerType: chargerType || 'DC_CCS2',
      date: startTime ? startTime.split('T')[0] : '2026-08-01',
      startTime: startTime,
      endTime: endTime,
      energyRequestedKwh: energyRequestedKwh || 45,
      lockedPricePerKwh: aiPredictedPricePerKwh || 65.50,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

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

    // Check if driver has any unpaid (Not Done) bookings
    const unpaidBooking = await Booking.findOne({ driver: user._id, paymentStatus: 'Not Done' });
    if (unpaidBooking) {
      return res.status(403).json({
        success: false,
        message: 'Booking restricted. You have an unpaid booking (Payment Status: Not Done). Please settle your previous payment to book chargers.'
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

    // Lock the price SERVER-SIDE from the station's current effective rate.
    // (Never trust the client price — prevents 0-LKR / spoofed bookings.)
    const effectiveRate = getStationEffectiveRate(station);
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


// 5. PATCH /api/bookings/:id/status - THE POS STATE MACHINE
// Owner flow:   Pending -> Confirmed -> Active_Charging -> Completed
//               Pending -> Cancelled (reject, no penalty)
//               Confirmed -> No_Show | Cancelled (after approval -> 50% penalty)
//               Expired -> Cancelled (admin cleanup)
// Driver flow:  Pending/Confirmed -> Cancelled (>= 1h before start, no penalty)
const ALLOWED_TRANSITIONS = {
  Pending: { owner: ['Confirmed', 'Cancelled'], driver: ['Cancelled'] },
  Confirmed: { owner: ['Active_Charging', 'No_Show', 'Cancelled'], driver: ['Cancelled'] },
  Active_Charging: { owner: ['Completed'], driver: [] },
  Completed: { owner: [], driver: [] },
  Cancelled: { owner: [], driver: [] },
  No_Show: { owner: [], driver: [] },
  Expired: { owner: ['Cancelled'], driver: [] },
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

    // 1-HOUR CANCELLATION RESTRICTION FOR DRIVERS
    if (role === 'driver' && status === 'Cancelled') {
      const bookingStart = new Date(`${booking.date}T${booking.startTime}:00`);
      const diffMins = (bookingStart.getTime() - Date.now()) / (1000 * 60);
      if (diffMins < 60) {
        return res.status(400).json({
          success: false,
          message: 'Cancellation restricted. Bookings cannot be cancelled less than 1 hour before scheduled start time.'
        });
      }
    }

    const charger = station ? station.chargers.id(booking.chargerId) : null;

    // Apply charger state transitions
    if (status === 'Confirmed') {
      if (charger) charger.status = 'RESERVED';
    } else if (status === 'Active_Charging') {
      if (charger) charger.status = 'CHARGING';
      booking.actualStartedAt = new Date();
    } else if (status === 'Completed') {
      if (charger) {
        charger.status = 'AVAILABLE';
        charger.activeBookingId = null;
      }
      booking.actualEndedAt = new Date();

      const durationHours = booking.actualStartedAt
        ? Math.max(0.25, (booking.actualEndedAt - booking.actualStartedAt) / (1000 * 60 * 60))
        : 0.5;
      const power = charger ? charger.powerKW : 50;
      booking.energyConsumedKWh = durationHours * power;
      booking.totalCostLKR = Math.round(booking.energyConsumedKWh * booking.lockedPricePerKwh);
      booking.paymentStatus = 'Pending';
    } else if (status === 'No_Show' || status === 'Cancelled') {
      if (charger) {
        charger.status = 'AVAILABLE';
        charger.activeBookingId = null;
      }

      // 50% penalty applies for no-show, or for owner-side cancellations
      // AFTER approval. Driver cancellations are penalty-free.
      const wasApproved = ['Confirmed', 'Active_Charging'].includes(currentStatus);
      const penaltyApplies = status === 'No_Show' || (status === 'Cancelled' && wasApproved && role === 'owner');
      if (penaltyApplies) {
        const startTime = new Date(`${booking.date}T${booking.startTime}`);
        let endTime = new Date(`${booking.date}T${booking.endTime}`);
        if (Number.isNaN(endTime.getTime())) {
          endTime = new Date(startTime.getTime() + 30 * 60000);
        }
        const estDurationHours = Math.max(0.25, (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
        const power = charger ? charger.powerKW : 50;
        const estimatedTotalLKR = estDurationHours * power * booking.lockedPricePerKwh;

        booking.totalCostLKR = Math.round(estimatedTotalLKR * 0.5); // 50% penalty
        booking.paymentStatus = 'Not Done'; // Flag unpaid
      }
    }

    booking.status = status;
    await booking.save();
    if (station) await station.save();

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * PATCH /api/bookings/:id/payment - Update payment status (Done, Not Done, Pending)
 */
router.patch('/:id/payment', verifyToken, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!['Pending', 'Done', 'Not Done'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid paymentStatus. Allowed values: Pending, Done, Not Done'
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Only the station owner can settle payment
    const { ok, error, status: errStatus } = await authorizeBookingAccess(req, booking, { requireOwner: true });
    if (!ok) return res.status(errStatus).json({ success: false, message: error });

    booking.paymentStatus = paymentStatus;
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: booking
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// NOTE: The old /api/bookings/:id/auto-cancel endpoint was removed.
// Unapproved Pending bookings are now auto-marked 'Expired' by the server's
// 15-minute background job (kept in DB, charger released) — never deleted.

// 7. PUT /api/bookings/:id - Station Owner Edits Booking Details
// (single consolidated handler; driver users may not edit reservations)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const { ok, error, status: errStatus, user, station } = await authorizeBookingAccess(req, booking, { requireOwner: true });
    if (!ok) return res.status(errStatus).json({ success: false, message: error });

    // Only Pending / Confirmed bookings can be edited
    if (!['Pending', 'Confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Bookings in '${booking.status}' state cannot be edited.`
      });
    }

    const { date, startTime, endTime, chargerId, customerName, customerPhone, lockedPricePerKwh } = req.body;

    // Validate the new slot if time/date is changing
    const newDate = date || booking.date;
    const newStart = startTime || booking.startTime;
    const newEnd = endTime || booking.endTime;

    const startMins = timeToMinutes(newStart);
    const endMins = timeToMinutes(newEnd);
    if (!Number.isFinite(startMins) || !Number.isFinite(endMins) || startMins >= endMins) {
      return res.status(400).json({ success: false, message: 'Invalid time range (HH:MM, start before end).' });
    }

    // Contact details remain mandatory for walk-in bookings
    const finalName = (customerName !== undefined ? customerName : booking.customerName || '').trim();
    const finalPhone = (customerPhone !== undefined ? customerPhone : booking.customerPhone || '').trim();
    if (!finalName || !finalPhone) {
      return res.status(400).json({ success: false, message: 'Customer Name and Contact Phone are mandatory.' });
    }

    // If the slot moved, prevent overlap with another active booking
    const targetChargerId = chargerId && chargerId !== String(booking.chargerId) ? chargerId : booking.chargerId;
    if (newDate !== booking.date || newStart !== booking.startTime || newEnd !== booking.endTime || chargerId) {
      const overlapping = await findOverlappingBooking(
        booking.station,
        targetChargerId,
        newDate,
        newStart,
        newEnd,
        booking._id
      );
      if (overlapping) {
        return res.status(409).json({
          success: false,
          message: `The selected charger is already booked for an overlapping slot (${overlapping.startTime} - ${overlapping.endTime}).`
        });
      }
    }

    // Handle charger reassignment (release old, lock new)
    const oldChargerStr = String(booking.chargerId);
    if (targetChargerId !== oldChargerStr && station) {
      const newCharger = station.chargers.id(targetChargerId);
      if (!newCharger) {
        return res.status(404).json({ success: false, message: 'Target charger not found at this station.' });
      }
      if (newCharger.status !== 'AVAILABLE' && String(newCharger.activeBookingId) !== String(booking._id)) {
        return res.status(409).json({ success: false, message: `Target charger is not available. Current status: ${newCharger.status}` });
      }
      const oldCharger = station.chargers.id(oldChargerStr);
      if (oldCharger && String(oldCharger.activeBookingId) === String(booking._id)) {
        oldCharger.status = 'AVAILABLE';
        oldCharger.activeBookingId = null;
      }
      newCharger.status = 'RESERVED';
      newCharger.activeBookingId = booking._id;
      booking.chargerId = targetChargerId;
    }

    // Apply field updates
    booking.customerName = finalName;
    booking.customerPhone = finalPhone;
    booking.date = newDate;
    booking.startTime = newStart;
    booking.endTime = newEnd;
    if (typeof lockedPricePerKwh === 'number' && Number.isFinite(lockedPricePerKwh) && lockedPricePerKwh >= 0) {
      booking.lockedPricePerKwh = lockedPricePerKwh;
    }

    await booking.save();
    if (station) await station.save();

    return res.status(200).json({ success: true, message: 'Booking updated successfully', data: booking });
  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({ success: false, message: 'Failed to update booking', error: error.message });
  }
});

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

    // Release charger if locked by this booking
    if (booking.station && booking.chargerId) {
      const station = await Station.findById(booking.station);
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
    return res.status(200).json({ success: true, message: 'Booking deleted successfully.' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete booking', error: error.message });
  }
});

module.exports = router;