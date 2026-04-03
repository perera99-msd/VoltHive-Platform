const express = require('express');
const router = express.Router();
const axios = require('axios');
const verifyToken = require('../middleware/authMiddleware');

// GET /api/ai/pricing-suggestion
router.get('/pricing-suggestion', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    
    // 1. Calculate current time features
    const hour = now.getHours();
    const day = now.getDay(); // 0 (Sun) to 6 (Sat)
    const isWeekend = (day === 0 || day === 6);
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);

    // 2. Prepare the data payload for the Python AI
    // For this MVP, we hardcode Weather and Events. You can plug in a real Weather API later!
    const environmentalData = {
      hour_of_day: hour,
      day_of_week: day,
      is_weekend: isWeekend,
      is_peak_hour: isPeakHour,
      weather_condition: "Clear", 
      local_event: "None",      
      traffic_congestion_index: 5 
    };

    // 3. Request the prediction from the Python Microservice
    const aiResponse = await axios.post('http://127.0.0.1:5001/api/ai/suggest-price', environmentalData);

    // 4. Send the result back to the React frontend
    res.status(200).json(aiResponse.data);
  } catch (error) {
    console.error('Error connecting to AI service:', error.message);
    res.status(500).json({ error: 'AI pricing service is currently offline.' });
  }
});

module.exports = router;