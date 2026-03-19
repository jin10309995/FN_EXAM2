const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');
const templateDir = path.join(rootDir, 'templates', 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('[OK] 建立 public/ 資料夾');
}

if (!fs.existsSync(templateDir)) {
  console.log('[INFO] 未找到 templates/public，已保留現有 public/ 內容，不再覆寫舊模板。');
  console.log('[INFO] 若要正式重建靜態頁面，請先將新版 HTML 放到 templates/public。');
  process.exit(0);
}

const files = fs.readdirSync(templateDir).filter((name) => name.endsWith('.html'));
for (const name of files) {
  const source = path.join(templateDir, name);
  const target = path.join(publicDir, name);
  fs.copyFileSync(source, target);
  console.log('[OK] 產生', target);
}

console.log('\n所有前端檔案已由 templates/public 同步到 public/！');
