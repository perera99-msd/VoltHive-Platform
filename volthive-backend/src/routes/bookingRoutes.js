// volthive-backend/src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// 1. POST /api/bookings - Driver requests a reservation
router.post('/', verifyToken, async (req, res) => {
  const { stationId, chargerId, date, startTime, endTime, lockedPricePerKwh } = req.body;
  
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can make bookings.' });
    }

    const station = await Station.findById(stationId);
    if (!station) return res.status(404).json({ message: 'Station not found.' });

    // Find the specific physical charger
    const charger = station.chargers.id(chargerId);
    if (!charger) return res.status(404).json({ message: 'Specific charger not found.' });

    // Check if it's already taken right now
    if (charger.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'This charger is currently not available.' });
    }

    // Create the Financial Transaction Record
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

    // Lock the charger state so nobody else can book it simultaneously
    charger.status = 'PENDING_APPROVAL';
    charger.activeBookingId = newBooking._id;
    await station.save();

    res.status(201).json({ success: true, data: newBooking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error while creating booking.' });
  }
});

// 2. GET /api/bookings/driver - Get driver's history
router.get('/driver', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'driver') return res.status(403).json({ message: 'Access denied.' });

    const bookings = await Booking.find({ driver: user._id })
      .populate('station', 'stationName address location')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. GET /api/bookings/station/:stationId - Get existing bookings for a station (MUST BE BEFORE /:id routes)
router.get('/station/:stationId', verifyToken, async (req, res) => {
  try {
    const { stationId } = req.params;
    
    const bookings = await Booking.find({ station: stationId })
      .select('date startTime endTime status chargerId')
      .sort({ date: 1, startTime: 1 });
    
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching station bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. GET /api/bookings/owner - Get Owner's POS Queue
router.get('/owner', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'owner') return res.status(403).json({ message: 'Access denied.' });

    const myStations = await Station.find({ ownerId: user._id }).select('_id');
    const stationIds = myStations.map(s => s._id);

    const bookings = await Booking.find({ station: { $in: stationIds } })
      .populate('station', 'stationName address chargers')
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