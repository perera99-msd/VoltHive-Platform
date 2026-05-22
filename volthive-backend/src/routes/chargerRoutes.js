const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getOwnerChargers,
  getChargerRates,
  updateChargerRates,
  getCurrentChargerRate
} = require('../controllers/chargerController');

router.get('/owner', protect, getOwnerChargers);
router.get('/:id/rates', protect, getChargerRates);
router.put('/:id/rates', protect, updateChargerRates);
router.get('/:id/current-rate', getCurrentChargerRate); // public endpoint for drivers

module.exports = router;
