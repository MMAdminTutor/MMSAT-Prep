module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log('Testing KV import...');
    const { kv } = require('@vercel/kv');
    console.log('✅ KV imported successfully');
    
    console.log('Testing KV.set...');
    await kv.set('test-key', 'Hello from KV!');
    console.log('✅ KV.set successful');
    
    console.log('Testing KV.get...');
    const value = await kv.get('test-key');
    console.log('✅ KV.get successful, value:', value);
    
    return res.status(200).json({
      success: true,
      message: 'KV is working perfectly!',
      testValue: value
    });
  } catch (error) {
    console.error('❌ KV test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      errorStack: error.stack,
      envVarsPresent: {
        KV_REST_API_URL: !!process.env.KV_REST_API_URL,
        KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
        KV_URL: !!process.env.KV_URL
      }
    });
  }
};
