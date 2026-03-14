module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  return res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'production' : 'development',
    envVars: {
      KV_REST_API_URL: process.env.KV_REST_API_URL ? 'EXISTS ✅' : 'MISSING ❌',
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'EXISTS ✅' : 'MISSING ❌',
      KV_URL: process.env.KV_URL ? 'EXISTS ✅' : 'MISSING ❌',
      // Show first few chars to verify they're correct
      urlPreview: process.env.KV_REST_API_URL ? process.env.KV_REST_API_URL.substring(0, 40) + '...' : 'none',
      tokenPreview: process.env.KV_REST_API_TOKEN ? process.env.KV_REST_API_TOKEN.substring(0, 20) + '...' : 'none'
    }
  });
};
