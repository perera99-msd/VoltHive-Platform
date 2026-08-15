// volthive-backend/src/controllers/stationController.js
const Station = require('../models/Station');
const User = require('../models/User');
const { getDynamicPriceMultiplier } = require('../services/aiService');
const { calculateBestValue } = require('../services/rankingService');
const { serializeStationForClient } = require('../utils/stationSerializer');
const { getStationEffectiveRate, isOverrideActive, getActivePlanEntry, buildChargerRateMap, getChargerEffectiveRateFromMap } = require('../utils/rateEngine');

// Find the station's active special event (next 7 days, within 10km) — real data.
const getActiveStationEvent = (station) => {
  if (!station || !Array.isArray(station.specialEvents) || station.specialEvents.length === 0) return null;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nextWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const [lon, lat] = (station.location && station.location.coordinates) || [null, null];

  const active = station.specialEvents.find((ev) => {
    if (!ev.date) return false;
    const evDate = new Date(ev.date);
    if (Number.isNaN(evDate.getTime())) return false;
    if (evDate < new Date(todayStr) || evDate > nextWeek) return false;
    if (ev.latitude != null && ev.longitude != null && lon != null && lat != null) {
      const dist = getDistanceKm(lat, lon, ev.latitude, ev.longitude);
      return dist <= 10;
    }
    return true;
  });
  return active || null;
};

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.getAllStations = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const total = await Station.countDocuments();
    const stations = await Station.find().skip(skip).limit(limit);
    const rateMap = await buildChargerRateMap(stations.flatMap((s) => (s.chargers || []).map((c) => c._id)));
    const normalizedStations = await Promise.all(stations.map((s) => serializeStationForClient(s, rateMap)));

    res.status(200).json({ 
      success: true, 
      count: normalizedStations.length, 
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: normalizedStations 
    });
  } catch (error) {
    console.error('Get All Stations Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getOwnerStations = async (req, res) => {
  try {
    const owner = await User.findOne({ firebaseUid: req.user.uid });
    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can access their stations.' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const total = await Station.countDocuments({ ownerId: owner._id });
    const stations = await Station.find({ ownerId: owner._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
const rateMap = await buildChargerRateMap(stations.flatMap((s) => (s.chargers || []).map((c) => c._id)));
    const normalizedStations = await Promise.all(stations.map((s) => serializeStationForClient(s, rateMap)));

    return res.status(200).json({ 
      success: true, 
      count: normalizedStations.length, 
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: normalizedStations 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.createStation = async (req, res) => {
  try {
    // 1. Validation no longer requires chargers!
    const requiredFields = ['stationName', 'location'];
    const missingFields = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');

    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    const owner = await User.findOne({ firebaseUid: req.user.uid });
    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only station owners can create stations.' });
    }

    req.body.ownerId = owner._id;
    if (req.body.pricePerKWh !== undefined && req.body.basePricePerKwh === undefined) {
      req.body.basePricePerKwh = req.body.pricePerKWh;
    }
    
    const station = await Station.create(req.body);

    const rateMap = await buildChargerRateMap((station.chargers || []).map((c) => c._id));
    res.status(201).json({ success: true, data: await serializeStationForClient(station, rateMap) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.updateStation = async (req, res) => {
  try {
    const owner = await User.findOne({ firebaseUid: req.user.uid });
    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can update stations.' });
    }

    let station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    if (String(station.ownerId) !== String(owner._id)) {
      return res.status(403).json({ success: false, message: 'You can update only your own stations.' });
    }

    // Validate chargers if they're being updated
    if (Array.isArray(req.body.chargers)) {
      const validStatuses = ['AVAILABLE', 'PENDING_APPROVAL', 'RESERVED', 'CHARGING', 'OFFLINE', 'MAINTENANCE'];
      req.body.chargers.forEach((charger, index) => {
        if (!charger.status || !validStatuses.includes(charger.status)) {
          throw new Error(`Charger ${index + 1}: Invalid status "${charger.status}". Must be one of: ${validStatuses.join(', ')}`);
        }
        if (!Number.isFinite(charger.powerKW) || charger.powerKW <= 0) {
          throw new Error(`Charger ${index + 1}: powerKW must be a positive number`);
        }
        if (!Number.isFinite(charger.basePricePerKwh) || charger.basePricePerKwh < 0) {
          throw new Error(`Charger ${index + 1}: basePricePerKwh must be a non-negative number`);
        }
        if (!charger.plugType) {
          throw new Error(`Charger ${index + 1}: plugType is required`);
        }
      });
    }

    // Merge new updates
    station = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    const rateMap = await buildChargerRateMap((station.chargers || []).map((c) => c._id));
    return res.status(200).json({ success: true, data: await serializeStationForClient(station, rateMap) });
  } catch (error) {
    console.error('Update Station Error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Server Error', error: error.message });
  }
};

exports.getStationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid station ID format' });
    }

    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    const rateMap = await buildChargerRateMap((station.chargers || []).map((c) => c._id));
    return res.status(200).json({ success: true, data: await serializeStationForClient(station, rateMap) });
  } catch (error) {
    console.error('Get Station Error:', error);
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
    return res.status(200).json({ success: true, message: 'Station rates updated successfully.', data: station.rateConfig });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getSmartMatchStations = async (req, res) => {
  try {
    const { userLat, userLng, plugType, plugTypes, currentBatteryLevel } = req.body;
    const latitude = Number(userLat);
    const longitude = Number(userLng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates. userLat and userLng are required numbers.' });
    }

    // Support both a single plugType and a multi-select plugTypes array
    const requestedPlugs = Array.isArray(plugTypes) && plugTypes.length > 0
      ? plugTypes.map(p => String(p))
      : (typeof plugType === 'string' && plugType ? [plugType] : []);

    if (requestedPlugs.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid plugType. At least one plug type is required.' });
    }

    const stationsNearby = await Station.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: 10000 // Strict 10 KM Radius
        }
      }
    });

    // Batch-load per-charger TOU Rate docs for ALL nearby chargers (one query)
    // so per-charger pricing (AI + TOU) is exact without N+1 lookups.
    const nearbyRateMap = await buildChargerRateMap(stationsNearby.flatMap((s) => (s.chargers || []).map((c) => c._id)));

    // ── PER-STATION AI: every station gets its OWN prediction ─────────────
    // Each station uses its own real coordinates (→ live Open-Meteo weather),
    // its own active special event, its own charger type and power output.
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6 ? 1 : 0;
    const isPeakHour = hour >= 17 && hour <= 20 ? 1 : 0;

    const MAX_AI_CALLS = 10; // latency cap; beyond this, reuse the nearest signal
    const topStations = stationsNearby.slice(0, MAX_AI_CALLS);
    const restStations = stationsNearby.slice(MAX_AI_CALLS);

    const enrichStation = (station) => {
      const stationObj = station.toObject();
      // Ranking price = the LOWEST live rate among the driver's matching,
      // AVAILABLE chargers — the price they would actually pay for their plug.
      const liveRates = (stationObj.chargers || [])
        .filter((c) => {
          const status = String(c.status || '').toUpperCase();
          const plugOk = requestedPlugs.length === 0 || requestedPlugs.includes(c.plugType);
          return plugOk && status === 'AVAILABLE';
        })
        .map((c) => getChargerEffectiveRateFromMap(stationObj, c, nearbyRateMap))
        .filter((r) => Number(r) > 0);
      const minChargerRate = liveRates.length > 0 ? Math.min(...liveRates) : 0;

      const stationEffective = getStationEffectiveRate(stationObj);
      const effectivePrice = minChargerRate > 0 ? minChargerRate : stationEffective;
      stationObj.currentDynamicPrice = effectivePrice;
      stationObj.basePricePerKwh = stationObj.basePricePerKwh || effectivePrice;
      stationObj.hasActiveOverride = !!(getActivePlanEntry(stationObj) || isOverrideActive(stationObj.activePriceOverride));
      return stationObj;
    };

    const enrichedNearby = await Promise.all(topStations.map(async (station) => {
      const activeEvent = getActiveStationEvent(station);
      const context = {
        hour,
        dayOfWeek: day,
        isWeekend,
        isPeakHour,
        weather: 'Clear', // AI service resolves LIVE weather for this station's coords
        event: activeEvent ? activeEvent.title : 'None',
        trafficScore: 4,
        lat: station.location.coordinates[1],
        lng: station.location.coordinates[0]
      };
      const stationData = {
        location: station.location,
        locationType: station.locationType || 'Urban Center',
        pricingProfile: station.pricingProfile || 'balanced',
        chargerType: station.chargers?.length
          ? station.chargers.reduce((a, b) => ((b.powerKW || 0) > (a.powerKW || 0) ? b : a)).plugType
          : 'Dc Fast Charge',
        maxPowerKW: station.chargers?.length ? Math.max(...station.chargers.map(c => c.powerKW || 50)) : 120
      };
      const aiPricing = await getDynamicPriceMultiplier(stationData, context);
      const stationObj = enrichStation(station);
      stationObj.demandStatus = aiPricing.ai_recommendation;
      stationObj.predictedOccupancy = aiPricing.predicted_occupancy;
      stationObj.aiMultiplier = aiPricing.suggested_multiplier;
      return stationObj;
    }));

    // Stations beyond the cap reuse the nearest station's AI signal (fallback)
    const fallback = enrichedNearby[0]
      ? {
          demandStatus: enrichedNearby[0].demandStatus,
          predictedOccupancy: enrichedNearby[0].predictedOccupancy,
          aiMultiplier: enrichedNearby[0].aiMultiplier
        }
      : { demandStatus: 'Normal Demand', predictedOccupancy: 'Unknown', aiMultiplier: 1.0 };

    const fallbackStations = restStations.map((station) => {
      const stationObj = enrichStation(station);
      stationObj.demandStatus = fallback.demandStatus;
      stationObj.predictedOccupancy = fallback.predictedOccupancy;
      stationObj.aiMultiplier = fallback.aiMultiplier;
      return stationObj;
    });

    const stationsWithPrices = [...enrichedNearby, ...fallbackStations];
    
    const batteryPercent = Number.isFinite(Number(currentBatteryLevel)) ? Number(currentBatteryLevel) : 50;
    const top3Stations = await calculateBestValue(
      { lat: latitude, lng: longitude }, 
      { plugTypes: requestedPlugs, currentBatteryLevel: batteryPercent }, 
      stationsWithPrices, 
      batteryPercent
    );
    const rateMap = await buildChargerRateMap(top3Stations.flatMap((s) => (s.chargers || []).map((c) => c._id)));
    const normalizedTop3 = await Promise.all(top3Stations.map((s) => serializeStationForClient(s, rateMap)));

    res.status(200).json({ success: true, count: normalizedTop3.length, data: normalizedTop3 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};