const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// POST /api/users - Create or heal a user in MongoDB
router.post('/', verifyToken, async (req, res) => {
  const { 
    name, 
    email, 
    role, 
    firebaseUid,
    telephone,
    mobile,
    nicOrBrc,
    address,
    district,
    town 
  } = req.body;

  const uid = firebaseUid || req.user.uid;
  const userEmail = (email || req.user.email || '').toLowerCase();
  const userName = name || req.user.name || (userEmail ? userEmail.split('@')[0] : 'VoltHive User');

  const orConditions = [{ firebaseUid: uid }];
  if (userEmail) orConditions.push({ email: userEmail });

  try {
    let user = await User.findOne({ $or: orConditions });
    if (user) {
      user.firebaseUid = uid;
      if (userName && userName !== 'VoltHive User') user.name = userName;
      if (telephone || mobile) user.telephone = telephone || mobile;
      await user.save();
      return res.status(200).json(user);
    }
    
    user = new User({ 
      name: userName, 
      email: userEmail, 
      role: role || 'driver', 
      firebaseUid: uid,
      telephone: telephone || mobile || '',
      nicOrBrc,
      address,
      district,
      town
    });
    
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/users/profile - Get logged-in user profile & role
router.get('/profile', verifyToken, async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user && req.user.email) {
      user = await User.findOne({ email: req.user.email.toLowerCase() });
      if (user) {
        user.firebaseUid = req.user.uid;
        await user.save();
      }
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
      connector: connector || 'CCS2',
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