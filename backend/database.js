const fs = require('fs');
const path = require('path');

// Use /tmp directory on Vercel (temporary, but works during function execution)
const DB_FILE = process.env.VERCEL 
    ? '/tmp/sat-tests-db.json'
    : path.join(__dirname, 'sat-tests-db.json');

console.log('📂 Database file location:', DB_FILE);

// In-memory fallback for when file system doesn't work
let inMemoryDB = { tests: {} };

// Initialize database file if it doesn't exist
function initDatabase() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            const initialData = { tests: {} };
            fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
            console.log('📁 Database file created');
        }
    } catch (error) {
        console.log('⚠️ Cannot create file, using in-memory storage');
    }
}

// Read database
function readDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.log('⚠️ Cannot read file, using in-memory storage');
    }
    return inMemoryDB;
}

// Write database
function writeDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.log('⚠️ Cannot write file, storing in memory only');
        inMemoryDB = data;
        return true;
    }
}

// Save test
function saveTest(testData) {
    try {
        console.log('💾 Saving test...');
        const db = readDatabase();
        
        // Generate test ID
        const timestamp = Date.now();
        const testId = `test_${timestamp}_${testData.student_code}`;
        
        // Prepare test record with snake_case fields from frontend
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
        
        // Save to database
        db.tests[testId] = testRecord;
        
        const success = writeDatabase(db);
        
        if (success) {
            console.log(`✅ Test saved: ${testData.student_name} - Score: ${testData.total_score}`);
            console.log(`📊 Total tests in DB: ${Object.keys(db.tests).length}`);
            return { success: true, id: testId };
        } else {
            return { success: false, error: 'Failed to write to database' };
        }
    } catch (error) {
        console.error('❌ Error saving test:', error);
        return { success: false, error: error.message };
    }
}

// Get student tests - Returns in camelCase for frontend
function getStudentTests(studentCode, days = 15) {
    try {
        console.log(`🔍 Getting tests for student: ${studentCode}`);
        const db = readDatabase();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const allTests = Object.values(db.tests);
        console.log(`📊 Total tests in database: ${allTests.length}`);
        
        const tests = allTests
            .filter(test => {
                const testDate = new Date(test.created_at);
                const matchesStudent = test.student_code === studentCode;
                const withinTimeframe = testDate >= cutoffDate;
                
                if (matchesStudent) {
                    console.log(`Found test for ${studentCode}: ${test.id}, date: ${test.created_at}`);
                }
                
                return matchesStudent && withinTimeframe;
            })
            .map(test => ({
                // Return camelCase for frontend
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
        
        console.log(`✅ Returning ${tests.length} tests for ${studentCode}`);
        return tests;
    } catch (error) {
        console.error('❌ Error getting student tests:', error);
        return [];
    }
}

// Get tutor tests - Returns in camelCase for frontend
function getTutorTests(tutorId, days = 15) {
    try {
        console.log(`🔍 Getting tests for tutor: ${tutorId}`);
        const db = readDatabase();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const allTests = Object.values(db.tests);
        console.log(`📊 Total tests in database: ${allTests.length}`);
        
        const tests = allTests
            .filter(test => {
                const testDate = new Date(test.created_at);
                const matchesTutor = test.tutor_id === tutorId;
                const withinTimeframe = testDate >= cutoffDate;
                
                if (matchesTutor) {
                    console.log(`Found test for tutor ${tutorId}: ${test.student_name}`);
                }
                
                return matchesTutor && withinTimeframe;
            })
            .map(test => ({
                // Return camelCase for frontend
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
        
        console.log(`✅ Returning ${tests.length} tests for tutor ${tutorId}`);
        return tests;
    } catch (error) {
        console.error('❌ Error getting tutor tests:', error);
        return [];
    }
}

// Initialize on load
initDatabase();

// Export functions
module.exports = {
    saveTest,
    getStudentTests,
    getTutorTests
};

console.log('✅ Database module loaded successfully');
