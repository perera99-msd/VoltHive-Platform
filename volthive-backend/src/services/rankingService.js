// volthive-backend/src/services/rankingService.js
const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Haversine fallback formula for distance in km
const getHaversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateBestValue = async (userLocation, userCarDetails, stations, batteryLevel = 50) => {
  // 1. Resolve the driver's requested plug type(s) (supports multi-select adapters)
  const plugTypes = Array.isArray(userCarDetails.plugTypes) && userCarDetails.plugTypes.length > 0
    ? userCarDetails.plugTypes.map(p => String(p))
    : (userCarDetails.plugType ? [String(userCarDetails.plugType)] : []);

  // 2. Stations that have at least one matching charger plug type
  const matchesPlug = (station) =>
    Array.isArray(station.chargers) && station.chargers.some(c =>
      plugTypes.length === 0 || plugTypes.includes(c.plugType)
    );

  const compatibleStations = stations.filter(matchesPlug);
  if (compatibleStations.length === 0) return [];

  // 3. Prefer stations with an AVAILABLE matching charger; fall back to all matching
  const hasAvailable = (station) =>
    station.chargers.some(c => c.status === 'AVAILABLE' || c.status === 'Available');

  const availableStations = compatibleStations.filter(hasAvailable);
  const candidates = availableStations.length > 0 ? availableStations : compatibleStations;

  // 4. Battery-aware weights (0 = better for both time and price)
  // Low battery (<= 20%): proximity first (time 0.8). Good battery: price first (price 0.8).
  const isCriticalBattery = batteryLevel <= 20;
  const timeWeight = isCriticalBattery ? 0.8 : 0.2;
  const priceWeight = isCriticalBattery ? 0.2 : 0.8;

  // 5. Road distance/drive-time from Google Maps (falls back to Haversine)
  const origin = `${userLocation.lat},${userLocation.lng}`;
  const destinations = candidates.map(s => `${s.location.coordinates[1]},${s.location.coordinates[0]}`).join('|');

  let elements = null;
  if (GOOGLE_MAPS_API_KEY && destinations) {
    try {
      const gmapsResponse = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
        params: {
          origins: origin,
          destinations: destinations,
          departure_time: 'now',
          key: GOOGLE_MAPS_API_KEY
        }
      });
      if (gmapsResponse.data?.rows?.[0]?.elements) {
        elements = gmapsResponse.data.rows[0].elements;
      }
    } catch (err) {
      console.warn("Google Maps Distance API call failed. Using Haversine fallback.");
    }
  }

  // 6. Compute raw metrics per station
  const scored = candidates.map((station, index) => {
    const straightKm = getHaversineDistanceKm(
      userLocation.lat, userLocation.lng,
      station.location.coordinates[1], station.location.coordinates[0]
    );

    let roadKm = straightKm;
    let driveTimeMins = (straightKm / 40) * 60; // Haversine fallback @ 40 km/h

    if (elements && elements[index] && elements[index].status === 'OK') {
      const d = elements[index];
      driveTimeMins = (d.duration_in_traffic || d.duration).value / 60;
      roadKm = d.distance.value / 1000;
    }

    const price = station.currentDynamicPrice || station.pricePerKWh || station.basePricePerKwh || 85;

    return {
      ...station,
      _straightKm: straightKm,
      _price: price,
      routeData: {
        distanceKm: roadKm.toFixed(1),
        driveTimeMins: Math.round(driveTimeMins)
      }
    };
  });

  // 7. 10 km RADIUS filter — straight-line distance from the car (as requested),
  //    NOT road distance (road can exceed 10 km for stations inside the radius).
  const within10 = scored.filter(s => s._straightKm <= 10.0);
  if (within10.length === 0) return [];

  // 8. Min-max normalize drive time & price (both to 0..1) BEFORE weighting.
  //    This fixes the old unit-mixing bug where LKR (85-150) dwarfed minutes (5-30).
  const times = within10.map(s => s.routeData.driveTimeMins);
  const prices = within10.map(s => s._price);
  const minT = Math.min(...times), maxT = Math.max(...times);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const normT = (v) => (maxT === minT ? 0 : (v - minT) / (maxT - minT));
  const normP = (v) => (maxP === minP ? 0 : (v - minP) / (maxP - minP));

  const ranked = within10.map(s => {
    const valueScore = (normT(s.routeData.driveTimeMins) * timeWeight) + (normP(s._price) * priceWeight);
    return { ...s, valueScore: parseFloat(valueScore.toFixed(3)) };
  });

  // 9. Sort by lowest score (best value) and return the top 3, dropping internal fields
  ranked.sort((a, b) => a.valueScore - b.valueScore);
  return ranked.slice(0, 3).map(({ _straightKm, _price, ...station }) => station);
};

module.exports = { calculateBestValue };