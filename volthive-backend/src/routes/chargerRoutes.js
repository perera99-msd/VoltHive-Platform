const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getOwnerChargers,
  getChargerRates,
  updateChargerRates,
  getCurrentChargerRate,
  createCharger,
  updateCharger,
  deleteCharger
} = require('../controllers/chargerController');

router.get('/owner', protect, getOwnerChargers);
router.post('/', protect, createCharger);
router.put('/:id', protect, updateCharger);
router.delete('/:id', protect, deleteCharger);

router.get('/:id/rates', protect, getChargerRates);
router.put('/:id/rates', protect, updateChargerRates);
router.get('/:id/current-rate', protect, getCurrentChargerRate);

module.exports = router;
