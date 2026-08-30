import test from 'node:test';
import assert from 'node:assert/strict';

import { limitRequestBody } from '../src/middleware/security.middleware.js';

test('limitRequestBody rejects payloads larger than 1 MB', () => {
  const req = {
    headers: {},
    body: {
      data: 'x'.repeat(2 * 1024 * 1024),
    },
  };

  let statusCode = 200;
  let payload = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(obj) {
      payload = obj;
      return this;
    },
  };

  const next = () => {
    throw new Error('next should not be called when payload is too large');
  };

  limitRequestBody(req, res, next);

  assert.equal(statusCode, 413);
  assert.equal(payload.success, false);
  assert.equal(payload.message, 'Request payload too large');
});
