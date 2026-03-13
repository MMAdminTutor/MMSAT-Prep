const fs = require('fs');
const path = require('path');

// Use /tmp directory on Vercel
const DB_FILE = '/tmp/sat-tests-db.json';

// In-memory fallback
let inMemoryDB = { tests: {} };

function initDatabase() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, JSON.stringify({ tests: {} }, null, 2));
        }
    } catch (error) {
        console.log('Using in-memory storage');
    }
}

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

function writeDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        inMemoryDB = data;
        return true;
    }
}

function saveTest(testData) {
    try {
        const db = readDatabase();
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
        
        db.tests[testId] = testRecord;
        writeDatabase(db);
        
        return { success: true, id: testId };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initDatabase();
    const testData = req.body;
    
    console.log('📥 Saving test:', {
      student: testData.student_name,
      code: testData.student_code,
      score: testData.total_score
    });

    const result = saveTest(testData);
    
    if (result.success) {
      console.log('✅ Test saved:', result.id);
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
};
