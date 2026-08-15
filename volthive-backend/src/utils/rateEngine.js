// volthive-backend/src/utils/rateEngine.js
// Single source of truth for "what price does a driver pay right now".
//
// Precedence (highest first):
//   1. Active AI price-plan entry for the CURRENT hour (owner-scheduled)
//   2. Active legacy single AI price override (owner applied for the current hour)
//   3. Per-charger custom time-of-use rate (RateCalendar) matching now
//   4. Charger base price
//   5. Station base price
const Rate = require('../models/Rate');

const normalizeNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const timeToMinutes = (time) => {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(String(time || ''))) return NaN;
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
};

const pad2 = (n) => String(n).padStart(2, '0');
const currentHourSlot = (now = new Date()) => `${pad2(now.getHours())}:00`;

/**
 * True if an activePriceOverride is currently in effect at `now`.
 */
const isOverrideActive = (override, now = new Date()) => {
  if (!override || !override.expiresAt) return false;
  return now.getTime() < new Date(override.expiresAt).getTime();
};

/**
 * Find the scheduled price-plan entry that is LIVE right now:
 * matches the current hour slot and is not yet expired.
 */
const getActivePlanEntry = (station, now = new Date()) => {
  const plan = Array.isArray(station.pricePlan) ? station.pricePlan : [];
  const hourSlot = currentHourSlot(now);
  const entry = plan.find((p) => p && p.hourSlot === hourSlot && p.expiresAt && now.getTime() < new Date(p.expiresAt).getTime());
  return entry || null;
};

/**
 * Station-level effective rate (synchronous):
 *   live plan entry -> legacy AI override -> station base price.
 */
const getStationEffectiveRate = (station, now = new Date()) => {
  const planEntry = getActivePlanEntry(station, now);
  if (planEntry) {
    return normalizeNumber(planEntry.effectiveRate, normalizeNumber(station.basePricePerKwh, 0));
  }
  if (isOverrideActive(station.activePriceOverride, now)) {
    return normalizeNumber(station.activePriceOverride.effectiveRate, normalizeNumber(station.basePricePerKwh, 0));
  }
  return normalizeNumber(station.basePricePerKwh, 0);
};

/**
 * Charger-level effective rate (async, requires a DB lookup for the
 * per-charger time-of-use Rate doc):
 *   live plan entry -> legacy AI override -> custom TOU rate -> charger base -> station base.
 */
const applyMultiplier = (base, multiplier, fallbackRate, chargerBase) => {
  const baseVal = Number(base);
  const mult = Number(multiplier);
  if (Number.isFinite(baseVal) && baseVal > 0 && Number.isFinite(mult)) {
    return roundRateLKR(baseVal * mult);
  }
  return normalizeNumber(fallbackRate, chargerBase);
};

/**
 * Charger-level effective rate core (synchronous). Pass a preloaded
 * per-charger time-of-use Rate doc (or null) to avoid a DB hit.
 *
 * Precedence (highest first):
 *   1. Live AI price-plan entry  -> AI multiplier applied to THIS charger's own base
 *   2. Legacy AI override        -> AI multiplier applied to THIS charger's own base
 *   3. Per-charger TOU rate (day + time match)
 *   4. Charger base price
 *   5. Station base price
 */
const getChargerEffectiveRateCore = (station, charger, rateDoc, now = new Date()) => {
  const chargerBase = normalizeNumber(charger.basePricePerKwh, normalizeNumber(station.basePricePerKwh, 0));

  // 1. AI price-plan entry (station-wide multiplier) live for this hour
  const planEntry = getActivePlanEntry(station, now);
  if (planEntry) {
    return applyMultiplier(charger.basePricePerKwh, planEntry.multiplier, planEntry.effectiveRate, chargerBase);
  }

  // 2. Legacy AI override (station-wide multiplier) wins while active
  const override = station.activePriceOverride;
  if (isOverrideActive(override, now)) {
    return applyMultiplier(charger.basePricePerKwh, override.multiplier, override.effectiveRate, chargerBase);
  }

  // 3. Per-charger custom time-of-use rate
  if (rateDoc) {
    const day = now.getDay();
    const hhmm = now.toTimeString().slice(0, 5);
    const match = (rateDoc.customRates || []).find((r) => {
      if (r.dayOfWeek !== day) return false;
      const start = r.startTime || '00:00';
      const end = r.endTime || '23:59';
      return start <= hhmm && hhmm <= end;
    });
    if (match) return normalizeNumber(match.rate, normalizeNumber(rateDoc.baseRate, chargerBase));
    if (rateDoc.baseRate != null) return normalizeNumber(rateDoc.baseRate, 0);
  }

  // 4. / 5. Charger or station base price
  return chargerBase;
};

const getChargerEffectiveRate = async (station, charger, now = new Date()) => {
  let rateDoc = null;
  try {
    rateDoc = await Rate.findOne({ chargerId: charger._id });
  } catch (e) {
    rateDoc = null;
  }
  return getChargerEffectiveRateCore(station, charger, rateDoc, now);
};

/**
 * Load per-charger time-of-use Rate docs for many chargers in ONE query.
 * Returns a Map(chargerIdString -> rateDoc). Empty map on error (callers
 * fall back to charger/station base pricing).
 */
const buildChargerRateMap = async (chargerIds) => {
  const ids = (Array.isArray(chargerIds) ? chargerIds : []).filter(Boolean);
  const map = new Map();
  if (ids.length === 0) return map;
  try {
    const docs = await Rate.find({ chargerId: { $in: ids } });
    for (const doc of docs) map.set(String(doc.chargerId), doc);
  } catch (e) {
    // leave map empty; callers fall back to charger/station base pricing
  }
  return map;
};

/**
 * Synchronous charger-level effective rate using a prebuilt rate map.
 */
const getChargerEffectiveRateFromMap = (station, charger, rateMap, now = new Date()) => {
  const rateDoc = rateMap ? (rateMap.get(String(charger._id)) || null) : null;
  return getChargerEffectiveRateCore(station, charger, rateDoc, now);
};

// ============================================================
// CONTINUOUS AI PRICING CURVE (occupancy -> price multiplier)
// Replaces the old step thresholds (1.15 / 1.25 / 0.90) with a smooth
// piecewise-linear curve, so EVERY predicted occupancy maps to a unique
// price. Base price stays constant; predicted demand is the variable.
//
//   occ <= 30%  : floor (discount)
//   30 - 60%    : floor -> 1.00 (linear)
//   60 - 90%    : 1.00 -> cap (linear)
//   occ > 90%   : cap (surge ceiling, prevents price gouging)
// ============================================================
const PRICING_PROFILES = {
  conservative: { floor: 0.92, cap: 1.15 },
  balanced: { floor: 0.90, cap: 1.30 },
  aggressive: { floor: 0.85, cap: 1.45 },
};

const getPricingProfile = (station) => {
  const key = String(station?.pricingProfile || 'balanced').toLowerCase();
  return PRICING_PROFILES[key] || PRICING_PROFILES.balanced;
};

/**
 * Map a predicted occupancy (0-100) to a price multiplier (2 dp).
 * @param {number} occ
 * @param {{floor:number,cap:number}} [profile]
 */
const occupancyToMultiplier = (occ, profile = PRICING_PROFILES.balanced) => {
  const o = Math.max(0, Math.min(100, Number(occ) || 0));
  const { floor, cap } = profile;
  const MID = 60;
  const HIGH = 90;
  let m;
  if (o <= 30) m = floor;
  else if (o <= MID) m = floor + (1 - floor) * ((o - 30) / (MID - 30));
  else if (o <= HIGH) m = 1 + (cap - 1) * ((o - MID) / (HIGH - MID));
  else m = cap;
  return Math.round(m * 100) / 100;
};

/** Round a LKR rate to the nearest 0.50 for clean, fair-looking pricing. */
const roundRateLKR = (rate) => {
  const r = Number(rate);
  return Number.isFinite(r) ? Math.round(r * 2) / 2 : 0;
};

module.exports = { getStationEffectiveRate, getChargerEffectiveRate, getChargerEffectiveRateCore, getChargerEffectiveRateFromMap, buildChargerRateMap, isOverrideActive, getActivePlanEntry, timeToMinutes, PRICING_PROFILES, getPricingProfile, occupancyToMultiplier, roundRateLKR };
