// ============================================
// STUDENT TEST - RESULTS SUBMISSION TO GOOGLE DRIVE
// ============================================
// Add this code to your student SAT test to automatically save results

// ============================================
// ⚙️ CONFIGURATION - REPLACE WITH YOUR CREDENTIALS
// ============================================
const GOOGLE_API_KEY = 'AIzaSyD_EJqCpoifPI3JAjofiovRi0Y8JGjGoSw';
const GOOGLE_CLIENT_ID = '970642492682-9k1oocejep3ovdj08apg6jhmjrd7vrrv.apps.googleusercontent.com';

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// ============================================
// Global Variables
// ============================================
let gapiInitialized = false;
let questionBank = null;
let resultsFileId = null;
let currentTestResults = {
    studentName: '',
    testName: '',
    answers: [],
    startTime: null,
    endTime: null
};

// ============================================
// Initialize Google Drive API
// ============================================
async function initGoogleDrive() {
    return new Promise((resolve, reject) => {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: GOOGLE_API_KEY,
                    discoveryDocs: [DISCOVERY_DOC],
                });
                gapiInitialized = true;
                console.log('✅ Google Drive API initialized');
                resolve();
            } catch (error) {
                console.error('❌ Error initializing Google Drive:', error);
                reject(error);
            }
        });
    });
}

// ============================================
// Load Question Bank from Google Drive
// ============================================
async function loadQuestionBankFromDrive() {
    try {
        console.log('📥 Loading question bank from Google Drive...');
        
        const response = await gapi.client.drive.files.list({
            q: "name='questions-adaptive.json' and trashed=false",
            spaces: 'drive',
            fields: 'files(id, name)',
            pageSize: 1
        });
        
        const files = response.result.files;
        
        if (files && files.length > 0) {
            const fileId = files[0].id;
            
            const fileResponse = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });
            
            questionBank = JSON.parse(fileResponse.body);
            console.log('✅ Loaded', countQuestions(questionBank), 'questions from Drive');
            
            return questionBank;
        } else {
            console.warn('⚠️ questions-adaptive.json not found');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error loading question bank:', error);
        return null;
    }
}

// ============================================
// Find Results File ID
// ============================================
async function findResultsFile() {
    try {
        const response = await gapi.client.drive.files.list({
            q: "name='student-results.json' and trashed=false",
            spaces: 'drive',
            fields: 'files(id, name)',
            pageSize: 1
        });
        
        const files = response.result.files;
        
        if (files && files.length > 0) {
            resultsFileId = files[0].id;
            console.log('📄 Found results file');
            return true;
        } else {
            console.log('📝 Results file not found, will be created by tutor');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error finding results file:', error);
        return false;
    }
}

// ============================================
// Submit Test Results
// ============================================
async function submitTestResults(studentName, testName, answers, correctAnswers) {
    try {
        console.log('📤 Submitting test results...');
        
        // Calculate scores
        const totalQuestions = answers.length;
        const correctCount = answers.filter((a, i) => a === correctAnswers[i]).length;
        const score = Math.round((correctCount / totalQuestions) * 100);
        
        // Calculate reading and math scores separately
        const readingAnswers = answers.filter((a, i) => correctAnswers[i].category === 'reading');
        const mathAnswers = answers.filter((a, i) => correctAnswers[i].category === 'math');
        
        const readingCorrect = readingAnswers.filter((a, i) => a === correctAnswers[i]).length;
        const mathCorrect = mathAnswers.filter((a, i) => a === correctAnswers[i]).length;
        
        const readingScore = readingAnswers.length > 0 ? Math.round((readingCorrect / readingAnswers.length) * 100) : 0;
        const mathScore = mathAnswers.length > 0 ? Math.round((mathCorrect / mathAnswers.length) * 100) : 0;
        
        // Calculate time spent
        const timeSpent = currentTestResults.endTime && currentTestResults.startTime
            ? Math.round((currentTestResults.endTime - currentTestResults.startTime) / 60000) + ' min'
            : 'N/A';
        
        // Create result object
        const result = {
            id: `result_${Date.now()}`,
            studentName: studentName,
            testName: testName,
            score: score,
            readingScore: readingScore,
            mathScore: mathScore,
            correctCount: correctCount,
            totalQuestions: totalQuestions,
            date: new Date().toISOString(),
            timeSpent: timeSpent,
            answers: answers.map((a, i) => ({
                questionId: correctAnswers[i].id,
                studentAnswer: a,
                correctAnswer: correctAnswers[i].correct,
                isCorrect: a === correctAnswers[i].correct
            }))
        };
        
        // Load existing results
        await findResultsFile();
        
        if (resultsFileId) {
            // Load existing results
            const fileResponse = await gapi.client.drive.files.get({
                fileId: resultsFileId,
                alt: 'media'
            });
            
            let existingResults = JSON.parse(fileResponse.body);
            
            // Add new result
            existingResults.push(result);
            
            // Update file
            const content = JSON.stringify(existingResults, null, 2);
            
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${resultsFileId}?uploadType=media`, {
                method: 'PATCH',
                headers: new Headers({
                    'Authorization': 'Bearer ' + gapi.client.getToken().access_token,
                    'Content-Type': 'application/json'
                }),
                body: content
            });
            
            console.log('✅ Results submitted successfully!');
            console.log('📊 Score:', score + '%');
            
            return {
                success: true,
                score: score,
                readingScore: readingScore,
                mathScore: mathScore
            };
            
        } else {
            console.warn('⚠️ Results file not found. Tutor needs to connect first.');
            return {
                success: false,
                error: 'Results file not found'
            };
        }
        
    } catch (error) {
        console.error('❌ Error submitting results:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// Helper: Count Questions
// ============================================
function countQuestions(bank) {
    if (!bank) return 0;
    
    const reading = Object.values(bank.standalone_reading || {}).reduce((a, b) => a + b.length, 0);
    const math = Object.values(bank.math || {}).reduce((a, b) => a + b.length, 0);
    const gridin = Object.values(bank.math_gridin || {}).reduce((a, b) => a + b.length, 0);
    const passages = bank.passages ? bank.passages.reduce((s, p) => s + p.questions.length, 0) : 0;
    
    return reading + math + gridin + passages;
}

// ============================================
// MAIN INITIALIZATION FUNCTION
// ============================================
async function initializeSATTest() {
    try {
        console.log('🚀 Initializing SAT Test with result tracking...');
        
        // Initialize Google Drive
        await initGoogleDrive();
        
        // Load question bank
        questionBank = await loadQuestionBankFromDrive();
        
        if (!questionBank) {
            console.warn('⚠️ Using local question bank');
            const response = await fetch('questions-adaptive.json');
            questionBank = await response.json();
        }
        
        console.log('✅ SAT Test initialized');
        return questionBank;
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        return null;
    }
}

// ============================================
// TEST LIFECYCLE FUNCTIONS
// ============================================

// Call this when test starts
function startTest(studentName, testName) {
    currentTestResults = {
        studentName: studentName,
        testName: testName,
        answers: [],
        startTime: Date.now(),
        endTime: null
    };
    console.log('📝 Test started for:', studentName);
}

// Call this when student answers a question
function recordAnswer(questionId, answer) {
    currentTestResults.answers.push({
        questionId: questionId,
        answer: answer,
        timestamp: Date.now()
    });
}

// Call this when test ends
async function endTest() {
    currentTestResults.endTime = Date.now();
    
    // Get correct answers from question bank
    const correctAnswers = getCorrectAnswers(currentTestResults.answers);
    
    // Submit results
    const result = await submitTestResults(
        currentTestResults.studentName,
        currentTestResults.testName,
        currentTestResults.answers.map(a => a.answer),
        correctAnswers
    );
    
    return result;
}

// Helper to get correct answers
function getCorrectAnswers(studentAnswers) {
    // This would map student answers to correct answers from question bank
    // Implement based on your question bank structure
    return studentAnswers.map(sa => {
        // Find the question in question bank
        // Return { id, correct, category }
        return { id: sa.questionId, correct: 0, category: 'reading' }; // Placeholder
    });
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*

// EXAMPLE 1: Complete Integration
// --------------------------------

<!DOCTYPE html>
<html>
<head>
    <title>SAT Practice Test</title>
    <script src="https://apis.google.com/js/api.js"></script>
</head>
<body>
    <div id="test-container">
        <!-- Test UI -->
        <input type="text" id="studentName" placeholder="Enter your name">
        <button onclick="beginTest()">Start Test</button>
        
        <div id="questions"></div>
        
        <button onclick="finishTest()">Submit Test</button>
    </div>
    
    <script src="student-results-integration.js"></script>
    <script>
        let currentQuestion = 0;
        
        async function beginTest() {
            const name = document.getElementById('studentName').value;
            
            // Initialize
            await initializeSATTest();
            
            // Start test
            startTest(name, 'Practice Test 1');
            
            // Show first question
            showQuestion(0);
        }
        
        function answerQuestion(questionId, answer) {
            // Record answer
            recordAnswer(questionId, answer);
            
            // Next question
            currentQuestion++;
            showQuestion(currentQuestion);
        }
        
        async function finishTest() {
            // End test and submit results
            const result = await endTest();
            
            if (result.success) {
                alert(`Test Complete!\nScore: ${result.score}%\nReading: ${result.readingScore}%\nMath: ${result.mathScore}%`);
            } else {
                alert('Results saved locally. Contact teacher.');
            }
        }
    </script>
</body>
</html>


// EXAMPLE 2: Simple Integration
// ------------------------------

// When test starts
window.addEventListener('DOMContentLoaded', async () => {
    await initializeSATTest();
    
    const studentName = prompt('Enter your name:');
    startTest(studentName, 'Practice Test 1');
});

// When student selects answer
function onAnswerSelected(questionId, answer) {
    recordAnswer(questionId, answer);
}

// When test completes
async function onTestComplete() {
    const result = await endTest();
    displayResults(result);
}


// EXAMPLE 3: Manual Result Submission
// ------------------------------------

async function manualSubmit() {
    await initGoogleDrive();
    
    const result = await submitTestResults(
        'John Doe',                    // Student name
        'Practice Test 1',             // Test name
        [0, 1, 2, 0, 1],              // Student answers (indices)
        [                              // Correct answers
            { id: 'q1', correct: 0, category: 'reading' },
            { id: 'q2', correct: 1, category: 'reading' },
            { id: 'q3', correct: 3, category: 'math' },
            { id: 'q4', correct: 0, category: 'math' },
            { id: 'q5', correct: 2, category: 'reading' }
        ]
    );
    
    console.log('Result:', result);
}

*/

// ============================================
// AUTO-INITIALIZE ON PAGE LOAD (OPTIONAL)
// ============================================

// Uncomment to auto-initialize when page loads
// window.addEventListener('DOMContentLoaded', initializeSATTest);

console.log('📚 Student results integration loaded');
console.log('💡 Call initializeSATTest() to start');
