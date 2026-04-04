// volthive-backend/src/controllers/stationController.js
const Station = require('../models/Station');
const User = require('../models/User');
const { getDynamicPriceMultiplier } = require('../services/aiService');
const { calculateBestValue } = require('../services/rankingService');
const { serializeStationForClient } = require('../utils/stationSerializer');

// ==========================================
// SPRINT 2: CORE CRUD OPERATIONS
// ==========================================

exports.getAllStations = async (req, res) => {
  try {
    const stations = await Station.find();
    const normalizedStations = stations.map(serializeStationForClient);

    res.status(200).json({
      success: true,
      count: normalizedStations.length,
      data: normalizedStations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.createStation = async (req, res) => {
  try {
    const requiredFields = ['stationName', 'location', 'chargerType', 'powerOutputKW', 'basePricePerKwh'];
    const missingFields = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    const owner = await User.findOne({ firebaseUid: req.user.uid });
    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only station owners can create stations.',
      });
    }

    // Attach the logged-in owner's MongoDB user id
    req.body.ownerId = owner._id;

    // Normalize key names used by frontend form versions
    if (req.body.pricePerKWh !== undefined && req.body.basePricePerKwh === undefined) {
      req.body.basePricePerKwh = req.body.pricePerKWh;
    }
    
    const station = await Station.create(req.body);
    
    res.status(201).json({
      success: true,
      data: serializeStationForClient(station)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getStationById = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    return res.status(200).json({
      success: true,
      data: serializeStationForClient(station),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.deleteStation = async (req, res) => {
  try {
    const owner = await User.findOne({ firebaseUid: req.user.uid });
    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can delete stations.' });
    }

    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    if (String(station.ownerId) !== String(owner._id)) {
      return res.status(403).json({ success: false, message: 'You can delete only your own stations.' });
    }

    await station.deleteOne();

    return res.status(200).json({ success: true, message: 'Station deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.updateStationRates = async (req, res) => {
  try {
    const owner = await User.findOne({ firebaseUid: req.user.uid });
    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can update station rates.' });
    }

    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    if (String(station.ownerId) !== String(owner._id)) {
      return res.status(403).json({ success: false, message: 'You can update only your own stations.' });
    }

    const { baseRate, customRates } = req.body;

    if (!Number.isFinite(Number(baseRate)) || Number(baseRate) < 0) {
      return res.status(400).json({ success: false, message: 'baseRate must be a non-negative number.' });
    }

    if (!Array.isArray(customRates)) {
      return res.status(400).json({ success: false, message: 'customRates must be an array.' });
    }

    station.rateConfig = {
      baseRate: Number(baseRate),
      customRates: customRates.map((entry) => ({
        dayOfWeek: Number(entry.dayOfWeek),
        startTime: String(entry.startTime || ''),
        endTime: String(entry.endTime || ''),
        rate: Number(entry.rate),
      })),
    };

    await station.save();

    return res.status(200).json({
      success: true,
      message: 'Station rates updated successfully.',
      data: station.rateConfig,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};


// ==========================================
// NEW: SMART MATCH ALGORITHM
// ==========================================

exports.getSmartMatchStations = async (req, res) => {
  try {
    const { userLat, userLng, plugType, currentBatteryLevel } = req.body;
    const latitude = Number(userLat);
    const longitude = Number(userLng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. userLat and userLng are required numbers.',
      });
    }

    if (!plugType || typeof plugType !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid plugType. A string plugType is required.',
      });
    }

    // 1. Find stations within a 15km radius using MongoDB Geospatial Query
    const stationsNearby = await Station.find({
      location: {
        $near: {
          $geometry: {
             type: 'Point',
             coordinates: [longitude, latitude]
          },
          $maxDistance: 15000 // 15,000 meters = 15km
        }
      }
    });

    // 2. Fetch AI Pricing (Mocked context for now, easily swapped for real API later)
    const currentContext = {
      hour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6 ? 1 : 0,
      isPeakHour: (new Date().getHours() >= 17 && new Date().getHours() <= 20) ? 1 : 0,
      weather: 'Clear', 
      event: 'None',
      trafficScore: 4 
    };

    const aiPricing = await getDynamicPriceMultiplier({}, currentContext);

    // 3. Apply AI Price to all nearby stations
    const stationsWithPrices = stationsNearby.map(station => {
      const stationObj = station.toObject(); 
      stationObj.currentDynamicPrice = stationObj.basePricePerKwh * aiPricing.suggested_multiplier;
      stationObj.demandStatus = aiPricing.ai_recommendation;
      return stationObj;
    });

    // 4. Run the Best Value Rule-Based Algorithm
    const userCarDetails = { plugType, currentBatteryLevel };
    const userLocation = { lat: latitude, lng: longitude };
    
    const top3Stations = await calculateBestValue(userLocation, userCarDetails, stationsWithPrices);
    const normalizedTop3 = top3Stations.map(serializeStationForClient);

    res.status(200).json({
      success: true,
      count: normalizedTop3.length,
      data: normalizedTop3
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};