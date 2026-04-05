// volthive-backend/src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

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
    // Check user is a driver
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can make bookings.'
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

    // Check charger availability
    if (charger.status !== 'AVAILABLE') {
      return res.status(409).json({
        success: false,
        message: `Charger is not available. Current status: ${charger.status}`
      });
    }

    // Create booking record
    const newBooking = new Booking({
      driver: user._id,
      station: stationId,
      chargerId: chargerId,
      date,
      startTime,
      endTime,
      lockedPricePerKwh,
      status: 'Pending'
    });

    await newBooking.save();

    // Lock charger to prevent double-booking
    charger.status = 'PENDING_APPROVAL';
    charger.activeBookingId = newBooking._id;
    await station.save();

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

    const bookings = await Booking.find({ driver: user._id })
      .populate('station', 'stationName address location')
      .sort({ createdAt: -1 })
      .lean();
      
    res.status(200).json({
      success: true,
      count: bookings.length,
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
router.get('/station/:stationId', async (req, res) => {
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
 * GET /api/bookings/owner - Get owner's Point-of-Sale queue
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
        data: []
      });
    }

    // Get all pending bookings for these stations
    const bookings = await Booking.find({
      station: { $in: stationIds },
      status: { $in: ['Pending', 'Confirmed', 'Active_Charging'] }
    })
      .populate('driver', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 5. PATCH /api/bookings/:id/status - THE POS STATE MACHINE
router.patch('/:id/status', verifyToken, async (req, res) => {
  const { status } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const station = await Station.findById(booking.station);
    const charger = station.chargers.id(booking.chargerId);

    // STATE MACHINE LOGIC
    if (status === 'Confirmed') {
      charger.status = 'RESERVED';
    } 
    else if (status === 'Active_Charging') {
      charger.status = 'CHARGING';
      booking.actualStartedAt = new Date();
    } 
    else if (status === 'Completed') {
      charger.status = 'AVAILABLE';
      charger.activeBookingId = null;
      booking.actualEndedAt = new Date();
      
      // Calculate final bill
      const durationHours = (booking.actualEndedAt - booking.actualStartedAt) / (1000 * 60 * 60);
      booking.energyConsumedKWh = durationHours * charger.powerKW; 
      booking.totalCostLKR = booking.energyConsumedKWh * booking.lockedPricePerKwh;
    }
    else if (status === 'Cancelled' || status === 'No_Show') {
      charger.status = 'AVAILABLE';
      charger.activeBookingId = null;
    }

    booking.status = status;
    await booking.save();
    await station.save();
    
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 6. PATCH /api/bookings/:id/auto-cancel - Auto-cancel booking after 3 minutes
router.patch('/:id/auto-cancel', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    // Only auto-cancel if still pending
    if (booking.status !== 'Pending') {
      return res.status(400).json({ message: 'Booking is no longer pending.' });
    }

    const station = await Station.findById(booking.station);
    const charger = station.chargers.id(booking.chargerId);

    // Release the charger
    charger.status = 'AVAILABLE';
    charger.activeBookingId = null;

    booking.status = 'Cancelled';
    await booking.save();
    await station.save();
    
    res.status(200).json({ success: true, message: 'Booking auto-cancelled due to owner no-response', data: booking });
  } catch (error) {
    console.error('Error auto-cancelling booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;