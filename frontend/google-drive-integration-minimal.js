// ============================================
// MINIMAL GOOGLE DRIVE INTEGRATION
// ============================================
// This enhances your existing loadQuestions() function
// WITHOUT breaking it!

// Add this BEFORE your existing loadQuestions() function

// ============================================
// ⚙️ CONFIGURATION - ADD YOUR CREDENTIALS
// ============================================
const GOOGLE_DRIVE_API_KEY = 'AIzaSyD_EJqCpoifPI3JAjofiovRi0Y8JGjGoSw';
const GOOGLE_DRIVE_CLIENT_ID = '970642492682-9k1oocejep3ovdj08apg6jhmjrd7vrrv.apps.googleusercontent.com';

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiLoaded = false;
let driveConnected = false;

// ============================================
// Initialize Google Drive (auto-run)
// ============================================
async function initGoogleDrive() {
    return new Promise((resolve) => {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: GOOGLE_DRIVE_API_KEY,
                    discoveryDocs: [DISCOVERY_DOC],
                });
                gapiLoaded = true;
                console.log('✅ Google Drive API ready');
                resolve(true);
            } catch (error) {
                console.log('⚠️ Google Drive not available, using local files');
                resolve(false);
            }
        });
    });
}

// ============================================
// Try to load from Google Drive
// ============================================
async function tryLoadFromDrive() {
    if (!gapiLoaded) return null;
    
    try {
        // Search for questions file
        const response = await gapi.client.drive.files.list({
            q: "name='questions-adaptive.json' and trashed=false",
            spaces: 'drive',
            fields: 'files(id, name)',
            pageSize: 1
        });
        
        const files = response.result.files;
        if (files && files.length > 0) {
            // Download file content
            const fileResponse = await gapi.client.drive.files.get({
                fileId: files[0].id,
                alt: 'media'
            });
            
            console.log('✅ Loaded questions from Google Drive');
            return JSON.parse(fileResponse.body);
        }
    } catch (error) {
        console.log('⚠️ Could not load from Drive, using local file');
    }
    
    return null;
}

// ============================================
// Enhanced loadQuestions - REPLACES your existing one
// ============================================
// Copy this ENTIRE function to REPLACE your existing loadQuestions() function
async function loadQuestions() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.remove('hidden');

    try {
        // STEP 1: Try Google Drive first (if available)
        const driveData = await tryLoadFromDrive();
        
        if (driveData) {
            // Got data from Google Drive!
            if (driveData.passages) {
                questionBank.passages = driveData.passages || [];
                questionBank.standalone_reading = driveData.standalone_reading || { easy: [], medium: [], hard: [] };
                questionBank.math = driveData.math || { easy: [], medium: [], hard: [] };
                questionBank.math_gridin = driveData.math_gridin || { easy: [], medium: [], hard: [] };
            }
            console.log('✅ Using questions from Google Drive');
        } else {
            // STEP 2: Fall back to your original logic (local files)
            
            let readingData = null;
            let mathData = null;
            
            try {
                const readingResponse = await fetch('questions-reading.json');
                if (readingResponse.ok) {
                    readingData = await readingResponse.json();
                }
            } catch (e) {}
            
            try {
                const mathResponse = await fetch('questions-math.json');
                if (mathResponse.ok) {
                    mathData = await mathResponse.json();
                }
            } catch (e) {}
            
            if (readingData && mathData) {
                questionBank.passages = readingData.passages || [];
                questionBank.standalone_reading = readingData.standalone_reading || { easy: [], medium: [], hard: [] };
                questionBank.math = mathData.math || { easy: [], medium: [], hard: [] };
            } else {
                // Load combined file
                const response = await fetch('questions-adaptive.json');
                if (!response.ok) throw new Error('No question files found');
                
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    convertArrayToQuestionBank(data);
                } else if (data.passages) {
                    questionBank.passages = data.passages || [];
                    questionBank.standalone_reading = data.standalone_reading || { easy: [], medium: [], hard: [] };
                    questionBank.math = data.math || { easy: [], medium: [], hard: [] };
                    questionBank.math_gridin = data.math_gridin || { easy: [], medium: [], hard: [] };
                } else {
                    questionBank.standalone_reading = data.reading || { easy: [], medium: [], hard: [] };
                    questionBank.math = data.math || { easy: [], medium: [], hard: [] };
                    questionBank.passages = [];
                }
            }
            
            console.log('✅ Using local question files');
        }
        
        // Add grid-in if missing
        if (!questionBank.math_gridin) {
            questionBank.math_gridin = { easy: [], medium: [], hard: [] };
        }
        
        // Rest of your original code continues...
        ensureMinimumQuestions();
        
    } catch (error) {
        console.error('Error loading questions:', error);
        loadingScreen.innerHTML = '<div style="color: var(--danger); padding: 2rem;">Failed to load questions. Please refresh the page.</div>';
        return;
    }
    
    loadingScreen.classList.add('hidden');
}

// ============================================
// Auto-initialize on page load
// ============================================
window.addEventListener('DOMContentLoaded', async () => {
    // Initialize Google Drive in background
    await initGoogleDrive();
    // Your existing code continues normally...
});
