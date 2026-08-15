const { getStationEffectiveRate, getActivePlanEntry, isOverrideActive, getChargerEffectiveRateFromMap, buildChargerRateMap, roundRateLKR } = require('./rateEngine');

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

/**
 * Serialize a station for clients with LIVE per-charger pricing.
 * `rateMap` is an optional prebuilt Map(chargerIdString -> Rate doc) so list
 * endpoints avoid one DB query per charger; when omitted it is built here.
 * - station.pricePerKWh = rounded average of AVAILABLE chargers' live rates
 * - each charger.currentRate = that charger's exact effective rate (AI + TOU)
 */
const serializeStationForClient = async (stationDoc, rateMap = null) => {
  const station = typeof stationDoc.toObject === 'function' ? stationDoc.toObject() : stationDoc;
  const chargers = Array.isArray(station.chargers) ? station.chargers : [];

  let resolvedMap = rateMap;
  if (!resolvedMap) {
    resolvedMap = await buildChargerRateMap(chargers.map((c) => c && c._id));
  }

  const now = new Date();
  const mappedChargers = chargers.map((charger) => ({
    ...charger,
    plugType: charger.plugType || 'Unknown',
    powerKW: toNumber(charger.powerKW, 0),
    status: charger.status, // Keep original enum value from DB
    statusDisplay: displayChargerStatus(charger.status), // Separate display field
    basePricePerKwh: toNumber(charger.basePricePerKwh, 0),
    currentRate: getChargerEffectiveRateFromMap(station, charger, resolvedMap, now),
  }));

  // Station "current rate" = average of AVAILABLE chargers' live rates,
  // rounded to the nearest 0.50 so it matches what drivers actually pay.
  const available = mappedChargers.filter((c) => c.status === 'AVAILABLE' && Number(c.currentRate) > 0);
  const pool = available.length > 0 ? available : mappedChargers.filter((c) => Number(c.currentRate) > 0);
  const avgRaw = pool.length > 0
    ? pool.reduce((sum, c) => sum + Number(c.currentRate || 0), 0) / pool.length
    : 0;

  const effectivePrice = avgRaw > 0 ? roundRateLKR(avgRaw) : getStationEffectiveRate(station);
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
    chargers: mappedChargers,
  };
};

module.exports = {
  serializeStationForClient,
};
