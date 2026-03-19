const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, 'exam.db');
const backupDir = path.join(root, 'backups');

if (!fs.existsSync(source)) {
  console.error('找不到 exam.db');
  process.exit(1);
}

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(backupDir, `exam-${stamp}.db`);

fs.copyFileSync(source, target);
console.log(`資料庫備份完成：${target}`);
