// =====================================================
// BACKEND INTEGRATION CODE TO ADD TO sat-test-v2.html
// =====================================================
// Add this code to your sat-test-v2.html file

// 1. ADD THIS AT THE TOP OF THE <script> SECTION (around line 2215):
const API_URL = 'http://localhost:3000/api';

// 2. ADD THIS FUNCTION AFTER THE showResults() FUNCTION:
async function saveTestToBackend(scores) {
    const studentCode = localStorage.getItem('studentCode');
    const studentName = localStorage.getItem('userName');
    const tutorId = localStorage.getItem('tutorId');
    
    if (!studentCode || !studentName || !tutorId) {
        console.log('⚠️ Missing student info - not saving to backend');
        return;
    }
    
    try {
        let correctCount = 0;
        let incorrectCount = 0;
        let skippedCount = 0;
        
        Object.values(testState.modules).forEach(module => {
            if (module && module.answers) {
                module.answers.forEach((answer, index) => {
                    const question = module.questions[index];
                    if (answer === null || answer === '') {
                        skippedCount++;
                    } else {
                        const isGridIn = question.questionType === 'grid-in' || !question.choices;
                        const isCorrect = isGridIn ? 
                            checkGridInAnswer(answer, question.correctAnswer) :
                            (question.correct === answer);
                        
                        if (isCorrect) {
                            correctCount++;
                        } else {
                            incorrectCount++;
                        }
                    }
                });
            }
        });
        
        const testData = {
            studentCode: studentCode,
            studentName: studentName,
            tutorId: tutorId,
            testType: testState.testType,
            totalScore: scores.total || 0,
            readingScore: scores.reading || 0,
            mathScore: scores.math || 0,
            testData: {
                timestamp: new Date().toISOString(),
                studentCode: studentCode,
                studentName: studentName,
                testType: testState.testType,
                totalScore: scores.total || 0,
                readingScore: scores.reading || 0,
                mathScore: scores.math || 0,
                correctCount: correctCount,
                incorrectCount: incorrectCount,
                skippedCount: skippedCount,
                reading_module1: testState.modules.reading_module1 || {},
                reading_module2: testState.modules.reading_module2 || {},
                math_module1: testState.modules.math_module1 || {},
                math_module2: testState.modules.math_module2 || {}
            }
        };
        
        console.log('📤 Sending test to backend...', {
            student: studentName,
            score: testData.totalScore,
            correct: correctCount
        });
        
        const response = await fetch(`${API_URL}/tests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Test saved to backend successfully!');
            console.log('📊 Test ID:', result.testId);
        } else {
            console.error('❌ Backend save failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Error saving to backend:', error);
        console.log('💾 Test saved locally only');
    }
}

// 3. IN THE showResults() FUNCTION, ADD THIS LINE AFTER saveTestHistory(scores):
//    saveTestHistory(scores);
//    saveTestToBackend(scores);  // <-- ADD THIS LINE
