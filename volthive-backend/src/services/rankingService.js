// volthive-backend/src/services/rankingService.js
const axios = require('axios');

// Using Google Maps Distance Matrix API for accurate drive times with traffic
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const calculateBestValue = async (userLocation, userCarDetails, stations) => {
  // 1. Filter out stations that don't match the user's charger type
  const compatibleStations = stations.filter(station => 
    station.chargerType === userCarDetails.plugType
  );

  if (compatibleStations.length === 0) return [];

  // 2. Prepare coordinates for Google API (Origins: User, Destinations: Stations)
  const origin = `${userLocation.lat},${userLocation.lng}`;
  const destinations = compatibleStations.map(s => `${s.location.coordinates[1]},${s.location.coordinates[0]}`).join('|');

  try {
    // 3. Fetch Real-time Distance & Traffic data
    const gmapsResponse = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
      params: {
        origins: origin,
        destinations: destinations,
        departure_time: 'now', // Crucial for traffic data
        key: GOOGLE_MAPS_API_KEY
      }
    });

    const elements = gmapsResponse.data.rows[0].elements;

    // 4. Calculate the "Value Score" for each station
    const rankedStations = compatibleStations.map((station, index) => {
      const distanceData = elements[index];
      
      // Fallback if Google API fails for a specific route
      if (distanceData.status !== 'OK') return null;

      const driveTimeMins = distanceData.duration_in_traffic.value / 60; // Convert seconds to mins
      const distanceKm = distanceData.distance.value / 1000;
      
      // The Algorithm Weights (You can adjust these for your thesis!)
      const timeWeight = 0.5; // How much users care about drive time
      const priceWeight = 0.5; // How much users care about the AI surge price
      
      // We calculate a combined "Cost/Value Score" (Lower is better)
      // Score = (Drive Time * Time Weight) + (Price per kWh * Price Weight)
      // Note: We'd normally normalize these numbers, but this is a solid V1.
      const valueScore = (driveTimeMins * timeWeight) + (station.currentDynamicPrice * priceWeight);

      return {
        ...station,
        routeData: {
          distanceKm: distanceKm.toFixed(1),
          driveTimeMins: Math.round(driveTimeMins)
        },
        valueScore: parseFloat(valueScore.toFixed(2))
      };
    }).filter(s => s !== null);

    // 5. Sort by lowest score (Best Value) and return top 3
    rankedStations.sort((a, b) => a.valueScore - b.valueScore);
    return rankedStations.slice(0, 3);

  } catch (error) {
    console.error("Ranking Service Error: Could not reach Maps API", error.message);
    return [];
  }
};

module.exports = { calculateBestValue };