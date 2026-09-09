const { getStore } = require('@netlify/blobs');

const MAX_BYTES = 8 * 1024 * 1024; // 8MB decoded, safety margin under Lambda payload limit

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

  const { day, dayLabel, filename, contentType, dataBase64 } = payload;
  if (!day || !filename || !contentType || !dataBase64) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
  }

  const buffer = Buffer.from(dataBase64, 'base64');
  if (buffer.byteLength > MAX_BYTES) {
    return { statusCode: 413, body: JSON.stringify({ error: 'Photo too large' }) };
  }

  const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(-80);
  const safeDay = String(day).replace(/[^a-zA-Z0-9_-]/g, '_');
  const key = `${safeDay}/${Date.now()}-${safeFilename}`;

  const store = getStore({
    name: 'trip-photos',
    siteID: process.env.BLOBS_SITE_ID,
    token: process.env.BLOBS_TOKEN,
  });
  await store.set(key, buffer, {
    metadata: {
      day: safeDay,
      dayLabel: dayLabel || safeDay,
      filename: safeFilename,
      contentType,
      uploadedAt: new Date().toISOString(),
    },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, key }),
  };
};
