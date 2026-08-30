const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const csrfProtection = (req, res, next) => {
  if (!unsafeMethods.includes(req.method)) return next();

  const expectedToken = req.user?.csrfToken;
  const providedToken = req.headers['x-csrf-token'];

  if (!expectedToken) return next();

  if (!providedToken || providedToken !== expectedToken) {
    return res.status(403).json({ success: false, message: 'Invalid CSRF token' });
  }

  next();
};
