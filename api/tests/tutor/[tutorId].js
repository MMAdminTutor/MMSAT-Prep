const { kv } = require('@vercel/kv');

async function getTutorTests(tutorId, days = 15) {
  try {
    const tutorKey = `tutor:${tutorId}`;
    const testIds = await kv.smembers(tutorKey);
    
    if (!testIds || testIds.length === 0) {
      return [];
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const tests = [];
    for (const testId of testIds) {
      const test = await kv.get(testId);
      if (test) {
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
    console.error('❌ KV get error:', error);
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
    
    console.log(`✅ Found ${tests.length} tests in KV`);
    
    return res.status(200).json({
      success: true,
      tests: tests,
      count: tests.length
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
};
