// volthive-backend/src/controllers/stationController.js
const Station = require('../models/Station');
const { getDynamicPriceMultiplier } = require('../services/aiService');
const { calculateBestValue } = require('../services/rankingService');

// ==========================================
// SPRINT 2: CORE CRUD OPERATIONS
// ==========================================

exports.getAllStations = async (req, res) => {
  try {
    const stations = await Station.find();
    res.status(200).json({
      success: true,
      count: stations.length,
      data: stations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.createStation = async (req, res) => {
  try {
    // Attach the logged-in owner's ID to the station data (from the JWT protect middleware)
    req.body.ownerId = req.user.id; 
    
    const station = await Station.create(req.body);
    
    res.status(201).json({
      success: true,
      data: station
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};


// ==========================================
// NEW: SMART MATCH ALGORITHM
// ==========================================

exports.getSmartMatchStations = async (req, res) => {
  try {
    const { userLat, userLng, plugType, currentBatteryLevel } = req.body;

    // 1. Find stations within a 15km radius using MongoDB Geospatial Query
    const stationsNearby = await Station.find({
      location: {
        $near: {
          $geometry: {
             type: "Point",
             coordinates: [parseFloat(userLng), parseFloat(userLat)]
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
    const userLocation = { lat: userLat, lng: userLng };
    
    const top3Stations = await calculateBestValue(userLocation, userCarDetails, stationsWithPrices);

    res.status(200).json({
      success: true,
      count: top3Stations.length,
      data: top3Stations
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};