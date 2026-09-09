const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const secret = process.env.PHOTO_UPLOAD_SECRET;
  if (secret && event.headers['x-photo-secret'] !== secret) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!payload.key) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing key' }) };
  }

  const store = getStore({
    name: 'trip-photos',
    siteID: process.env.BLOBS_SITE_ID,
    token: process.env.BLOBS_TOKEN,
  });
  await store.delete(payload.key);

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
