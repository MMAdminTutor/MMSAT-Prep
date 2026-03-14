// Global in-memory database (shared across all functions in same instance)
global.testDatabase = global.testDatabase || { tests: {}, initialized: Date.now() };

function getTutorTests(tutorId, days = 15) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const tests = Object.values(global.testDatabase.tests)
      .filter(test => {
        const testDate = new Date(test.created_at);
        return test.tutor_id === tutorId && testDate >= cutoffDate;
      })
      .map(test => ({
        id: test.id,
        studentCode: test.student_code,
        studentName: test.student_name,
        testType: test.test_type,
        totalScore: test.total_score,
        readingScore: test.reading_score,
        mathScore: test.math_score,
        testData: test.test_data,
        createdAt: test.created_at
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const totalTests = Object.keys(global.testDatabase.tests).length;
    console.log(`📊 Total tests in memory: ${totalTests}`);
    console.log(`✅ Found ${tests.length} tests for tutor ${tutorId}`);
    
    return tests;
  } catch (error) {
    console.error('❌ Get error:', error);
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
    
    const tests = getTutorTests(tutorId, days);
    
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
