require('dotenv').config();
const mongoose = require('mongoose');
const Station = require('./models/Station');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;
const OWNER_FIREBASE_UID = process.env.SEED_OWNER_FIREBASE_UID || 'Pi0xRH8AvvUFqoFJzF8sEKcdDcZ2';
const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL || 'admin@volthive.com';

const CITY_HUBS = [
  { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
  { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { name: 'Galle', lat: 6.0535, lng: 80.2210 },
  { name: 'Negombo', lat: 7.2083, lng: 79.8358 },
  { name: 'Kurunegala', lat: 7.4863, lng: 80.3647 },
  { name: 'Anuradhapura', lat: 8.3114, lng: 80.4037 },
  { name: 'Jaffna', lat: 9.6615, lng: 80.0255 },
  { name: 'Matara', lat: 5.9485, lng: 80.5353 },
  { name: 'Trincomalee', lat: 8.5874, lng: 81.2152 },
  { name: 'Nuwara Eliya', lat: 6.9497, lng: 80.7891 },
  { name: 'Badulla', lat: 6.9934, lng: 81.0550 },
  { name: 'Ratnapura', lat: 6.6828, lng: 80.3992 },
  { name: 'Gampaha', lat: 7.0873, lng: 80.0144 },
  { name: 'Matale', lat: 7.4675, lng: 80.6234 },
  { name: 'Batticaloa', lat: 7.7306, lng: 81.7046 },
  { name: 'Chilaw', lat: 7.5756, lng: 79.8023 },
];

const BRANDS = ['EcoCharge', 'VoltHive', 'PowerNet', 'GreenVolt', 'LankaCharge', 'Ceylon EV'];
const PLUG_TYPES = ['CCS2', 'Type 2', 'CHAdeMO', 'CCS1', 'GB/T'];
const STATUSES = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'CHARGING', 'OFFLINE'];

const randomInRange = (min, max) => Math.random() * (max - min) + min;
const randomFrom = (items) => items[Math.floor(Math.random() * items.length)];
const signedOffset = (maxDelta) => randomInRange(-maxDelta, maxDelta);

const generateChargers = () => {
  const chargerCount = Math.floor(randomInRange(1, 5));
  const chargers = [];

  for (let index = 0; index < chargerCount; index += 1) {
    const plugType = randomFrom(PLUG_TYPES);
    const powerKW = randomFrom([7, 11, 22, 30, 40, 60, 75, 90, 120, 150]);
    const status = randomFrom(STATUSES);

    chargers.push({
      plugType,
      powerKW,
      status,
    });
  }

  return chargers;
};

const seedDatabase = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is missing from the environment.');
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const owner = await User.findOne({
      $or: [
        { firebaseUid: OWNER_FIREBASE_UID },
        { email: OWNER_EMAIL },
      ],
    });

    if (!owner) {
      throw new Error(`Owner account not found for firebaseUid=${OWNER_FIREBASE_UID} or email=${OWNER_EMAIL}`);
    }

    if (owner.role !== 'owner') {
      throw new Error(`Matched user is not an owner. Found role=${owner.role}`);
    }

    await Station.deleteMany({});
    console.log('🗑️  Cleared existing stations');

    const stationsToInsert = Array.from({ length: 100 }, (_, index) => {
      const city = randomFrom(CITY_HUBS);
      const brand = randomFrom(BRANDS);
      const chargerCount = Math.floor(randomInRange(1, 5));

      const chargers = generateChargers().slice(0, chargerCount);

      return {
        ownerId: owner._id,
        stationName: `${brand} ${city.name} Hub ${index + 1}`,
        address: `Main Road, ${city.name}, Sri Lanka`,
        location: {
          type: 'Point',
          coordinates: [
            city.lng + signedOffset(0.0045),
            city.lat + signedOffset(0.0045),
          ],
        },
        chargers,
        basePricePerKwh: Math.floor(randomInRange(70, 150)),
        rateConfig: {
          baseRate: Math.floor(randomInRange(70, 150)),
          customRates: [],
        },
        isBookingEnabled: Math.random() > 0.15,
      };
    });

    await Station.insertMany(stationsToInsert);
    console.log(`✅ Successfully seeded ${stationsToInsert.length} stations for owner ${owner.email || owner.firebaseUid}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect cleanly:', disconnectError);
    }
    process.exit(1);
  }
};

seedDatabase();
