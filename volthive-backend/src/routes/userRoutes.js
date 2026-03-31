const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// POST /api/users - Create a new user in MongoDB
// We use verifyToken to ensure only authenticated Firebase users can hit this route
router.post('/', verifyToken, async (req, res) => {
  const { name, email, role, firebaseUid } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ firebaseUid });
    if (user) {
      return res.status(400).json({ message: 'User already exists in database' });
    }

    // Create new user based on the schema we built earlier
    user = new User({
      name,
      email,
      role,
      firebaseUid
    });

    await user.save();
    res.status(201).json(user);

  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;