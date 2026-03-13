const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// IMPORTANT: Load database module
let db;
try {
    db = require('./database');
    console.log('✅ Database module loaded');
} catch (error) {
    console.error('❌ CRITICAL: Failed to load database.js');
    console.error('Error:', error.message);
}

const app = express();

// CORS - Allow all origins for now
app.use(cors());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('📡 Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    message: 'SAT Practice API is running',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Save test results
app.post('/api/tests/save', (req, res) => {
  try {
    console.log('📥 POST /api/tests/save - Received request');
    const testData = req.body;
    
    console.log('Test data:', {
      student: testData.student_name,
      code: testData.student_code,
      score: testData.total_score
    });
    
    if (!db || typeof db.saveTest !== 'function') {
      console.error('❌ Database not available');
      return res.status(500).json({
        success: false,
        error: 'Database function not available'
      });
    }
    
    const result = db.saveTest(testData);
    
    if (result.success) {
      console.log('✅ Test saved:', result.id);
      return res.status(200).json(result);
    } else {
      console.error('❌ Failed to save:', result.error);
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get tests for a specific student
app.get('/api/tests/student/:studentCode', (req, res) => {
  try {
    console.log('📥 GET /api/tests/student/:studentCode');
    const { studentCode } = req.params;
    const days = parseInt(req.query.days) || 15;
    
    console.log(`Fetching tests for student: ${studentCode}`);
    
    if (!db || typeof db.getStudentTests !== 'function') {
      return res.status(500).json({
        success: false,
        error: 'Database function not available'
      });
    }
    
    const tests = db.getStudentTests(studentCode, days);
    
    console.log(`Found ${tests.length} tests`);
    
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
});

// Get all tests for a tutor's students
app.get('/api/tests/tutor/:tutorId', (req, res) => {
  try {
    console.log('📥 GET /api/tests/tutor/:tutorId');
    const { tutorId } = req.params;
    const days = parseInt(req.query.days) || 15;
    
    console.log(`Fetching tests for tutor: ${tutorId}`);
    
    if (!db || typeof db.getTutorTests !== 'function') {
      return res.status(500).json({
        success: false,
        error: 'Database function not available'
      });
    }
    
    const tests = db.getTutorTests(tutorId, days);
    
    console.log(`Found ${tests.length} tests`);
    
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
});

// Default route - serve login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Handle 404
app.use((req, res) => {
  console.log('404:', req.url);
  res.status(404).json({ error: 'Not found', path: req.url });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('🚀 Server running on port', PORT);
  });
}

// Export for Vercel serverless
module.exports = app;
