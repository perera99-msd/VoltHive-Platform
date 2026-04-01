const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// POST /api/stations - Register a new station (Owners only)
router.post('/', verifyToken, async (req, res) => {
  const { name, address, latitude, longitude, plugType, powerKW, pricePerKWh } = req.body;
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Owners only.' });
    }
    const newStation = new Station({
      owner: user._id,
      name, address,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      chargers: [{ plugType, powerKW, status: 'Available' }],
      pricePerKWh
    });
    await newStation.save();
    res.status(201).json(newStation);
  } catch (error) {
    console.error('Error saving station:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/stations/my-stations - Fetch stations owned by the logged-in user
router.get('/my-stations', verifyToken, async (req, res) => {
  try {
    // 1. Find the owner in MongoDB using their Firebase token UID
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user || user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Owners only.' });
    }

    // 2. Query the Stations collection for documents matching this owner's _id
    const myStations = await Station.find({ owner: user._id }).sort({ createdAt: -1 });
    
    res.status(200).json(myStations);
  } catch (error) {
    console.error('Error fetching owner stations:', error);
    res.status(500).json({ message: 'Server error while fetching your stations.' });
  }
});

// GET /api/stations - Fetch all stations for the map
router.get('/', async (req, res) => {
  try {
    const stations = await Station.find();
    res.status(200).json(stations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;