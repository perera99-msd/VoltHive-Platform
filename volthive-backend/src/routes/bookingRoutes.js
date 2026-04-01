const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// POST /api/bookings - Create a new booking (Drivers only)
router.post('/', verifyToken, async (req, res) => {
  const { stationId, date, startTime, endTime } = req.body;
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can make bookings.' });
    }

    const newBooking = new Booking({
      driver: user._id,
      station: stationId,
      date,
      startTime,
      endTime
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error while creating booking.' });
  }
});

// GET /api/bookings/driver - Get all bookings for the logged-in driver
router.get('/driver', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'driver') return res.status(403).json({ message: 'Access denied.' });

    // Populate the station details so the frontend can show the station name/address
    const bookings = await Booking.find({ driver: user._id })
                                  .populate('station', 'name address')
                                  .sort({ date: 1, startTime: 1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching driver bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/owner - Get all bookings for stations owned by the logged-in owner
router.get('/owner', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'owner') return res.status(403).json({ message: 'Access denied.' });

    // 1. Find all stations owned by this user
    const myStations = await Station.find({ owner: user._id }).select('_id');
    const stationIds = myStations.map(station => station._id);

    // 2. Find all bookings that match those station IDs
    const incomingBookings = await Booking.find({ station: { $in: stationIds } })
                                          .populate('station', 'name')
                                          .populate('driver', 'name email')
                                          .sort({ date: 1, startTime: 1 });
    
    res.status(200).json(incomingBookings);
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/bookings/:id/status - Update booking status (Owners)
router.patch('/:id/status', verifyToken, async (req, res) => {
  const { status } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    booking.status = status;
    await booking.save();
    
    res.status(200).json(booking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;