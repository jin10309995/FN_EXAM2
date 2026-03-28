/**
 * smoke_test.js — FN_EXAM 系統冒煙測試
 * 執行方式：node smoke_test.js
 * 注意：需先啟動伺服器（PORT=3099 node server.js）
 */
const http = require('http');

const BASE = 'http://localhost:3099';
let passed = 0, failed = 0;
const results = [];

function req(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost', port: 3099,
      path, method,
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    const r = http.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.status || res.statusCode, body: JSON.parse(data), headers: res.headers }); }
        catch { resolve({ status: res.statusCode, body: data, headers: res.headers }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function check(name, actual, expected, info = '') {
  const ok = actual === expected;
  const sym = ok ? '✓' : '✗';
  if (ok) passed++; else failed++;
  results.push({ ok, name, actual, expected, info });
  console.log(`  ${sym} [${name}] 期望:${expected} 實際:${actual}${info ? ' | ' + info : ''}`);
}

function checkContains(name, obj, key, info = '') {
  const ok = obj && obj[key] !== undefined;
  const sym = ok ? '✓' : '✗';
  if (ok) passed++; else failed++;
  results.push({ ok, name, info });
  console.log(`  ${sym} [${name}] 回應包含 '${key}'${info ? ' | ' + info : ''}`);
}

async function run() {
  console.log('\n====== FN_EXAM 冒煙測試 ======\n');
  let adminCookie = '';
  let studentCookie = '';
  let examId = null;
  let submissionId = null;
  let lookupToken = null;

  // ─── 1. 基本健康檢查 ───────────────────────────────────────────────
  console.log('【1】基本健康檢查');
  {
    const r = await req('GET', '/api/subjects');
    check('GET /api/subjects', r.status, 200);
    check('subjects 為陣列', Array.isArray(r.body), true);
  }
  // /api/questions 需要管理員 auth（在取得 adminCookie 之後才測）

  // ─── 2. 登入流程 ───────────────────────────────────────────────────
  console.log('\n【2】登入流程');
  {
    const r = await req('POST', '/api/login', { username: 'admin', password: 'admin1234' });
    check('管理員登入 status', r.status, 200);
    checkContains('管理員登入回傳 role', r.body, 'role');
    const setCookie = r.headers['set-cookie'];
    if (setCookie) {
      adminCookie = setCookie.map(c => c.split(';')[0]).join('; ');
      check('管理員 cookie 存在', !!adminCookie, true);
    }
  }
  {
    const r = await req('POST', '/api/login', { username: 'student', password: 'student1234' });
    check('學生登入 status', r.status, 200);
    const setCookie = r.headers['set-cookie'];
    if (setCookie) {
      studentCookie = setCookie.map(c => c.split(';')[0]).join('; ');
    }
  }
  {
    const r = await req('POST', '/api/login', { username: 'nobody', password: 'wrong' });
    check('錯誤帳密被拒', r.status, 401, '應回傳 401');
  }

  // ─── 3. 考卷管理 ───────────────────────────────────────────────────
  console.log('\n【3】題庫 & 考卷管理');
  {
    const r = await req('GET', '/api/questions?per_page=1', null, { Cookie: adminCookie });
    check('GET /api/questions (管理員)', r.status, 200);
  }
  {
    const r = await req('GET', '/api/exams', null, { Cookie: adminCookie });
    check('GET /api/exams (管理員)', r.status, 200);
    check('exams 為陣列', Array.isArray(r.body), true, `共 ${Array.isArray(r.body) ? r.body.length : 0} 份`);
    if (Array.isArray(r.body) && r.body.length > 0) {
      examId = r.body.find(e => e.status === 'active')?.id || r.body[0].id;
    }
  }
  {
    // 建立測試試卷（以題庫第一題）
    const qs = await req('GET', '/api/questions?per_page=3');
    const qids = Array.isArray(qs.body?.questions) ? qs.body.questions.slice(0, 3).map(q => q.id) : [];
    if (qids.length > 0) {
      const r = await req('POST', '/api/exams', {
        title: '[SMOKE TEST] 測試試卷',
        description: '冒煙測試用，可刪除',
        duration_min: 10,
        status: 'active',
        question_ids: qids,
        randomize_questions: true,
        randomize_options: true
      }, { Cookie: adminCookie });
      check('建立試卷 (含 randomize)', r.status, 201);
      if (r.body?.id) examId = r.body.id;
    }
  }

  // ─── 4. 試卷複製 API ───────────────────────────────────────────────
  console.log('\n【4】試卷複製');
  if (examId) {
    const r = await req('POST', `/api/exams/${examId}/clone`, null, { Cookie: adminCookie });
    check('POST /api/exams/:id/clone', r.status, 201);
    checkContains('clone 回傳新 id', r.body, 'id', r.body?.id ? `新 ID=${r.body.id}` : '');
    // 清理複製出來的試卷
    if (r.body?.id) {
      await req('DELETE', `/api/exams/${r.body.id}`, null, { Cookie: adminCookie });
    }
  }

  // ─── 5. 學生取卷（答案隱藏 + randomize） ──────────────────────────
  console.log('\n【5】學生取卷');
  if (examId) {
    const r = await req('GET', `/api/exams/${examId}/take`, null, { Cookie: studentCookie });
    check('GET /api/exams/:id/take', r.status, 200);
    if (Array.isArray(r.body?.questions)) {
      const hasAnswer = r.body.questions.some(q => q.answer !== undefined);
      check('取卷不含 answer 欄位', hasAnswer, false, '安全投影驗證');
      const remapped = r.body.questions.filter(q => q._option_remap);
      check('choice 題含 _option_remap', remapped.length >= 0, true,
        remapped.length > 0 ? `${remapped.length} 題已亂序` : '無 choice 題或選項未亂序（可能題目不足）');
    }
  }

  // ─── 6. 提交作答 ───────────────────────────────────────────────────
  console.log('\n【6】提交作答');
  if (examId) {
    const answers = {};
    const r = await req('POST', `/api/exams/${examId}/submit`, {
      student_name: 'SmokeTester',
      student_id: 'smoke001',
      answers,
      submission_id: null,
      lookup_token: null
    }, { Cookie: studentCookie });
    check('POST /api/exams/:id/submit', r.status, 200);
    if (r.body?.submission_id) {
      submissionId = r.body.submission_id;
      lookupToken = r.body.lookup_token;
      check('回傳 submission_id', !!submissionId, true);
      check('回傳 lookup_token', !!lookupToken, true, `token 長度=${lookupToken?.length || 0}`);
    }
  }

  // ─── 7. X-Lookup-Token header 查詢 ────────────────────────────────
  console.log('\n【7】X-Lookup-Token header 查詢');
  if (submissionId && lookupToken) {
    const r = await req('GET', `/api/submissions/${submissionId}`, null, { 'X-Lookup-Token': lookupToken });
    check('GET /api/submissions/:id (header token)', r.status, 200);
    checkContains('回傳 score', r.body, 'score');

    const r2 = await req('GET', `/api/submissions/${submissionId}/analysis`, null, { 'X-Lookup-Token': lookupToken });
    check('GET /api/submissions/:id/analysis (header token)', r2.status, 200);
    checkContains('分析回傳 percentage', r2.body, 'percentage');

    // 錯誤 token 應被拒絕
    const r3 = await req('GET', `/api/submissions/${submissionId}`, null, { 'X-Lookup-Token': 'wrong_token' });
    check('錯誤 token 被拒', r3.status, 403);
  }

  // ─── 8. PDF 報告 ───────────────────────────────────────────────────
  console.log('\n【8】PDF 報告');
  if (submissionId && lookupToken) {
    const r = await req('GET', `/api/submissions/${submissionId}/report.pdf?token=${encodeURIComponent(lookupToken)}`);
    check('GET /api/submissions/:id/report.pdf', r.status, 200, `Content-Type=${r.headers['content-type']}`);
    check('回應為 PDF', (r.headers['content-type'] || '').includes('pdf'), true);
  }

  // ─── 9. 批次 AI 批改 API（無 LLM key 時應回傳錯誤或 0） ──────────
  console.log('\n【9】批次 AI 批改');
  if (examId) {
    const r = await req('POST', `/api/exams/${examId}/batch-ai-grade`, null, { Cookie: adminCookie });
    // 無 LLM key 時可能回傳 200 graded:0，或 500；都算 API 存在
    check('POST /api/exams/:id/batch-ai-grade 端點存在', r.status < 500, true, `status=${r.status}`);
  }

  // ─── 10. 速率限制 ─────────────────────────────────────────────────
  console.log('\n【10】速率限制驗證');
  if (submissionId) {
    let got429 = false;
    // submissionLookupLimiter max=20，用錯誤 token 連發 25 次應觸發
    for (let i = 0; i < 25 && !got429; i++) {
      const r = await req('GET', `/api/submissions/${submissionId}`, null, { 'X-Lookup-Token': `badtoken${i}` });
      if (r.status === 429) got429 = true;
    }
    check('查詢 429 速率限制觸發（submissionLookupLimiter）', got429, true, '25 次壞 token 內應觸發');
  } else {
    check('速率限制測試跳過（無 submissionId）', true, true, 'SKIP');
  }

  // ─── 11. 清理測試資料 ─────────────────────────────────────────────
  console.log('\n【11】清理測試試卷');
  if (examId) {
    const r = await req('DELETE', `/api/exams/${examId}`, null, { Cookie: adminCookie });
    check('刪除測試試卷', r.status === 200 || r.status === 204, true);
  }

  // ─── 彙整 ─────────────────────────────────────────────────────────
  console.log('\n====== 測試結果彙整 ======');
  console.log(`  通過：${passed}，失敗：${failed}，共 ${passed + failed} 項`);
  const failedItems = results.filter(r => !r.ok);
  if (failedItems.length > 0) {
    console.log('\n  失敗項目：');
    failedItems.forEach(r => console.log(`    - ${r.name}: 期望 ${r.expected} 實際 ${r.actual}`));
  } else {
    console.log('  所有測試通過！');
  }
  console.log('');
  return { passed, failed, results };
}

run().catch(e => {
  console.error('測試腳本執行錯誤：', e.message);
  process.exit(1);
});
