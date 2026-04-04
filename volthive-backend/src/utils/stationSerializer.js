const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const mapPortsToChargers = (station) => {
  const total = Math.max(1, toNumber(station.portsTotal, 1));
  const available = Math.max(0, Math.min(total, toNumber(station.portsAvailable, total)));

  return Array.from({ length: total }, (_, index) => ({
    plugType: station.chargerType || 'Unknown',
    powerKW: toNumber(station.powerOutputKW, 0),
    status: index < available ? 'Available' : 'Occupied',
  }));
};

const serializeStationForClient = (stationDoc) => {
  const station = typeof stationDoc.toObject === 'function' ? stationDoc.toObject() : stationDoc;

  return {
    ...station,
    name: station.stationName,
    pricePerKWh: toNumber(station.basePricePerKwh, 0),
    chargers: mapPortsToChargers(station),
  };
};

module.exports = {
  serializeStationForClient,
};
