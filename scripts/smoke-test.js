const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const adminKey = process.env.ADMIN_API_KEY || '';

async function check(name, url, opts = {}, expect = 200) {
  const res = await fetch(baseUrl + url, opts);
  if (res.status !== expect) {
    const text = await res.text();
    throw new Error(`${name} 失敗: ${res.status} ${text}`);
  }
  return res;
}

async function main() {
  await check('首頁', '/');
  await check('公開考試列表', '/api/public/exams');
  await check('科目列表', '/api/subjects');

  if (adminKey) {
    const headers = { 'x-api-key': adminKey };
    await check('管理員驗證', '/api/admin/session', { method: 'POST', headers });
    await check('管理端考卷列表', '/api/exams', { headers });
    await check('題庫匯出', '/api/export/questions.csv', { headers });
  }

  console.log('Smoke test 通過');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
