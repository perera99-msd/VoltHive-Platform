const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// POST /api/users - Create a new user in MongoDB
router.post('/', verifyToken, async (req, res) => {
  const { name, email, role, firebaseUid } = req.body;
  try {
    let user = await User.findOne({ firebaseUid });
    if (user) {
      return res.status(400).json({ message: 'User already exists in database' });
    }
    user = new User({ name, email, role, firebaseUid });
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

module.exports = router;