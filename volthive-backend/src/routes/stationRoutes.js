const express = require('express');
const router = express.Router();

// Import controllers
const { 
  getSmartMatchStations,
  getAllStations,     // From your completed Sprint 2 task
  createStation       // From your completed Sprint 2 task
} = require('../controllers/stationController');

// Import authentication middleware to protect owner routes
const { protect } = require('../middleware/authMiddleware');

// ==========================================
// PUBLIC ROUTES (For EV Drivers / Public Map)
// ==========================================

/**
 * @route   GET /api/stations
 * @desc    Get all public charging stations (Public aggregation)
 * @access  Public
 */
router.get('/', getAllStations);

/**
 * @route   POST /api/stations/smart-match
 * @desc    Run Rule-Based Algorithm + AI Pricing to find top 3 Best Value stations
 * @access  Public
 */
router.post('/smart-match', getSmartMatchStations);


// ==========================================
// PROTECTED ROUTES (For Station Owners)
// ==========================================

/**
 * @route   POST /api/stations
 * @desc    Register a new charging station
 * @access  Private (Requires Owner JWT Token)
 */
router.post('/', protect, createStation);

// Note: Future routes for editing/deleting stations by the owner can be added here
// router.put('/:id', protect, updateStation);
// router.delete('/:id', protect, deleteStation);

module.exports = router;