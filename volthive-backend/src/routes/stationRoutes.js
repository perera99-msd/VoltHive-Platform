const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// POST /api/stations - Create a new station
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Owners only.' });
    }

    const { name, address, latitude, longitude, plugType, powerKW, pricePerKWh } = req.body;

    const newStation = new Station({
      owner: user._id,
      name,
      address,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude] // [lng, lat]
      },
      chargers: [{ plugType, powerKW, status: 'Available' }],
      pricePerKWh
    });

    await newStation.save();
    res.status(201).json(newStation);
  } catch (error) {
    res.status(500).json({ message: 'Error saving station', error: error.message });
  }
});

module.exports = router;