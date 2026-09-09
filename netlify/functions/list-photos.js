const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const day = event.queryStringParameters && event.queryStringParameters.day;
  const store = getStore({
    name: 'trip-photos',
    siteID: process.env.BLOBS_SITE_ID,
    token: process.env.BLOBS_TOKEN,
  });

  const prefix = day ? `${String(day).replace(/[^a-zA-Z0-9_-]/g, '_')}/` : '';
  const { blobs } = await store.list({ prefix });

  const items = await Promise.all(
    blobs.map(async (b) => {
      const meta = await store.getMetadata(b.key);
      return {
        key: b.key,
        metadata: meta ? meta.metadata : {},
      };
    })
  );

  items.sort((a, b) => (a.metadata.uploadedAt || '').localeCompare(b.metadata.uploadedAt || ''));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  };
};
