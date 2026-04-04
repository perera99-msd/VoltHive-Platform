const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const getFirebaseCredential = () => {
  // Preferred: base64-encoded JSON payload in env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    return admin.credential.cert(JSON.parse(decoded));
  }

  // Optional: explicit path via env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const resolvedPath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      : path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH does not exist: ${resolvedPath}`);
    }

    const raw = fs.readFileSync(resolvedPath, 'utf8');
    const serviceAccount = JSON.parse(raw);
    return admin.credential.cert(serviceAccount);
  }

  throw new Error(
    'Firebase Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_PATH.'
  );
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: getFirebaseCredential(),
  });
}

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Attach the decoded user payload to the request
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error.message);
    return res.status(403).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = verifyToken;
module.exports.protect = verifyToken;