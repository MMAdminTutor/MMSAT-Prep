// DIAGNOSTIC: Run this to check your setup
// Save as check-setup.js in backend folder and run: node check-setup.js

const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING YOUR SETUP...\n');

// Check 1: database.js exists
const dbPath = path.join(__dirname, 'database.js');
console.log('1. Checking database.js...');
if (fs.existsSync(dbPath)) {
    console.log('   ✅ database.js exists');
    console.log('   📂 Path:', dbPath);
} else {
    console.log('   ❌ database.js NOT FOUND!');
    console.log('   📂 Expected at:', dbPath);
}

// Check 2: Try to load database module
console.log('\n2. Trying to load database module...');
try {
    const db = require('./database');
    console.log('   ✅ database.js loaded');
    console.log('   📦 Exported:', Object.keys(db));
    
    // Check 3: Check if functions exist
    console.log('\n3. Checking exported functions...');
    if (typeof db.saveTest === 'function') {
        console.log('   ✅ saveTest is a function');
    } else {
        console.log('   ❌ saveTest is NOT a function');
        console.log('   ⚠️  Type:', typeof db.saveTest);
    }
    
    if (typeof db.getStudentTests === 'function') {
        console.log('   ✅ getStudentTests is a function');
    } else {
        console.log('   ❌ getStudentTests is NOT a function');
    }
    
    if (typeof db.getTutorTests === 'function') {
        console.log('   ✅ getTutorTests is a function');
    } else {
        console.log('   ❌ getTutorTests is NOT a function');
    }
} catch (error) {
    console.log('   ❌ Failed to load database.js');
    console.log('   Error:', error.message);
}

// Check 4: sat-tests-db.json exists
console.log('\n4. Checking database file...');
const dbFilePath = path.join(__dirname, 'sat-tests-db.json');
if (fs.existsSync(dbFilePath)) {
    console.log('   ✅ sat-tests-db.json exists');
    try {
        const data = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
        console.log('   📊 Tests in database:', Object.keys(data.tests || {}).length);
    } catch (e) {
        console.log('   ⚠️  File exists but cannot read:', e.message);
    }
} else {
    console.log('   ⚠️  sat-tests-db.json does not exist (will be created)');
}

console.log('\n' + '='.repeat(50));
console.log('DIAGNOSIS COMPLETE');
console.log('='.repeat(50));
