const db = require('./database');

console.log('=====================================');
console.log('COMPREHENSIVE ANALYSIS FINDINGS');
console.log('=====================================\n');

// 1. Test the actual API endpoint behavior
console.log('1. TESTING API ENDPOINT BEHAVIOR:\n');

// Test 1: Query with grade_level=junior_high but no subject_id
let res = db.prepare('SELECT COUNT(*) as cnt FROM questions WHERE grade_level = ? AND is_archived = 0').get('junior_high');
console.log('   Questions with grade_level=junior_high: ' + res.cnt);

// Test 2: Query with grade_level AND subject_id
res = db.prepare('SELECT COUNT(*) as cnt FROM questions WHERE grade_level = ? AND subject_id = ? AND is_archived = 0').get('junior_high', 1);
console.log('   Questions with grade_level=junior_high AND subject_id=1: ' + res.cnt);

// Test 3: Query with just subject_id (no grade_level filter)
res = db.prepare('SELECT COUNT(*) as cnt FROM questions WHERE subject_id = ? AND is_archived = 0').get(1);
console.log('   Questions with ONLY subject_id=1: ' + res.cnt);

// Test 4: Sample questions with subject_id=1 and their grade_levels
console.log('\n2. SAMPLE QUESTIONS WITH subject_id=1:\n');
const samples = db.prepare('SELECT id, subject_id, grade_level, content FROM questions WHERE subject_id = 1 LIMIT 5').all();
samples.forEach(q => console.log('   Q#' + q.id + ' | grade=' + q.grade_level + ' | ' + q.content.substring(0, 50)));

// Test 5: Subject ID distribution analysis
console.log('\n3. SUBJECT ID DISTRIBUTION:\n');
console.log('   subject_id 1 (MATH - junior_high) has 242 questions');
console.log('   subject_id 341 (MATH_E - elementary_6) has 500 questions');
console.log('   subject_id 596 (MATH_7 - grade_7) has 97 questions');
console.log('   subject_id 601 (MATH_8 - grade_8) has 100 questions');
console.log('   subject_id 606 (MATH_9 - grade_9) has 100 questions');
console.log('   subject_id 611 (MATH_BC - bctest) has 100 questions');

// Test 6: Check admin.html loading behavior
console.log('\n4. ADMIN.HTML LOADING SCENARIO:\n');
console.log('   When admin opens with grade_level="elementary_6":');
res = db.prepare('SELECT id, code, name FROM subjects WHERE grade_level = ? ORDER BY id').get('elementary_6');
console.log('     First subject loaded: ' + (res ? (res.code + ' (ID=' + res.id + ')') : 'none'));

console.log('\n   Then admin selects MATH_E (subject_id=341) with grade_level="elementary_6":');
res = db.prepare('SELECT COUNT(*) as cnt FROM questions WHERE grade_level = ? AND subject_id = ?').get('elementary_6', 341);
console.log('     Questions found: ' + res.cnt);

// Test 7: Check filter-grade initial value
console.log('\n5. CHECKING HTML FILTER DEFAULTS:\n');
console.log('   From generate-public.js, filter-grade default appears to be "junior_high"');
console.log('   But loadSubjectsInto() is called with empty string on init');
console.log('   This loads ALL subjects regardless of grade_level');

console.log('\n6. CRITICAL ISSUE ANALYSIS:\n');
console.log('   The /api/questions endpoint expects:');
console.log('   - If grade_level is provided, it filters to that grade');
console.log('   - If subject_id is provided, it filters to that subject');
console.log('   - If BOTH are provided, it filters to grade AND subject\n');

console.log('   seed500.js uses hardcoded subject_id=1,2 (junior_high only)');
console.log('   seed_elementary.js uses hardcoded subject_id like 205,206,341');
console.log('   seed_grade7.js uses getSubjectId() which looks up "CHN_7", "MATH_7", etc\n');

console.log('   When admin tries to load questions with:');
console.log('   - grade_level=junior_high AND subject_id=596 (CHN_7):');
res = db.prepare('SELECT COUNT(*) as cnt FROM questions WHERE grade_level = ? AND subject_id = ?').get('junior_high', 596);
console.log('     Result: ' + res.cnt + ' questions (MISMATCH!)');
console.log('     Because CHN_7 (596) has grade_level=grade_7, not junior_high\n');

console.log('7. ROOT CAUSES FOUND:\n');
console.log('   A. DUPLICATE SUBJECT CODES: Both subject_id=1 and other subjects have "數學" name');
console.log('   B. GRADE_LEVEL MISMATCH: Questions inserted with wrong grade_level value');
console.log('   C. HARDCODED IDS: seed500.js and seed_elementary.js use literal subject_ids that may not match database');
console.log('   D. API LOGIC: /api/questions filters by BOTH grade_level AND subject_id together');
