const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// @route   POST /api/stations
// @desc    Register a new charging station (Owners only)
router.post('/', verifyToken, async (req, res) => {
  const { name, address, latitude, longitude, plugType, powerKW, pricePerKWh } = req.body;

  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user || user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Only owners can register stations.' });
    }

    const newStation = new Station({
      owner: user._id,
      name,
      address,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude] // MongoDB GeoJSON uses [longitude, latitude]
      },
      chargers: [{
        plugType,
        powerKW,
        status: 'Available'
      }],
      pricePerKWh
    });

    await newStation.save();
    res.status(201).json(newStation);

  } catch (error) {
    console.error('Error saving station:', error);
    res.status(500).json({ message: 'Server error while saving station.' });
  }
});

// @route   GET /api/stations
// @desc    Get all stations for the map aggregator
router.get('/', async (req, res) => {
  try {
    const stations = await Station.find();
    res.status(200).json(stations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ message: 'Server error while fetching stations.' });
  }
});

module.exports = router;