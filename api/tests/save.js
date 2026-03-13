const db = require('../../backend/database');

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
    const testData = req.body;
    
    console.log('📥 Saving test:', {
      student: testData.student_name,
      code: testData.student_code,
      score: testData.total_score
    });

    const result = db.saveTest(testData);
    
    if (result.success) {
      console.log('✅ Test saved:', result.id);
      return res.status(200).json(result);
    } else {
      console.error('❌ Save failed:', result.error);
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
