const fs = require('fs');

const DB_FILE = '/tmp/sat-tests-db.json';
let inMemoryDB = { tests: {} };

function readDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.log('Reading from memory');
    }
    return inMemoryDB;
}

function getTutorTests(tutorId, days = 15) {
    try {
        const db = readDatabase();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const tests = Object.values(db.tests)
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
        
        return tests;
    } catch (error) {
        console.error('Error getting tests:', error);
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
    
    console.log(`✅ Found ${tests.length} tests`);
    
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
