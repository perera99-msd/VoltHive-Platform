const express = require('express');
const router = express.Router();

// Import controllers
const { 
  getSmartMatchStations,
  getAllStations,
  createStation,
  getStationById,
  getOwnerStations,
  deleteStation,
  updateStationRates,
  updateStation     // <--- ADD THIS IMPORT
} = require('../controllers/stationController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', getAllStations);
router.post('/smart-match', getSmartMatchStations);

router.get('/owner', protect, getOwnerStations);
router.get('/:id', getStationById);

router.post('/', protect, createStation);
router.delete('/:id', protect, deleteStation);
router.put('/:id/rates', protect, updateStationRates);

// Expose the PUT route allowing Chargers to be added to the Station Model
router.put('/:id', protect, updateStation);

module.exports = router;