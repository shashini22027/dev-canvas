const dangerousKeyPattern = /^\$/;

const hasDangerousKey = (value) => {
  if (!value || typeof value !== 'object') return false;

  return Object.entries(value).some(([key, nestedValue]) => (
    dangerousKeyPattern.test(key) || key.includes('.') || hasDangerousKey(nestedValue)
  ));
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
