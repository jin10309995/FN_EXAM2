const db = require('./database');
const name = '\u6578\u5B78'; // 數學
const r = db.prepare("UPDATE subjects SET name = ? WHERE code = 'MATH_E'").run(name);
const row = db.prepare("SELECT id, name, code, grade_level FROM subjects WHERE code = 'MATH_E'").get();
console.log('changes:', r.changes);
console.log('result:', JSON.stringify(row));
