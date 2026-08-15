const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const verifyToken = require('../middleware/authMiddleware');
const Station = require('../models/Station');
const User = require('../models/User');
const { roundRateLKR } = require('../utils/rateEngine');
let EventConfig = null;
try {
  EventConfig = require('../models/EventConfig');
} catch (e) {
  console.warn('EventConfig model not loaded');
}

/**
 * Verify the authenticated user owns the given station.
 * Returns the owner User doc on success, otherwise responds + returns null.
 */
const requireStationOwner = async (req, res, station) => {
  const owner = await User.findOne({ firebaseUid: req.user.uid });
  if (!owner || owner.role !== 'owner') {
    res.status(403).json({ error: 'Only station owners can access this station.' });
    return null;
  }
  if (String(station.ownerId) !== String(owner._id)) {
    res.status(403).json({ error: 'You can only manage your own stations.' });
    return null;
  }
  return owner;
};

// Haversine formula distance calculation in kilometers
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
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

// In-Memory Fallback Cockpit State
let memoryCockpitState = {
  autoFeedEnabled: true,
  activeCricketMatch: {
    eventName: "Sri Lanka vs India Asia Cup Final",
    venue: "R. Premadasa Stadium, Colombo",
    isActive: true,
    expectedSurge: "Extreme Surge (+25% AI Surge)",
    date: "Today, 07:00 PM"
  },
  manualOverrides: {
    weather: "Clear",
    trafficIndex: 4,
    isPeakOverride: false
  }
};

/**
 * GET /api/ai/health
 */
router.get('/health', async (req, res) => {
  try {
    const aiServiceUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    const response = await axios.get(`${aiServiceUrl}/api/ai/health`, { timeout: 3000 });
    res.status(200).json({ status: 'ok', aiService: response.data });
  } catch (error) {
    res.status(503).json({ status: 'error', aiService: { status: 'offline', model_loaded: false } });
  }
});

/**
 * GET /api/ai/metrics
 * Proxy model comparison benchmark table
 */
router.get('/metrics', verifyToken, async (req, res) => {
  try {
    const aiServiceUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    const response = await axios.get(`${aiServiceUrl}/api/ai/metrics`, { timeout: 3000 });
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(503).json({ error: 'AI Service Offline' });
  }
});

/**
 * GET & POST /api/ai/cockpit
 * Manage Cricket Matches and Input Variable Cockpit
 */
router.get('/cockpit', verifyToken, async (req, res) => {
  try {
    if (EventConfig && mongoose.connection.readyState === 1) {
      let cfg = await EventConfig.findOne({ configId: 'global_cockpit' });
      if (!cfg) {
        cfg = await EventConfig.create({ configId: 'global_cockpit', ...memoryCockpitState });
      }
      return res.status(200).json(cfg);
    }
  } catch (e) {}
  return res.status(200).json(memoryCockpitState);
});

router.post('/cockpit', verifyToken, async (req, res) => {
  const payload = req.body || {};
  if ('autoFeedEnabled' in payload) memoryCockpitState.autoFeedEnabled = payload.autoFeedEnabled;
  if ('activeCricketMatch' in payload) memoryCockpitState.activeCricketMatch = { ...memoryCockpitState.activeCricketMatch, ...payload.activeCricketMatch };
  if ('manualOverrides' in payload) memoryCockpitState.manualOverrides = { ...memoryCockpitState.manualOverrides, ...payload.manualOverrides };

  try {
    if (EventConfig && mongoose.connection.readyState === 1) {
      let cfg = await EventConfig.findOneAndUpdate(
        { configId: 'global_cockpit' },
        { $set: memoryCockpitState, lastUpdated: new Date() },
        { upsert: true, new: true }
      );
      return res.status(200).json({ status: 'success', config: cfg });
    }
  } catch (e) {}

  // Also proxy update to Python Microservice if online
  try {
    const aiServiceUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    await axios.post(`${aiServiceUrl}/api/ai/cockpit`, memoryCockpitState, { timeout: 2000 });
  } catch (e) {}

  return res.status(200).json({ status: 'success', config: memoryCockpitState });
});

/**
 * GET /api/ai/pricing-suggestion
 */
router.get('/pricing-suggestion', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isWeekend = (day === 0 || day === 6);
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 21);

    const environmentalData = {
      hour_of_day: hour,
      day_of_week: day,
      is_weekend: isWeekend ? 1 : 0,
      is_peak_hour: isPeakHour ? 1 : 0,
      // Weather/temperature/precipitation/month are resolved by the AI service
      // itself (live per-location Open-Meteo) — no fabricated values sent.
      local_event: memoryCockpitState.activeCricketMatch.isActive ? 'Sports Event' : 'None'
    };

    // Optional real location -> Flask fetches live weather for that lat/lng
    const qLat = Number(req.query.lat);
    const qLng = Number(req.query.lng);
    if (Number.isFinite(qLat) && Number.isFinite(qLng)) {
      environmentalData.latitude = qLat;
      environmentalData.longitude = qLng;
    }
    if (req.query.locationType) environmentalData.location_type = req.query.locationType;
    if (req.query.chargerType) environmentalData.charger_type = req.query.chargerType;
    if (req.query.pricingProfile) environmentalData.pricing_profile = req.query.pricingProfile;

    const aiServiceUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    const aiResponse = await axios.post(`${aiServiceUrl}/api/ai/suggest-price`, environmentalData, { timeout: 3000 });
    return res.status(200).json({ ...aiResponse.data, timestamp: now.toISOString(), context: environmentalData });
  } catch (error) {
    return res.status(503).json({ error: 'AI Service Offline' });
  }
});

/**
 * GET /api/ai/forecast
 */
router.get('/forecast', verifyToken, async (req, res) => {
  try {
    const aiServiceUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    const response = await axios.post(`${aiServiceUrl}/api/ai/forecast`, {}, { timeout: 3000 });
    return res.status(200).json(response.data);
  } catch (error) {
    const now = new Date();
    // Honest offline state — no fabricated weather or "live" labels.
    return res.status(200).json({
      status: "success",
      aiConnected: false,
      weatherConnected: false,
      weather: {
        condition: "Unavailable",
        temp: null,
        source: "AI service offline — no live data"
      },
      cockpit: memoryCockpitState,
      hourly: [],
      daily: [],
      lastUpdated: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
  }
});

/**
 * GET /api/ai/station-forecast/:stationId
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
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

/**
 * GET /api/ai/station-forecast/:stationId or GET /api/ai/forecast/:stationId
 * Location-based forecast & weather for 1 specific station
 */
router.get(['/station-forecast/:stationId', '/forecast/:stationId'], verifyToken, async (req, res) => {
  try {
    const st = await Station.findById(req.params.stationId);
    if (!st) return res.status(404).json({ error: 'Station not found' });

    const owner = await requireStationOwner(req, res, st);
    if (!owner) return; // response already sent

    const coords = st.location?.coordinates || [79.8612, 6.9271]; // [lon, lat]
    const lon = coords[0];
    const lat = coords[1];

    // Fetch Open-Meteo live weather specifically for this lat/lon
    let weatherCond = "Clear";
    let tempC = 30.0;
    let weatherConnected = true;
    try {
      const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
      const mRes = await axios.get(meteoUrl, { timeout: 3000 });
      tempC = mRes.data?.current?.temperature_2m || 30.0;
      const code = mRes.data?.current?.weather_code || 0;
      if ([1,2,3].includes(code)) weatherCond = "Cloudy";
      else if ([45,48].includes(code)) weatherCond = "Fog";
      else if (code >= 51 && code <= 82) weatherCond = "Rain";
      else if (code >= 95) weatherCond = "Storm";
    } catch (e) {
      weatherConnected = false;
      console.warn('Open-Meteo per-station fetch error, using fallback weather');
    }

    // Check station's manual special events calendar within next 7 days & within 10km radius
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const activeEvents = (st.specialEvents || []).filter(ev => {
      if (!ev.date) return false;
      const evDate = new Date(ev.date);
      if (isNaN(evDate.getTime())) return false;

      const todayStr = now.toISOString().split('T')[0];
      const todayDate = new Date(todayStr);
      const isWithinDate = evDate >= todayDate && evDate <= nextWeek;
      if (!isWithinDate) return false;

      // Distance radius check (10km)
      if (ev.latitude != null && ev.longitude != null) {
        const dist = getDistanceFromLatLonInKm(lat, lon, ev.latitude, ev.longitude);
        return dist <= 10;
      }
      return true;
    });
    const hasSpecialEvent = activeEvents.length > 0;
    const eventTitle = hasSpecialEvent ? activeEvents[0].title : "None";

    // Calculate station power capacity from chargers if available
    const maxPowerKW = (st.chargers && st.chargers.length > 0)
      ? Math.max(...st.chargers.map(c => c.powerKW || 50))
      : 120;

    // Representative charger type from the station's REAL hardware
    // (highest-power plug) so the forecast isn't stuck on the default.
    const repCharger = st.chargers && st.chargers.length > 0
      ? st.chargers.reduce((a, b) => ((b.powerKW || 0) > (a.powerKW || 0) ? b : a))
      : null;
    const chargerType = repCharger ? repCharger.plugType : 'Dc Fast Charge';

    // Call Flask AI Microservice with lat, lon, power, and event
    const aiServiceUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    let aiResData = null;
    try {
      const pRes = await axios.post(`${aiServiceUrl}/api/ai/forecast`, {
        latitude: lat,
        longitude: lon,
        weather_condition: weatherCond,
        power_output_kw: maxPowerKW,
        charger_type: chargerType,
        location_type: st.locationType || 'Urban Center',
        pricing_profile: st.pricingProfile || 'balanced',
        local_event: hasSpecialEvent ? (activeEvents[0]?.title || "Special Event") : "None"
      }, { timeout: 3000 });
      aiResData = pRes.data;
    } catch (err) {
      aiResData = null;
    }

    // Auto-reversion: clear expired legacy override + expired price-plan slots.
    // (The plan model never mutates the station's base rate — each scheduled
    // slot simply stops applying once its hour passes.)
    if (st.activePriceOverride && st.activePriceOverride.expiresAt && new Date() > new Date(st.activePriceOverride.expiresAt)) {
      st.activePriceOverride = null;
    }
    if (Array.isArray(st.pricePlan) && st.pricePlan.length) {
      const before = st.pricePlan.length;
      st.pricePlan = st.pricePlan.filter(p => !p.expiresAt || new Date(p.expiresAt).getTime() > Date.now());
      if (st.pricePlan.length !== before) await st.save();
    }

    // Currently-live plan entry (matches the current hour slot)
    const pad2 = (n) => String(n).padStart(2, '0');
    const liveSlot = `${pad2(new Date().getHours())}:00`;
    const livePlanEntry = (st.pricePlan || []).find(
      p => p.hourSlot === liveSlot && p.expiresAt && new Date() < new Date(p.expiresAt)
    ) || null;

    const hourly = aiResData?.hourly || [];
    const daily = aiResData?.daily || [];

    return res.status(200).json({
      status: "success",
      aiConnected: !!aiResData,
      weatherConnected: weatherConnected,
      station: { 
        id: st._id, 
        name: st.stationName, 
        city: st.address || 'Network Hub', 
        coordinates: [lat, lon],
        basePricePerKwh: st.basePricePerKwh || 85,
        pricingProfile: st.pricingProfile || 'balanced',
        pricePlan: st.pricePlan || [],
        activePriceOverride: livePlanEntry || (st.activePriceOverride && new Date() < new Date(st.activePriceOverride.expiresAt) ? st.activePriceOverride : null)
      },
      weather: { condition: weatherCond, temp: tempC, source: weatherConnected ? `Open-Meteo Live API (${lat.toFixed(2)}, ${lon.toFixed(2)})` : "Fallback Weather Feed" },
      specialEvents: st.specialEvents || [],
      activeEvent: hasSpecialEvent ? activeEvents[0] : null,
      hourly: hourly,
      daily: daily,
      lastUpdated: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/apply-price-override/:stationId
 * Adds (or updates) an AI-recommended rate for a single hour slot in the
 * station's SCHEDULED PRICE PLAN. Multiple hours can be scheduled at once.
 * Each slot expires at the end of its hour and auto-reverts to the station's
 * normal base rate — the station's base price is NEVER permanently changed.
 * Drivers only see the AI rate during the scheduled hour.
 */
router.post('/apply-price-override/:stationId', verifyToken, async (req, res) => {
  try {
    const { hourSlot, multiplier, calculatedRate } = req.body;
    const st = await Station.findById(req.params.stationId);
    if (!st) return res.status(404).json({ error: 'Station not found' });

    const owner = await requireStationOwner(req, res, st);
    if (!owner) return; // response already sent

    const baseRate = Number(st.basePricePerKwh) || 85;
    const mult = Number(multiplier) || 1.0;
    // If a concrete rate is sent, trust it; otherwise derive the station
    // reference rate from baseRate x multiplier so the AI surge is real.
    const effectiveRate = Number(calculatedRate) > 0 ? Number(calculatedRate) : roundRateLKR(baseRate * mult);

    // Resolve the slot label ("HH:00") from the request, defaulting to the
    // current hour if none given. Accepts both "18" and "18:00".
    const now = new Date();
    const pad2 = (n) => String(n).padStart(2, '0');
    const hourStr = String(hourSlot || '').trim();
    let slotHour = null;
    if (/^\d{1,2}$/.test(hourStr)) {
      slotHour = Number(hourStr);
    } else {
      const m = hourStr.match(/^(\d{1,2}):00$/);
      if (m) slotHour = Number(m[1]);
    }
    const slotLabel = (slotHour !== null && slotHour >= 0 && slotHour <= 23)
      ? `${pad2(slotHour)}:00`
      : `${pad2(now.getHours())}:00`;

    // Expiry: 23:59:59 of the chosen hour slot (e.g. "18:00" -> 18:59:59).
    // If that hour already started, keep the slot for the next occurrence.
    let expiresAt = new Date(now);
    expiresAt.setMinutes(0, 0, 0);
    if (slotHour !== null && slotHour >= 0 && slotHour <= 23) {
      expiresAt.setHours(slotHour);
      if (expiresAt.getTime() <= now.getTime()) expiresAt.setDate(expiresAt.getDate() + 1);
    }
    expiresAt.setMinutes(59, 59, 999);

    // Drop stale slots first so the plan stays clean.
    st.pricePlan = (st.pricePlan || []).filter(p => !p.expiresAt || new Date(p.expiresAt).getTime() > now.getTime());

    const entry = {
      hourSlot: slotLabel,
      effectiveRate,
      originalRate: baseRate,
      multiplier: mult,
      expiresAt,
      appliedAt: new Date()
    };

    const existingIdx = st.pricePlan.findIndex(p => p.hourSlot === slotLabel);
    if (existingIdx >= 0) st.pricePlan[existingIdx] = entry;
    else st.pricePlan.push(entry);

    await st.save();

    // Currently-live entry (only if the scheduled slot is the current hour)
    const liveSlot = `${pad2(now.getHours())}:00`;
    const live = st.pricePlan.find(p => p.hourSlot === liveSlot && p.expiresAt && new Date() < new Date(p.expiresAt)) || null;

    return res.status(200).json({
      status: 'success',
      pricePlan: st.pricePlan,
      activePriceOverride: live,
      basePricePerKwh: baseRate,
      effectiveRate
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/price-plan/:stationId
 * Adds (or updates) an AI-recommended multiplier for a single hour slot in the
 * station's scheduled price plan. This is the endpoint the owner dashboard
 * calls when toggling "Apply AI Price". The multiplier is applied to EACH
 * charger's own base rate at read time (rateEngine), so per-charger price
 * differences are preserved while surging/discounting proportionally.
 */
router.post('/price-plan/:stationId', verifyToken, async (req, res) => {
  try {
    const { hourSlot, multiplier } = req.body;
    const st = await Station.findById(req.params.stationId);
    if (!st) return res.status(404).json({ error: 'Station not found' });

    const owner = await requireStationOwner(req, res, st);
    if (!owner) return; // response already sent

    const baseRate = Number(st.basePricePerKwh) || 85;
    const mult = Number(multiplier) || 1.0;

    // Resolve the slot label ("HH:00") from the request, defaulting to the
    // current hour if none given. Accepts both "18" and "18:00".
    const now = new Date();
    const pad2 = (n) => String(n).padStart(2, '0');
    const hourStr = String(hourSlot || '').trim();
    let slotHour = null;
    if (/^\d{1,2}$/.test(hourStr)) {
      slotHour = Number(hourStr);
    } else {
      const m = hourStr.match(/^(\d{1,2}):00$/);
      if (m) slotHour = Number(m[1]);
    }
    const slotLabel = (slotHour !== null && slotHour >= 0 && slotHour <= 23)
      ? `${pad2(slotHour)}:00`
      : `${pad2(now.getHours())}:00`;

    // Expiry: 23:59:59 of the chosen hour slot (e.g. "18:00" -> 18:59:59).
    let expiresAt = new Date(now);
    expiresAt.setMinutes(0, 0, 0);
    if (slotHour !== null && slotHour >= 0 && slotHour <= 23) {
      expiresAt.setHours(slotHour);
      if (expiresAt.getTime() <= now.getTime()) expiresAt.setDate(expiresAt.getDate() + 1);
    }
    expiresAt.setMinutes(59, 59, 999);

    // Drop stale slots first so the plan stays clean.
    st.pricePlan = (st.pricePlan || []).filter(p => !p.expiresAt || new Date(p.expiresAt).getTime() > now.getTime());

    const entry = {
      hourSlot: slotLabel,
      effectiveRate: roundRateLKR(baseRate * mult),
      originalRate: baseRate,
      multiplier: mult,
      expiresAt,
      appliedAt: new Date()
    };

    const existingIdx = st.pricePlan.findIndex(p => p.hourSlot === slotLabel);
    if (existingIdx >= 0) st.pricePlan[existingIdx] = entry;
    else st.pricePlan.push(entry);

    await st.save();

    const liveSlot = `${pad2(now.getHours())}:00`;
    const live = st.pricePlan.find(p => p.hourSlot === liveSlot && p.expiresAt && new Date() < new Date(p.expiresAt)) || null;

    return res.status(200).json({
      status: 'success',
      pricePlan: st.pricePlan,
      activePriceOverride: live,
      basePricePerKwh: baseRate,
      effectiveRate: entry.effectiveRate
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/ai/price-plan/:stationId/:hourSlot
 * Reverts a scheduled AI price back to normal for one hour slot.
 */
router.delete('/price-plan/:stationId/:hourSlot', verifyToken, async (req, res) => {
  try {
    const st = await Station.findById(req.params.stationId);
    if (!st) return res.status(404).json({ error: 'Station not found' });

    const owner = await requireStationOwner(req, res, st);
    if (!owner) return; // response already sent

    const hourSlot = decodeURIComponent(req.params.hourSlot);
    st.pricePlan = (st.pricePlan || []).filter(p => p.hourSlot !== hourSlot);

    // If the live slot's entry was removed, also clear the legacy override
    const pad2 = (n) => String(n).padStart(2, '0');
    const liveSlot = `${pad2(new Date().getHours())}:00`;
    if (hourSlot === liveSlot && st.activePriceOverride && st.activePriceOverride.hourSlot === liveSlot) {
      st.activePriceOverride = null;
    }

    await st.save();

    const live = st.pricePlan.find(p => p.hourSlot === liveSlot && p.expiresAt && new Date() < new Date(p.expiresAt)) || null;
    return res.status(200).json({ status: 'success', pricePlan: st.pricePlan || [], activePriceOverride: live });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/ai/price-plan/:stationId
 * Clears the ENTIRE scheduled AI price plan (revert all).
 */
router.delete('/price-plan/:stationId', verifyToken, async (req, res) => {
  try {
    const st = await Station.findById(req.params.stationId);
    if (!st) return res.status(404).json({ error: 'Station not found' });

    const owner = await requireStationOwner(req, res, st);
    if (!owner) return; // response already sent

    st.pricePlan = [];

    const pad2 = (n) => String(n).padStart(2, '0');
    const liveSlot = `${pad2(new Date().getHours())}:00`;
    if (st.activePriceOverride && st.activePriceOverride.hourSlot === liveSlot) {
      st.activePriceOverride = null;
    }

    await st.save();
    return res.status(200).json({ status: 'success', pricePlan: [], activePriceOverride: null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/station-events/:stationId
 */
router.post('/station-events/:stationId', verifyToken, async (req, res) => {
  try {
    const { title, date, time, locationName, latitude, longitude, category } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Title and Date are required' });
    const st = await Station.findById(req.params.stationId);
    if (!st) return res.status(404).json({ error: 'Station not found' });

    const owner = await requireStationOwner(req, res, st);
    if (!owner) return; // response already sent

    st.specialEvents.push({ 
      title, 
      date, 
      time: time || '12:00',
      locationName: locationName || '',
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      category: category || 'Sports Event / Cricket Match' 
    });
    await st.save();
    return res.status(200).json({ status: 'success', specialEvents: st.specialEvents });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/ai/station-events/:stationId/:eventId
 */
router.delete('/station-events/:stationId/:eventId', verifyToken, async (req, res) => {
  try {
    const st = await Station.findById(req.params.stationId);
    if (!st) return res.status(404).json({ error: 'Station not found' });

    const owner = await requireStationOwner(req, res, st);
    if (!owner) return; // response already sent

    st.specialEvents = st.specialEvents.filter(e => e._id.toString() !== req.params.eventId);
    await st.save();
    return res.status(200).json({ status: 'success', specialEvents: st.specialEvents });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;