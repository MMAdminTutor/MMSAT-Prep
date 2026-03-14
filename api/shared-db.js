// Shared database that persists across all serverless function invocations
// Uses Node.js module cache to share state

if (!global.__SAT_TEST_DB__) {
  console.log('🔄 Initializing shared test database');
  global.__SAT_TEST_DB__ = {
    tests: {},
    initialized: Date.now(),
    saveCount: 0,
    getCount: 0
  };
}

module.exports = {
  save: (testId, testData) => {
    global.__SAT_TEST_DB__.tests[testId] = testData;
    global.__SAT_TEST_DB__.saveCount++;
    console.log(`💾 Saved test ${testId}. Total: ${Object.keys(global.__SAT_TEST_DB__.tests).length}`);
    return true;
  },
  
  get: (testId) => {
    global.__SAT_TEST_DB__.getCount++;
    return global.__SAT_TEST_DB__.tests[testId] || null;
  },
  
  getAll: () => {
    global.__SAT_TEST_DB__.getCount++;
    return Object.values(global.__SAT_TEST_DB__.tests);
  },
  
  getByStudentCode: (studentCode) => {
    global.__SAT_TEST_DB__.getCount++;
    return Object.values(global.__SAT_TEST_DB__.tests)
      .filter(test => test.student_code === studentCode);
  },
  
  getByTutorId: (tutorId) => {
    global.__SAT_TEST_DB__.getCount++;
    return Object.values(global.__SAT_TEST_DB__.tests)
      .filter(test => test.tutor_id === tutorId);
  },
  
  stats: () => {
    return {
      totalTests: Object.keys(global.__SAT_TEST_DB__.tests).length,
      saves: global.__SAT_TEST_DB__.saveCount,
      gets: global.__SAT_TEST_DB__.getCount,
      uptime: Math.round((Date.now() - global.__SAT_TEST_DB__.initialized) / 1000)
    };
  }
};
