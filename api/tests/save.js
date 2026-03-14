const db = require('./shared-db');

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
    
    db.save(testId, testRecord);
    
    const stats = db.stats();
    console.log(`✅ Test saved! DB Stats:`, stats);
    
    return { success: true, id: testId, stats };
  } catch (error) {
    console.error('❌ Save error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = async (req, res) => {
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
    const testData = req.body;
    
    console.log('📥 Saving test:', {
      student: testData.student_name,
      code: testData.student_code,
      score: testData.total_score
    });

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
      error: error.message
    });
  }
};
