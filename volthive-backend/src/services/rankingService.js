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

// Battery tiers (percent) that drive the Best-Value ranking objective.
//    LOW  (b < 30)       : nearest station first (range anxiety)
//    OK   (30 <= b <= 70) : best value for money AND distance (balanced)
//    GOOD (b > 70)       : best value for money first (cheapest)
const BATTERY_TIERS = { LOW: 30, GOOD: 70 };

// Fallback road-distance estimate when the Google Distance Matrix API is
// unavailable: straight-line km x ROAD_FACTOR ~ road km, at an urban average
// speed so the approximate drive time is close to real-world values.
const ROAD_FACTOR = 1.4;
const URBAN_AVG_SPEED_KMH = 30;

const calculateBestValue = async (userLocation, userCarDetails, stations, batteryLevel = 50) => {
  // 1. Resolve the driver's requested plug type(s) (supports multi-select adapters)
  const plugTypes = Array.isArray(userCarDetails.plugTypes) && userCarDetails.plugTypes.length > 0
    ? userCarDetails.plugTypes.map(p => String(p))
    : (userCarDetails.plugType ? [String(userCarDetails.plugType)] : []);

  // 2. Stations that have an AVAILABLE charger of a SELECTED plug type.
  //    A charger that is busy/OFFLINE does not count — the driver must be able
  //    to plug in NOW, so we never fall back to non-available hardware.
  const hasAvailableMatchingPlug = (station) =>
    Array.isArray(station.chargers) && station.chargers.some(c =>
      (plugTypes.length === 0 || plugTypes.includes(c.plugType)) &&
      (c.status === 'AVAILABLE' || c.status === 'Available')
    );

  const candidates = stations.filter(hasAvailableMatchingPlug);
  if (candidates.length === 0) return [];

  // 4. Battery tier -> ranking objective (0 = better for both time and price)
  //    low  : nearest first (drive time primary)
  //    ok   : value for money AND distance (balanced 50/50)
  //    good : value for money first (price primary)
  const tier = batteryLevel < BATTERY_TIERS.LOW ? 'low'
    : batteryLevel > BATTERY_TIERS.GOOD ? 'good'
    : 'ok';
  // Balanced weights are used by the 'ok' tier; 'low'/'good' sort by explicit keys.
  const timeWeight = 0.5;
  const priceWeight = 0.5;

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

    // Fallback: road-adjusted straight-line distance at a realistic urban speed.
    let roadKm = straightKm * ROAD_FACTOR;
    let driveTimeMins = (roadKm / URBAN_AVG_SPEED_KMH) * 60;

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

  // 9. Sort by the tier's primary objective (nearest / balanced / cheapest),
  //    with the secondary metric as a deterministic tie-breaker. Return the
  //    top 3 (or fewer if that's all that exist), dropping internal fields.
  ranked.sort((a, b) => {
    if (tier === 'low') {
      if (a.routeData.driveTimeMins !== b.routeData.driveTimeMins) return a.routeData.driveTimeMins - b.routeData.driveTimeMins;
      return a._price - b._price;
    }
    if (tier === 'good') {
      if (a._price !== b._price) return a._price - b._price;
      return a.routeData.driveTimeMins - b.routeData.driveTimeMins;
    }
    return a.valueScore - b.valueScore; // ok: balanced value for money + distance
  });
  return ranked.slice(0, 3).map(({ _straightKm, _price, ...station }) => station);
};

module.exports = { calculateBestValue };