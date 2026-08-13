const { getStationEffectiveRate, isOverrideActive, getActivePlanEntry } = require('./rateEngine');

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const normalizeChargerStatus = (status) => {
  const next = String(status || '').toUpperCase();

  if (next === 'AVAILABLE') return 'Available';
  if (next === 'PENDING_APPROVAL') return 'Pending Approval';
  if (next === 'RESERVED') return 'Reserved';
  if (next === 'CHARGING') return 'Charging';
  if (next === 'OFFLINE') return 'Offline';

  return String(status || 'Unknown');
};

const displayChargerStatus = (status) => {
  return normalizeChargerStatus(status);
};

const serializeStationForClient = (stationDoc) => {
  const station = typeof stationDoc.toObject === 'function' ? stationDoc.toObject() : stationDoc;
  const chargers = Array.isArray(station.chargers)
    ? station.chargers.map((charger) => ({
        ...charger,
        plugType: charger.plugType || 'Unknown',
        powerKW: toNumber(charger.powerKW, 0),
        status: charger.status, // Keep original enum value from DB
        statusDisplay: displayChargerStatus(charger.status), // Separate display field
      }))
    : [];

  // Real current price a driver would pay: live plan entry -> legacy override -> base.
  const effectivePrice = getStationEffectiveRate(station);
  const activePlan = getActivePlanEntry(station);

  return {
    ...station,
    name: station.stationName,
    pricePerKWh: effectivePrice,
    basePricePerKwh: toNumber(station.basePricePerKwh, 0), // the normal (non-override) rate
    hasActiveOverride: !!(activePlan || isOverrideActive(station.activePriceOverride)),
    overrideExpiresAt: activePlan?.expiresAt || station.activePriceOverride?.expiresAt || null,
    activeOverride: activePlan || (isOverrideActive(station.activePriceOverride) ? station.activePriceOverride : null) || null,
    pricePlan: Array.isArray(station.pricePlan) ? station.pricePlan : [],
    chargers,
  };
};

module.exports = {
  serializeStationForClient,
};
