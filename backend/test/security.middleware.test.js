import test from 'node:test';
import assert from 'node:assert/strict';
import { csrfProtection } from '../src/middleware/csrf.middleware.js';
import { rejectNoSqlOperators, limitRequestBody } from '../src/middleware/security.middleware.js';

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
