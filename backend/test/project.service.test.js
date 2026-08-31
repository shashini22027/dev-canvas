import test from 'node:test';
import assert from 'node:assert/strict';
import cloudinary from '../src/lib/cloudinary.js';
import { uploadToCloudinary } from '../src/services/project.service.js';

test('returns a fallback image URL when Cloudinary upload fails', async () => {
  const originalUploadStream = cloudinary.uploader.upload_stream;

  cloudinary.uploader.upload_stream = (_options, callback) => {
    process.nextTick(() => callback(new Error('Failed to ping image'), null));
    return {
      end() {},
    };
  };

  try {
    const result = await uploadToCloudinary(Buffer.from('fake-image'), 'dev-canvas/projects');
    assert.equal(typeof result, 'string');
    assert.match(result, /^https?:\/\//);
  } finally {
    cloudinary.uploader.upload_stream = originalUploadStream;
  }
});
