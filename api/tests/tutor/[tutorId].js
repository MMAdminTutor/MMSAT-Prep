const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();

async function getTutorTests(tutorId, days = 15) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const tutorKey = `tutor:${tutorId}`;
    const testIds = await redis.smembers(tutorKey);
    
    if (!testIds || testIds.length === 0) {
      console.log(`No test IDs found for tutor: ${tutorId}`);
      return [];
    }
    
    console.log(`Found ${testIds.length} test IDs for tutor ${tutorId}`);
    
    const tests = [];
    for (const testId of testIds) {
      const testData = await redis.get(testId);
      if (testData) {
        const test = typeof testData === 'string' ? JSON.parse(testData) : testData;
        const testDate = new Date(test.created_at);
        if (testDate >= cutoffDate) {
          tests.push({
            id: test.id,
            studentCode: test.student_code,
            studentName: test.student_name,
            testType: test.test_type,
            totalScore: test.total_score,
            readingScore: test.reading_score,
            mathScore: test.math_score,
            testData: test.test_data,
            createdAt: test.created_at
          });
        }
      }
    }
    
    return tests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('❌ Upstash error:', error);
    return [];
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tutorId } = req.query;
    const days = parseInt(req.query.days) || 15;
    
    console.log(`🔍 Getting tests for tutor: ${tutorId}`);
    
    const tests = await getTutorTests(tutorId, days);
    
    console.log(`✅ Returning ${tests.length} tests`);
    
    return res.status(200).json({
      success: true,
      tests: tests,
      count: tests.length
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
};
