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

export const auditLog = (action) => (req, res, next) => {
  const userId = req.user?.id || 'anonymous';
  console.info(`[audit] action=${action} user=${userId} method=${req.method} path=${req.originalUrl}`);
  next();
};
