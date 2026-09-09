const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const key = event.queryStringParameters && event.queryStringParameters.key;
  if (!key) {
    return { statusCode: 400, body: 'Missing key' };
  }

  const store = getStore({
    name: 'trip-photos',
    siteID: process.env.BLOBS_SITE_ID,
    token: process.env.BLOBS_TOKEN,
  });
  const result = await store.getWithMetadata(key, { type: 'arrayBuffer' });
  if (!result) {
    return { statusCode: 404, body: 'Not found' };
  }

  const contentType = (result.metadata && result.metadata.contentType) || 'application/octet-stream';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    isBase64Encoded: true,
    body: Buffer.from(result.data).toString('base64'),
  };
};
