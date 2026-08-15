const Station = require('../models/Station');
const User = require('../models/User');
const Rate = require('../models/Rate');
const { getChargerEffectiveRateFromMap } = require('../utils/rateEngine');

// Helper to find station & charger by chargerId
const findStationByChargerId = async (chargerId) => {
  return await Station.findOne({ 'chargers._id': chargerId });
};

exports.getOwnerChargers = async (req, res) => {
  try {
    const owner = await User.findOne({ firebaseUid: req.user.uid });
    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can access chargers.' });
    }

    const stations = await Station.find({ ownerId: owner._id });
    const chargers = [];

    for (const s of stations) {
      const rateDocs = await Rate.find({ chargerId: { $in: s.chargers.map(c => c._id) } });
      const rateMap = new Map(rateDocs.map(r => [String(r.chargerId), r]));

      for (const c of s.chargers) {
        chargers.push({
          _id: c._id,
          stationId: s._id,
          stationName: s.stationName,
          plugType: c.plugType,
          powerKW: c.powerKW,
          basePricePerKwh: c.basePricePerKwh,
          currentRate: getChargerEffectiveRateFromMap(s, c, rateMap),
          status: c.status,
          rateConfig: rateMap.get(String(c._id)) || null
        });
      }
    }

    return res.status(200).json({ success: true, count: chargers.length, data: chargers });
  } catch (error) {
    console.error('Get Owner Chargers Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getChargerRates = async (req, res) => {
  try {
    const { id } = req.params; // chargerId
    const station = await findStationByChargerId(id);
    if (!station) return res.status(404).json({ success: false, message: 'Charger not found' });

    // Ownership check (read path)
    const owner = await User.findOne({ firebaseUid: req.user.uid });
    if (!owner || owner.role !== 'owner' || String(station.ownerId) !== String(owner._id)) {
      return res.status(403).json({ success: false, message: 'You can only view rates for your own chargers.' });
    }

    const charger = station.chargers.id(id);
    const rate = await Rate.findOne({ chargerId: id });

    const response = {
      charger: {
        _id: charger._id,
        stationId: station._id,
        stationName: station.stationName,
        plugType: charger.plugType,
        powerKW: charger.powerKW,
        basePricePerKwh: charger.basePricePerKwh,
        status: charger.status
      },
      rateConfig: rate || null
    };

    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Get Charger Rates Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.updateChargerRates = async (req, res) => {
  try {
    const owner = await User.findOne({ firebaseUid: req.user.uid });
    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can update charger rates.' });
    }

    const chargerId = req.params.id;
    const station = await Station.findOne({ 'chargers._id': chargerId });
    if (!station) return res.status(404).json({ success: false, message: 'Charger not found' });
    if (String(station.ownerId) !== String(owner._id)) {
      return res.status(403).json({ success: false, message: 'You can only update your own chargers.' });
    }

    const { baseRate, customRates } = req.body;
    if (!Number.isFinite(Number(baseRate)) || Number(baseRate) < 0) {
      return res.status(400).json({ success: false, message: 'baseRate must be a non-negative number.' });
    }

    if (!Array.isArray(customRates)) {
      return res.status(400).json({ success: false, message: 'customRates must be an array.' });
    }

    // Basic validation for customRates entries
    for (const entry of customRates) {
      if (typeof entry.dayOfWeek !== 'number' || entry.dayOfWeek < 0 || entry.dayOfWeek > 6) {
        return res.status(400).json({ success: false, message: 'Invalid dayOfWeek in customRates.' });
      }
      if (!entry.startTime || typeof entry.rate !== 'number') {
        return res.status(400).json({ success: false, message: 'Each customRate must have startTime and numeric rate.' });
      }
    }

    const updated = await Rate.findOneAndUpdate(
      { chargerId },
      { chargerId, ownerId: owner._id, baseRate: Number(baseRate), customRates },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({ success: true, message: 'Charger rates updated', data: updated });
  } catch (error) {
    console.error('Update Charger Rates Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Compute current rate for a charger based on date/time
exports.getCurrentChargerRate = async (req, res) => {
  try {
    const { id } = req.params; // chargerId
    const station = await findStationByChargerId(id);
    if (!station) return res.status(404).json({ success: false, message: 'Charger not found' });

    const charger = station.chargers.id(id);
    const rateDoc = await Rate.findOne({ chargerId: id });

    const now = new Date();
    const day = now.getDay();
    const hhmm = now.toTimeString().slice(0,5); // 'HH:MM'

    if (!rateDoc) {
      return res.status(200).json({ success: true, data: { currentRate: charger.basePricePerKwh || station.basePricePerKwh } });
    }

    // Find matching custom rate where day matches and time within range
    const match = rateDoc.customRates.find((r) => {
      if (r.dayOfWeek !== day) return false;
      const start = r.startTime || '00:00';
      const end = r.endTime || '23:59';
      return start <= hhmm && hhmm <= end;
    });

    const currentRate = match ? match.rate : rateDoc.baseRate;
    return res.status(200).json({ success: true, data: { currentRate } });
  } catch (error) {
    console.error('Get Current Charger Rate Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.createCharger = async (req, res) => {
  try {
    const owner = await User.findOne({ firebaseUid: req.user.uid });
    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can create chargers.' });
    }

    const { stationId, plugType, powerKW, basePricePerKwh } = req.body;
    const station = await Station.findById(stationId);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found.' });
    if (String(station.ownerId) !== String(owner._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this station.' });
    }

    station.chargers.push({
      plugType: plugType || 'CCS2',
      powerKW: Number(powerKW) || 50,
      basePricePerKwh: Number(basePricePerKwh) || 85,
      status: 'AVAILABLE'
    });

    await station.save();
    return res.status(201).json({ success: true, message: 'Charger added', data: station.chargers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.updateCharger = async (req, res) => {
  try {
    const owner = await User.findOne({ firebaseUid: req.user.uid });
    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can edit chargers.' });
    }

    const chargerId = req.params.id;
    const station = await Station.findOne({ 'chargers._id': chargerId });
    if (!station) return res.status(404).json({ success: false, message: 'Charger not found.' });
    if (String(station.ownerId) !== String(owner._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const charger = station.chargers.id(chargerId);
    const { plugType, powerKW, basePricePerKwh, status } = req.body;
    if (plugType) charger.plugType = plugType;
    if (typeof powerKW !== 'undefined') charger.powerKW = Number(powerKW);
    if (typeof basePricePerKwh !== 'undefined') charger.basePricePerKwh = Number(basePricePerKwh);
    if (status) charger.status = status;

    await station.save();
    return res.status(200).json({ success: true, message: 'Charger updated', data: charger });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.deleteCharger = async (req, res) => {
  try {
    const owner = await User.findOne({ firebaseUid: req.user.uid });
    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can delete chargers.' });
    }

    const chargerId = req.params.id;
    const station = await Station.findOne({ 'chargers._id': chargerId });
    if (!station) return res.status(404).json({ success: false, message: 'Charger not found.' });
    if (String(station.ownerId) !== String(owner._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    station.chargers.pull(chargerId);
    await station.save();
    await Rate.deleteOne({ chargerId });
    return res.status(200).json({ success: true, message: 'Charger removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
