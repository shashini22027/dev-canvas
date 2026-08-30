import test from 'node:test';
import assert from 'node:assert/strict';
import { csrfProtection } from '../src/middleware/csrf.middleware.js';
import { rejectNoSqlOperators, limitRequestBody, createRateLimiter, getSafeErrorMessage, getSecurityHeadersConfig, getCorsOptions, isValidObjectId, sanitizeResourceStatus, validateUploadedImage } from '../src/middleware/security.middleware.js';
import { getAuthTokenFromCookie, clearAuthTokenCookie, getJwtSecret, logoutFromAsgardeo, sanitizeProfileUpdate } from '../src/controllers/auth.controller.js';

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return response;
};

test('rejects unsafe requests with missing CSRF token', () => {
  const req = {
    method: 'POST',
    headers: {},
    user: { csrfToken: 'known-token' },
  };
  const res = createResponse();
  let nextCalled = false;

  csrfProtection(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, 'Invalid CSRF token');
});

test('allows unsafe requests with matching CSRF token', () => {
  const req = {
    method: 'PATCH',
    headers: { 'x-csrf-token': 'known-token' },
    user: { csrfToken: 'known-token' },
  };
  const res = createResponse();
  let nextCalled = false;

  csrfProtection(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('rejects NoSQL operator keys in request body', () => {
  const req = {
    body: { email: { $ne: '' } },
    query: {},
    params: {},
  };
  const res = createResponse();
  let nextCalled = false;

  rejectNoSqlOperators(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Invalid request payload');
});

test('rejects oversized request bodies even when content-length is missing', () => {
  const req = {
    headers: {},
    body: {
      data: 'x'.repeat(2 * 1024 * 1024),
    },
  };
  const res = createResponse();
  let nextCalled = false;

  limitRequestBody(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 413);
  assert.equal(res.body.message, 'Request payload too large');
});

test('blocks repeated requests after the rate limit is exceeded', () => {
  const limiter = createRateLimiter({ windowMs: 60 * 1000, max: 1 });
  const req = { ip: '203.0.113.10', headers: {} };
  const res = createResponse();

  let firstNextCalled = false;
  let secondNextCalled = false;

  limiter(req, res, () => {
    firstNextCalled = true;
  });

  limiter(req, res, () => {
    secondNextCalled = true;
  });

  assert.equal(firstNextCalled, true);
  assert.equal(secondNextCalled, false);
  assert.equal(res.statusCode, 429);
  assert.equal(res.body.message, 'Too many requests, please try again later.');
});

test('hides internal error details from client responses', () => {
  assert.equal(getSafeErrorMessage(500, new Error('MongoDB connection lost')), 'Internal server error');
  assert.equal(getSafeErrorMessage(400, new Error('Bad request details')), 'Bad request details');
});

test('enforces secure default headers for the application', () => {
  const config = getSecurityHeadersConfig();

  assert.equal(config.hidePoweredBy, true);
  assert.equal(config.frameguard.action, 'deny');
  assert.equal(config.noSniff, true);
  assert.equal(config.hsts.maxAge, 31536000);
  assert.equal(config.referrerPolicy.policy, 'strict-origin-when-cross-origin');
  assert.deepEqual(config.permissionsPolicy.camera, []);
  assert.deepEqual(config.permissionsPolicy.microphone, []);
  assert.deepEqual(config.permissionsPolicy.geolocation, []);
});

test('reads the auth token from a secure cookie instead of the URL', () => {
  const req = { cookies: { devcanvas_auth_token: 'jwt.from.cookie' }, query: { token: 'jwt.from.url' } };
  assert.equal(getAuthTokenFromCookie(req), 'jwt.from.cookie');
  assert.equal(getAuthTokenFromCookie({ cookies: {} }), undefined);
});

test('clears the auth token cookie during logout', () => {
  let cookieOptions = null;
  const res = {
    clearCookie(name, options) {
      cookieOptions = { name, options };
    }
  };

  clearAuthTokenCookie(res);

  assert.equal(cookieOptions.name, 'devcanvas_auth_token');
  assert.equal(cookieOptions.options.path, '/');
  assert.equal(cookieOptions.options.httpOnly, true);
});

test('uses a local login redirect instead of an external Asgardeo logout redirect', () => {
  const previousClientUrl = process.env.CLIENT_URL;
  const previousLogoutEndpoint = process.env.ASGARDEO_LOGOUT_ENDPOINT;
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.ASGARDEO_LOGOUT_ENDPOINT = 'https://accounts.asgardeo.io/t/mydevcanvas/authenticationendpoint/oauth2_logout.do';

  let redirectUrl = null;
  const res = {
    clearCookie() {},
    redirect(url) {
      redirectUrl = url;
    },
  };

  logoutFromAsgardeo({}, res);

  assert.equal(redirectUrl, 'http://localhost:5173/login');

  process.env.CLIENT_URL = previousClientUrl;
  process.env.ASGARDEO_LOGOUT_ENDPOINT = previousLogoutEndpoint;
});

test('allows only the configured frontend origin in CORS requests', () => {
  const previousClientUrl = process.env.CLIENT_URL;
  process.env.CLIENT_URL = 'http://localhost:5173';

  const corsOptions = getCorsOptions();

  let allowed = false;
  let rejected = false;

  corsOptions.origin('http://localhost:5173', (err, allow) => {
    allowed = !err && allow === true;
  });

  corsOptions.origin('https://evil.example', (err) => {
    rejected = !!err;
  });

  assert.equal(allowed, true);
  assert.equal(rejected, true);
  assert.equal(corsOptions.credentials, true);

  process.env.CLIENT_URL = previousClientUrl;
});

test('ignores unsafe profile fields and sanitizes profile updates', () => {
  const sanitized = sanitizeProfileUpdate({
    name: '  Alice <script>alert(1)</script>  ',
    profilePic: 'https://example.com/pic.jpg<script>',
    role: 'ADMIN',
    email: 'admin@example.com',
  });

  assert.deepEqual(sanitized, {
    name: 'Alice',
    profilePic: 'https://example.com/pic.jpg',
  });
});

test('rejects malformed Mongo object ids before database access', () => {
  assert.equal(isValidObjectId('not-a-valid-id'), false);
  assert.equal(isValidObjectId('507f1f77bcf86cd799439011'), true);
});

test('sanitizes project status values to the known enum set', () => {
  const allowed = ['PENDING', 'APPROVED', 'REJECTED'];

  assert.equal(sanitizeResourceStatus('APPROVED', allowed), 'APPROVED');
  assert.equal(sanitizeResourceStatus('approved', allowed), 'APPROVED');
  assert.equal(sanitizeResourceStatus('SUSPENDED', allowed), null);
});

test('rejects malicious uploaded image payloads that do not match valid signatures', () => {
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const validJpeg = Buffer.from([0xff, 0xd8, 0xff]);
  const htmlPayload = Buffer.from('<svg onload=alert(1)>');

  assert.equal(validateUploadedImage({
    fieldname: 'coverImage',
    originalname: 'image.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.concat([pngHeader, Buffer.from('png-data')]),
  }), true);

  assert.equal(validateUploadedImage({
    fieldname: 'coverImage',
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.concat([validJpeg, Buffer.from('jpeg-data')]),
  }), true);

  assert.equal(validateUploadedImage({
    fieldname: 'coverImage',
    originalname: 'script.svg',
    mimetype: 'image/svg+xml',
    size: 1024,
    buffer: htmlPayload,
  }), false);

  assert.equal(validateUploadedImage({
    fieldname: 'coverImage',
    originalname: 'bad.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('not-a-real-png'),
  }), false);
});

test('requires a strong JWT secret before issuing tokens', () => {
  const previous = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  assert.throws(() => getJwtSecret(), /JWT_SECRET/i);

  process.env.JWT_SECRET = previous;
});
