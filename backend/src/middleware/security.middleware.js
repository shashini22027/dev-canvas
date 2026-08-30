import mongoose from 'mongoose';

const dangerousKeyPattern = /^\$/;
const MAX_BODY_SIZE_BYTES = 1024 * 1024;

const hasDangerousKey = (value) => {
  if (!value || typeof value !== 'object') return false;

  return Object.entries(value).some(([key, nestedValue]) => (
    dangerousKeyPattern.test(key) || key.includes('.') || hasDangerousKey(nestedValue)
  ));
};

export const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' } = {}) => {
  const requests = new Map();

  return (req, res, next) => {
    const clientKey = req.ip
      || req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || 'unknown-client';

    const now = Date.now();
    const entry = requests.get(clientKey) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    requests.set(clientKey, entry);

    if (entry.count > max) {
      return res.status(429).json({ success: false, message });
    }

    next();
  };
};

export const limitRequestBody = (req, res, next) => {
  const lengthHeader = req.headers['content-length'];
  const declaredLength = Number.parseInt(lengthHeader ?? '', 10);

  const bodySize = (() => {
    if (typeof req.body === 'string') return Buffer.byteLength(req.body);
    if (req.body && typeof req.body === 'object') return Buffer.byteLength(JSON.stringify(req.body));
    return 0;
  })();

  const effectiveLength = Number.isFinite(declaredLength) ? Math.max(declaredLength, bodySize) : bodySize;

  if (effectiveLength > MAX_BODY_SIZE_BYTES) {
    return res.status(413).json({ success: false, message: 'Request payload too large' });
  }

  next();
};

export const rejectNoSqlOperators = (req, res, next) => {
  if (hasDangerousKey(req.body) || hasDangerousKey(req.query) || hasDangerousKey(req.params)) {
    return res.status(400).json({ success: false, message: 'Invalid request payload' });
  }

  next();
};

export const requireHttps = (req, res, next) => {
  if (process.env.FORCE_HTTPS !== 'true') return next();

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  if (protocol === 'https') return next();

  return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
};

export const getSafeErrorMessage = (statusCode, error) => {
  const message = error?.message || 'Something went wrong';

  if (statusCode >= 500) {
    return 'Internal server error';
  }

  return message;
};

export const isValidObjectId = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  return mongoose.Types.ObjectId.isValid(String(value));
};

export const sanitizeResourceStatus = (value, allowedValues = []) => {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toUpperCase();
  const acceptedValues = allowedValues.length ? allowedValues : [];

  if (!acceptedValues.includes(normalized)) return null;

  return normalized;
};

export const getCorsOptions = () => {
  const allowedOrigins = new Set();
  const configuredOrigin = (process.env.CLIENT_URL || '').replace(/\/$/, '');

  if (configuredOrigin) allowedOrigins.add(configuredOrigin);

  if (process.env.NODE_ENV !== 'production') {
    ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:3001'].forEach((origin) => {
      allowedOrigins.add(origin);
    });
  }

  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  };
};

export const getSecurityHeadersConfig = () => ({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    fullscreen: ['self'],
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: false,
});

export const auditLog = (action) => (req, res, next) => {
  const userId = req.user?.id || 'anonymous';
  console.info(`[audit] action=${action} user=${userId} method=${req.method} path=${req.originalUrl}`);
  next();
};
