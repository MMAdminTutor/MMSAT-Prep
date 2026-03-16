// Vercel Serverless Function - api/save.js
// This creates the endpoint: https://mmsat-prep.vercel.app/api/save

const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();

async function saveTest(testData) {
  try {
    const timestamp = Date.now();
    const testId = `test_${timestamp}_${testData.student_code}`;
    
    const testRecord = {
      id: testId,
      student_code: testData.student_code,
      student_name: testData.student_name,
      tutor_id: testData.tutor_id,
      test_type: testData.test_type,
      total_score: testData.total_score,
      reading_score: testData.reading_score,
      math_score: testData.math_score,
      test_data: testData.test_data,
      created_at: new Date().toISOString()
    };
    
    console.log('💾 Saving to Upstash:', testId);
    
    // Save test
    await redis.set(testId, JSON.stringify(testRecord));
    console.log('✅ Test saved');
    
    // Add to student index
    const studentKey = `student:${testData.student_code}`;
    await redis.sadd(studentKey, testId);
    console.log('✅ Added to student index');
    
    // Add to tutor index
    const tutorKey = `tutor:${testData.tutor_id}`;
    await redis.sadd(tutorKey, testId);
    console.log('✅ Added to tutor index');
    
    console.log(`✅ Success! Test saved to Upstash: ${testId}`);
    return { success: true, id: testId };
  } catch (error) {
    console.error('❌ Upstash error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    const testData = req.body;
    
    console.log('📥 Received save request');
    console.log('Student:', testData.student_name);
    console.log('Code:', testData.student_code);
    console.log('Score:', testData.total_score);
    
    const result = await saveTest(testData);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
