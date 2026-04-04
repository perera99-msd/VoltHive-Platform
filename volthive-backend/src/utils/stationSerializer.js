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

const serializeStationForClient = (stationDoc) => {
  const station = typeof stationDoc.toObject === 'function' ? stationDoc.toObject() : stationDoc;
  const chargers = Array.isArray(station.chargers)
    ? station.chargers.map((charger) => ({
        ...charger,
        plugType: charger.plugType || 'Unknown',
        powerKW: toNumber(charger.powerKW, 0),
        status: normalizeChargerStatus(charger.status),
      }))
    : [];

  return {
    ...station,
    name: station.stationName,
    pricePerKWh: toNumber(station.basePricePerKwh, 0),
    chargers,
  };
};

module.exports = {
  serializeStationForClient,
};
