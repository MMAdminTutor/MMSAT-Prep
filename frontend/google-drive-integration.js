// ============================================
// SAT TEST - GOOGLE DRIVE INTEGRATION
// ============================================
// Add this code to your existing SAT test to load questions from Google Drive
// This enables real-time sync - students see new questions automatically!

// ============================================
// ⚙️ CONFIGURATION - REPLACE WITH YOUR CREDENTIALS
// ============================================
const GOOGLE_API_KEY = 'YOUR_API_KEY_HERE';
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';

// Don't change these
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// ============================================
// Global Variables
// ============================================
let gapiInitialized = false;
let questionBank = null;
let driveFileId = null;

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
        
        // Search for the file
        const response = await gapi.client.drive.files.list({
            q: "name='questions-adaptive.json' and trashed=false",
            spaces: 'drive',
            fields: 'files(id, name, modifiedTime)',
            pageSize: 1
        });
        
        const files = response.result.files;
        
        if (files && files.length > 0) {
            driveFileId = files[0].id;
            console.log('📄 Found file:', files[0].name, '(Modified:', files[0].modifiedTime, ')');
            
            // Download the file content
            const fileResponse = await gapi.client.drive.files.get({
                fileId: driveFileId,
                alt: 'media'
            });
            
            // Parse the JSON
            questionBank = JSON.parse(fileResponse.body);
            
            // Calculate totals
            const total = countQuestions(questionBank);
            console.log('✅ Loaded', total, 'questions from Google Drive');
            
            return questionBank;
            
        } else {
            console.warn('⚠️ questions-adaptive.json not found in Google Drive');
            console.log('💡 Make sure the tutor has connected and created the file first');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error loading from Google Drive:', error);
        
        // Fallback to local file
        console.log('🔄 Falling back to local questions-adaptive.json...');
        return await loadLocalQuestionBank();
    }
}

// ============================================
// Fallback: Load Local Question Bank
// ============================================
async function loadLocalQuestionBank() {
    try {
        const response = await fetch('questions-adaptive.json');
        questionBank = await response.json();
        console.log('✅ Loaded local question bank as fallback');
        return questionBank;
    } catch (error) {
        console.error('❌ Error loading local file:', error);
        return null;
    }
}

// ============================================
// Count Questions Helper
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
// Auto-Refresh Question Bank
// ============================================
async function refreshQuestionBank() {
    try {
        console.log('🔄 Refreshing question bank from Drive...');
        const updated = await loadQuestionBankFromDrive();
        
        if (updated) {
            questionBank = updated;
            console.log('✅ Question bank refreshed');
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Error refreshing:', error);
        return false;
    }
}

// ============================================
// Setup Auto-Refresh (Every 5 Minutes)
// ============================================
function startAutoRefresh() {
    // Refresh every 5 minutes
    setInterval(async () => {
        await refreshQuestionBank();
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('⏰ Auto-refresh enabled (every 5 minutes)');
}

// ============================================
// MAIN INITIALIZATION FUNCTION
// ============================================
// Call this when your SAT test starts
async function initializeSATTest() {
    try {
        console.log('🚀 Initializing SAT Test with Google Drive sync...');
        
        // Step 1: Initialize Google Drive API
        await initGoogleDrive();
        
        // Step 2: Load question bank
        questionBank = await loadQuestionBankFromDrive();
        
        if (!questionBank) {
            throw new Error('Failed to load question bank');
        }
        
        // Step 3: Start auto-refresh
        startAutoRefresh();
        
        console.log('✅ SAT Test initialized successfully!');
        console.log('📊 Question bank:', countQuestions(questionBank), 'questions');
        console.log('🔄 Real-time sync enabled');
        
        return questionBank;
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        console.log('⚠️ Falling back to local file...');
        
        // Fallback to local
        questionBank = await loadLocalQuestionBank();
        return questionBank;
    }
}

// ============================================
// USAGE IN YOUR SAT TEST
// ============================================

/*

// Example: How to use in your existing SAT test

// 1. Add Google API script to your HTML
<script src="https://apis.google.com/js/api.js"></script>

// 2. Call initialization when test starts
window.addEventListener('DOMContentLoaded', async () => {
    // Initialize with Google Drive sync
    const questions = await initializeSATTest();
    
    // Now use the questions
    console.log('Questions loaded:', questions);
    
    // Your existing SAT test code here
    startTest(questions);
});

// 3. Access questions from the global questionBank variable
function getRandomQuestion(category, difficulty) {
    if (category === 'reading') {
        return questionBank.standalone_reading[difficulty];
    } else if (category === 'math') {
        return questionBank.math[difficulty];
    }
}

// 4. Manual refresh (optional)
// Call this if you want to manually refresh during test
async function manualRefresh() {
    const refreshed = await refreshQuestionBank();
    if (refreshed) {
        alert('✅ Question bank updated!');
    }
}

*/

// ============================================
// COMPLETE EXAMPLE INTEGRATION
// ============================================

/*
<!DOCTYPE html>
<html>
<head>
    <title>SAT Practice Test</title>
    
    <!-- Add Google Drive API -->
    <script src="https://apis.google.com/js/api.js"></script>
    
    <!-- Your existing stylesheets -->
    <link rel="stylesheet" href="your-styles.css">
</head>
<body>
    <div id="test-container">
        <!-- Your test UI -->
    </div>
    
    <!-- Add this integration script -->
    <script src="google-drive-integration.js"></script>
    
    <!-- Your existing test script -->
    <script>
        // Initialize test with Google Drive
        window.addEventListener('DOMContentLoaded', async () => {
            // Show loading
            document.getElementById('test-container').innerHTML = 
                '<div class="loading">Loading questions from Google Drive...</div>';
            
            // Load questions
            const questions = await initializeSATTest();
            
            if (questions) {
                // Hide loading, start test
                startSATTest(questions);
            } else {
                // Show error
                alert('Failed to load questions');
            }
        });
        
        // Your existing test functions
        function startSATTest(questions) {
            console.log('Starting test with', countQuestions(questions), 'questions');
            // Your test logic here
        }
    </script>
</body>
</html>
*/

// ============================================
// ALTERNATIVE: Simpler Integration
// ============================================

/*
// If you just want to replace your existing loadQuestions() function:

// BEFORE (your old code):
async function loadQuestions() {
    const response = await fetch('questions-adaptive.json');
    questionBank = await response.json();
}

// AFTER (with Google Drive):
async function loadQuestions() {
    await initGoogleDrive();
    questionBank = await loadQuestionBankFromDrive();
    startAutoRefresh(); // Enable auto-refresh
}
*/

// ============================================
// TROUBLESHOOTING
// ============================================

/*

COMMON ISSUES:

1. "API key not valid"
   → Make sure you replaced YOUR_API_KEY_HERE with actual key
   → Check that Google Drive API is enabled in console

2. "File not found"
   → Tutor must connect and create file first
   → Check file is named exactly "questions-adaptive.json"

3. "CORS error"
   → This is normal - Google Drive API handles CORS
   → If using local file fallback, run with local server

4. "Questions not updating"
   → Check console logs
   → Wait 5 minutes for auto-refresh
   → Or call refreshQuestionBank() manually

5. "Load failed"
   → Script falls back to local file automatically
   → Check console for specific error

*/

// ============================================
// MONITORING & DEBUGGING
// ============================================

// Add this to see sync status in console
function showSyncStatus() {
    console.log('📊 SYNC STATUS:');
    console.log('  Google Drive:', gapiInitialized ? '✅ Connected' : '❌ Not connected');
    console.log('  Questions:', questionBank ? countQuestions(questionBank) : 0);
    console.log('  File ID:', driveFileId || 'None');
    console.log('  Auto-refresh:', 'Every 5 minutes');
}

// Call this anytime to check status
// showSyncStatus();

console.log('📚 Google Drive integration loaded. Call initializeSATTest() to start.');
