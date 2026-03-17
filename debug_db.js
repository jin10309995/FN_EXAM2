const db = require('./database');
console.log('=== SUBJECTS ===');
const subjects = db.prepare('SELECT id, code, name, grade_level FROM subjects ORDER BY id').all();
subjects.slice(0, 35).forEach(s => console.log(s.id + ' | ' + s.code + ' | ' + s.name + ' | ' + s.grade_level));

console.log('\n=== QUESTION COUNTS BY GRADE LEVEL ===');
const counts = db.prepare('SELECT grade_level, COUNT(*) as cnt FROM questions GROUP BY grade_level').all();
counts.forEach(c => console.log(c.grade_level + ': ' + c.cnt));

console.log('\n=== QUESTION COUNTS BY SUBJECT_ID ===');
const qCounts = db.prepare('SELECT subject_id, COUNT(*) as cnt FROM questions GROUP BY subject_id ORDER BY subject_id').all();
qCounts.forEach(c => console.log('subject_id ' + c.subject_id + ': ' + c.cnt));
