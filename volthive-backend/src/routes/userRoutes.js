const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// POST /api/users - Create a new user in MongoDB
router.post('/', verifyToken, async (req, res) => {
  const { 
    name, 
    email, 
    role, 
    firebaseUid,
    telephone,
    nicOrBrc,
    address,
    district,
    town 
  } = req.body;

  try {
    let user = await User.findOne({ firebaseUid });
    if (user) {
      return res.status(400).json({ message: 'User already exists in database' });
    }
    
    // Create new user with all fields (driver will just not provide the owner fields)
    user = new User({ 
      name, 
      email, 
      role, 
      firebaseUid,
      telephone,
      nicOrBrc,
      address,
      district,
      town
    });
    
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/profile - Get logged-in user profile & role
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/profile - Update user profile details (name, address, telephone, etc.)
router.put('/profile', verifyToken, async (req, res) => {
  const { name, address, telephone, town, district } = req.body;
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (address !== undefined) user.address = address;
    if (telephone !== undefined) user.telephone = telephone;
    if (town !== undefined) user.town = town;
    if (district !== undefined) user.district = district;

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/vehicles - Add a vehicle to driver garage
router.post('/vehicles', verifyToken, async (req, res) => {
  const { make, model, year, batteryKWh, connector, maxKW, isPrimary } = req.body;
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isPrimary || user.vehicles.length === 0) {
      user.vehicles.forEach(v => { v.isPrimary = false; });
    }

    user.vehicles.push({
      make: make || 'EV',
      model: model || 'Model',
      year: year || '2025',
      batteryKWh: Number(batteryKWh) || 40,
      connector: connector || 'CCS2 Fast',
      maxKW: Number(maxKW) || 50,
      isPrimary: isPrimary || user.vehicles.length === 0
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/vehicles/:vehicleId - Remove vehicle
router.delete('/vehicles/:vehicleId', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.vehicles = user.vehicles.filter(v => v._id.toString() !== req.params.vehicleId);
    if (user.vehicles.length > 0 && !user.vehicles.some(v => v.isPrimary)) {
      user.vehicles[0].isPrimary = true;
    }
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error('Error removing vehicle:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/vehicles/:vehicleId/primary - Set primary vehicle
router.patch('/vehicles/:vehicleId/primary', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.vehicles.forEach(v => {
      v.isPrimary = v._id.toString() === req.params.vehicleId;
    });
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error('Error setting primary vehicle:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;