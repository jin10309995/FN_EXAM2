const db = require('./database');
console.log('=== ALL SUBJECTS WITH IDS ===');
const subjects = db.prepare('SELECT id, code, name, grade_level FROM subjects ORDER BY id').all();
subjects.forEach(s => console.log(s.id + ' | ' + s.code + ' | ' + s.name + ' | ' + s.grade_level));

console.log('\n=== TEST: Load questions with filters ===');
// Test filtering like the admin.html would
const res1 = db.prepare('SELECT COUNT(*) as cnt FROM questions WHERE grade_level = ?').get('elementary_6');
console.log('elementary_6 questions: ' + res1.cnt);

const res2 = db.prepare('SELECT COUNT(*) as cnt FROM questions WHERE grade_level = ? AND subject_id = ?').get('elementary_6', 341);
console.log('elementary_6 + subject_id=341: ' + res2.cnt);

const res3 = db.prepare('SELECT COUNT(*) as cnt FROM questions WHERE grade_level = ? AND subject_id = ?').get('junior_high', 1);
console.log('junior_high + subject_id=1: ' + res3.cnt);

console.log('\n=== CHECKING FOR ORPHANED SUBJECT IDS ===');
const orphan = db.prepare('SELECT DISTINCT subject_id FROM questions WHERE subject_id NOT IN (SELECT id FROM subjects)').all();
if (orphan.length) {
  console.log('Found orphaned subject_ids in questions:');
  orphan.forEach(o => console.log('  subject_id ' + o.subject_id));
} else {
  console.log('No orphaned subject_ids found');
}

console.log('\n=== CHECKING SUBJECT NAME CONSISTENCY ===');
const subjectNames = db.prepare('SELECT DISTINCT code, name FROM subjects ORDER BY code').all();
const grouped = {};
subjectNames.forEach(s => {
  if (!grouped[s.code]) grouped[s.code] = [];
  grouped[s.code].push(s.name);
});
Object.keys(grouped).forEach(code => {
  if (grouped[code].length > 1) {
    console.log('WARNING: Code ' + code + ' has multiple names: ' + grouped[code].join(', '));
  }
});
