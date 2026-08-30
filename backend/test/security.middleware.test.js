import test from 'node:test';
import assert from 'node:assert/strict';
import { csrfProtection } from '../src/middleware/csrf.middleware.js';
import { rejectNoSqlOperators, limitRequestBody, createRateLimiter, getSafeErrorMessage, getSecurityHeadersConfig } from '../src/middleware/security.middleware.js';
import { getAuthTokenFromCookie, clearAuthTokenCookie } from '../src/controllers/auth.controller.js';

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
