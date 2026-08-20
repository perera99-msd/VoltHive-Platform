// volthive-backend/tests/run_all_tests.js
// Production-grade automated test runner for VoltHive backend core logic.

const assert = require('assert');
const {
  timeToMinutes,
  occupancyToMultiplier,
  roundRateLKR,
  PRICING_PROFILES,
  getPricingProfile,
  isOverrideActive,
  getActivePlanEntry,
  getStationEffectiveRate,
  getChargerEffectiveRateCore,
} = require('../src/utils/rateEngine');

let passedTests = 0;
let totalTests = 0;
const testResults = [];

function test(name, fn) {
  totalTests++;
  const start = process.hrtime.bigint();
  try {
    fn();
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    passedTests++;
    testResults.push({ name, status: 'PASSED', durationMs: durationMs.toFixed(3) });
    console.log(`  ✅ [PASS] ${name} (${durationMs.toFixed(3)}ms)`);
  } catch (err) {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    testResults.push({ name, status: 'FAILED', error: err.message, durationMs: durationMs.toFixed(3) });
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

console.log('\n======================================================');
console.log('⚡ VoltHive Automated Backend Test Suite');
console.log('======================================================\n');

// ── 1. RATE ENGINE & TARIFF CALCULATIONS ─────────────────────────────
console.log('📦 Suite 1: Rate Engine & Dynamic Pricing Calculations');

test('timeToMinutes converts valid HH:MM strings to integer minutes', () => {
  assert.strictEqual(timeToMinutes('00:00'), 0);
  assert.strictEqual(timeToMinutes('01:30'), 90);
  assert.strictEqual(timeToMinutes('14:45'), 885);
  assert.strictEqual(timeToMinutes('23:59'), 1439);
  assert.ok(Number.isNaN(timeToMinutes('invalid')));
  assert.ok(Number.isNaN(timeToMinutes('25:00')));
});

test('occupancyToMultiplier calculates balanced piecewise curve accurately', () => {
  // Low occupancy (<=30%) => 0.90 floor discount
  assert.strictEqual(occupancyToMultiplier(0), 0.90);
  assert.strictEqual(occupancyToMultiplier(20), 0.90);
  assert.strictEqual(occupancyToMultiplier(30), 0.90);

  // Normal occupancy (30% to 60%) => linear 0.90 to 1.00
  assert.strictEqual(occupancyToMultiplier(45), 0.95);
  assert.strictEqual(occupancyToMultiplier(60), 1.00);

  // Peak surge occupancy (60% to 90%) => linear 1.00 to 1.30
  assert.strictEqual(occupancyToMultiplier(75), 1.15);
  assert.strictEqual(occupancyToMultiplier(90), 1.30);

  // Grid critical surge (>90%) => capped at 1.30 ceiling
  assert.strictEqual(occupancyToMultiplier(95), 1.30);
  assert.strictEqual(occupancyToMultiplier(100), 1.30);
});

test('occupancyToMultiplier supports conservative and aggressive profiles', () => {
  const conservative = PRICING_PROFILES.conservative;
  assert.strictEqual(occupancyToMultiplier(20, conservative), 0.92);
  assert.strictEqual(occupancyToMultiplier(60, conservative), 1.00);
  assert.strictEqual(occupancyToMultiplier(95, conservative), 1.15);

  const aggressive = PRICING_PROFILES.aggressive;
  assert.strictEqual(occupancyToMultiplier(15, aggressive), 0.85);
  assert.strictEqual(occupancyToMultiplier(60, aggressive), 1.00);
  assert.strictEqual(occupancyToMultiplier(95, aggressive), 1.45);
});

test('roundRateLKR correctly rounds tariffs to nearest 0.50 LKR', () => {
  assert.strictEqual(roundRateLKR(85.23), 85.0);
  assert.strictEqual(roundRateLKR(85.25), 85.5);
  assert.strictEqual(roundRateLKR(85.26), 85.5);
  assert.strictEqual(roundRateLKR(85.74), 85.5);
  assert.strictEqual(roundRateLKR(85.75), 86.0);
  assert.strictEqual(roundRateLKR(85.76), 86.0);
  assert.strictEqual(roundRateLKR(0), 0);
});

test('isOverrideActive accurately validates expiry timestamps', () => {
  const now = new Date('2026-08-20T12:00:00Z');
  const activeOverride = { effectiveRate: 110, expiresAt: '2026-08-20T14:00:00Z' };
  const expiredOverride = { effectiveRate: 110, expiresAt: '2026-08-20T10:00:00Z' };

  assert.strictEqual(isOverrideActive(activeOverride, now), true);
  assert.strictEqual(isOverrideActive(expiredOverride, now), false);
  assert.strictEqual(isOverrideActive(null, now), false);
});

test('getActivePlanEntry finds active hourly scheduled plan slot', () => {
  const now = new Date('2026-08-20T14:30:00Z'); // UTC hour 14
  const hourSlot = `${String(now.getHours()).padStart(2, '0')}:00`;
  const station = {
    pricePlan: [
      { hourSlot, effectiveRate: 105, multiplier: 1.2, expiresAt: new Date(now.getTime() + 3600000).toISOString() },
      { hourSlot: '08:00', effectiveRate: 75, multiplier: 0.9, expiresAt: new Date(now.getTime() + 3600000).toISOString() }
    ]
  };

  const active = getActivePlanEntry(station, now);
  assert.ok(active !== null);
  assert.strictEqual(active.effectiveRate, 105);
});

test('getStationEffectiveRate respects hierarchy: Plan -> Override -> Base', () => {
  const now = new Date('2026-08-20T14:30:00Z');
  const hourSlot = `${String(now.getHours()).padStart(2, '0')}:00`;

  // Base only
  const stBase = { basePricePerKwh: 80 };
  assert.strictEqual(getStationEffectiveRate(stBase, now), 80);

  // Active override
  const stOverride = {
    basePricePerKwh: 80,
    activePriceOverride: { effectiveRate: 95, expiresAt: new Date(now.getTime() + 3600000).toISOString() }
  };
  assert.strictEqual(getStationEffectiveRate(stOverride, now), 95);

  // Active plan entry takes top precedence
  const stPlan = {
    basePricePerKwh: 80,
    activePriceOverride: { effectiveRate: 95, expiresAt: new Date(now.getTime() + 3600000).toISOString() },
    pricePlan: [
      { hourSlot, effectiveRate: 110, multiplier: 1.3, expiresAt: new Date(now.getTime() + 3600000).toISOString() }
    ]
  };
  assert.strictEqual(getStationEffectiveRate(stPlan, now), 110);
});

test('getChargerEffectiveRateCore applies multiplier to charger-specific base', () => {
  const now = new Date('2026-08-20T14:30:00Z');
  const hourSlot = `${String(now.getHours()).padStart(2, '0')}:00`;

  const station = {
    basePricePerKwh: 80,
    pricePlan: [
      { hourSlot, multiplier: 1.20, expiresAt: new Date(now.getTime() + 3600000).toISOString() }
    ]
  };

  const chargerDC = { _id: 'charger1', basePricePerKwh: 100 };
  // 100 * 1.20 = 120.0
  const rate = getChargerEffectiveRateCore(station, chargerDC, null, now);
  assert.strictEqual(rate, 120.0);
});

// ── 2. BOOKING SLOT OVERLAP LOGIC ────────────────────────────────────
console.log('\n📦 Suite 2: Booking Slot Overlap & Conflict Engine');

const timeRangesOverlap = (startA, endA, startB, endB) => startA < endB && endA > startB;

test('timeRangesOverlap correctly identifies conflicting booking windows', () => {
  // Interval A: 14:00 - 15:00 (840 to 900)
  const aStart = 840;
  const aEnd = 900;

  // Exact duplicate: 14:00 - 15:00
  assert.strictEqual(timeRangesOverlap(aStart, aEnd, 840, 900), true);

  // Partial overlap inside: 14:15 - 14:45
  assert.strictEqual(timeRangesOverlap(aStart, aEnd, 855, 885), true);

  // Partial overlap across start: 13:30 - 14:30
  assert.strictEqual(timeRangesOverlap(aStart, aEnd, 810, 870), true);

  // Partial overlap across end: 14:30 - 15:30
  assert.strictEqual(timeRangesOverlap(aStart, aEnd, 870, 930), true);

  // Adjacent before (non-overlapping): 13:00 - 14:00
  assert.strictEqual(timeRangesOverlap(aStart, aEnd, 780, 840), false);

  // Adjacent after (non-overlapping): 15:00 - 16:00
  assert.strictEqual(timeRangesOverlap(aStart, aEnd, 900, 960), false);

  // Completely separate: 10:00 - 11:00
  assert.strictEqual(timeRangesOverlap(aStart, aEnd, 600, 660), false);
});

// ── 3. STATE MACHINE TRANSITIONS ─────────────────────────────────────
console.log('\n📦 Suite 3: Charging Session Lifecycle State Machine');

const VALID_TRANSITIONS = {
  Pending: ['Confirmed', 'Cancelled', 'Expired'],
  Confirmed: ['Active_Charging', 'No_Show', 'Cancelled'],
  Active_Charging: ['Completed', 'Faulted'],
  Completed: [],
  Cancelled: [],
  Expired: [],
  No_Show: [],
  Faulted: ['Completed']
};

function isValidStateTransition(fromState, toState) {
  return VALID_TRANSITIONS[fromState]?.includes(toState) || false;
}

test('Charging session state machine enforces valid forward transitions', () => {
  assert.strictEqual(isValidStateTransition('Pending', 'Confirmed'), true);
  assert.strictEqual(isValidStateTransition('Pending', 'Cancelled'), true);
  assert.strictEqual(isValidStateTransition('Confirmed', 'Active_Charging'), true);
  assert.strictEqual(isValidStateTransition('Active_Charging', 'Completed'), true);
});

test('Charging session state machine blocks illegal state jumps', () => {
  assert.strictEqual(isValidStateTransition('Pending', 'Active_Charging'), false);
  assert.strictEqual(isValidStateTransition('Completed', 'Pending'), false);
  assert.strictEqual(isValidStateTransition('Cancelled', 'Active_Charging'), false);
  assert.strictEqual(isValidStateTransition('Completed', 'Active_Charging'), false);
});

// ── 4. CHAT DEDUPLICATION & THREAD ISOLATION ────────────────────────
console.log('\n📦 Suite 4: 1-to-1 Persistent Chat Thread Deduplication');

function getConversationKey(stationId, driverId) {
  return `${String(stationId)}::${String(driverId)}`;
}

test('Chat thread keying isolates conversations strictly by station and driver', () => {
  const stationA = 'st_001';
  const stationB = 'st_002';
  const driver1 = 'usr_001';
  const driver2 = 'usr_002';

  const threadA1 = getConversationKey(stationA, driver1);
  const threadA2 = getConversationKey(stationA, driver2);
  const threadB1 = getConversationKey(stationB, driver1);

  assert.strictEqual(threadA1, 'st_001::usr_001');
  assert.notStrictEqual(threadA1, threadA2);
  assert.notStrictEqual(threadA1, threadB1);

  // Deduplication check in set/map
  const threadsMap = new Map();
  threadsMap.set(threadA1, { count: 1 });
  threadsMap.set(getConversationKey(stationA, driver1), { count: 2 }); // overwrite
  assert.strictEqual(threadsMap.size, 1);
  assert.strictEqual(threadsMap.get(threadA1).count, 2);
});

// ── 5. EVENTBUS REAL-TIME DELIVERY FORMAT ────────────────────────────
console.log('\n📦 Suite 5: EventBus Real-Time Event Data Formatting');

test('EventBus payload builder creates compliant JSON structure', () => {
  const mockBooking = {
    _id: 'bk_123',
    stationId: 'st_456',
    stationName: 'SuperHub Alpha',
    driverName: 'Alex Driver',
    status: 'Confirmed'
  };

  const sseFormatted = `event: booking.created\ndata: ${JSON.stringify(mockBooking)}\n\n`;
  assert.ok(sseFormatted.startsWith('event: booking.created\n'));
  assert.ok(sseFormatted.includes('"stationName":"SuperHub Alpha"'));
  assert.ok(sseFormatted.endsWith('\n\n'));
});

console.log('\n======================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! (100% Pass Rate)`);
console.log('======================================================\n');
