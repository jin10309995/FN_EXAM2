const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const adminUsername = process.env.SMOKE_ADMIN_USERNAME || process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin1234';

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

  const loginRes = await check('管理員登入', '/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: adminUsername, password: adminPassword })
  });
  const cookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];
  const authHeaders = cookie ? { Cookie: cookie } : {};
  await check('管理員驗證', '/api/admin/session', { method: 'POST', headers: authHeaders });
  await check('管理端考卷列表', '/api/exams', { headers: authHeaders });
  await check('題庫匯出', '/api/export/questions.csv', { headers: authHeaders });

  console.log('Smoke test 通過');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
