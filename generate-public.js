/**
 * 產生 public 資料夾與前端 HTML 檔案
 * 執行方式: node generate-public.js
 */
const fs = require('fs');
const path = require('path');

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
  console.log('✅ 建立 public/ 資料夾');
}

// ── index.html (首頁) ──────────────────────────────────────────────────────
const indexHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>數理資優班考題系統</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>body{font-family:'Noto Sans TC',sans-serif;}</style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
<div class="max-w-4xl mx-auto px-4 py-16">
  <div class="text-center mb-12">
    <div class="text-6xl mb-4">🎓</div>
    <h1 class="text-4xl font-bold text-indigo-800 mb-2">數理資優班考題系統</h1>
    <p class="text-lg text-gray-600">升國中數理資優班甄試平台</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <a href="/exam-list.html" class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer block text-center">
      <div class="text-5xl mb-4">📝</div>
      <h2 class="text-xl font-bold text-gray-800 mb-2">參加考試</h2>
      <p class="text-gray-500 text-sm">選擇試卷，開始作答</p>
    </a>
    <a href="/admin.html" class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer block text-center">
      <div class="text-5xl mb-4">⚙️</div>
      <h2 class="text-xl font-bold text-gray-800 mb-2">後台管理</h2>
      <p class="text-gray-500 text-sm">管理題庫與試卷</p>
    </a>
    <a href="/results.html" class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer block text-center">
      <div class="text-5xl mb-4">📊</div>
      <h2 class="text-xl font-bold text-gray-800 mb-2">成績查詢</h2>
      <p class="text-gray-500 text-sm">查詢考試結果與分析</p>
    </a>
  </div>
</div>
</body>
</html>`;

// ── exam-list.html ─────────────────────────────────────────────────────────
const examListHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>選擇考試 - 數理資優班考題系統</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{font-family:'Noto Sans TC',sans-serif;}</style>
</head>
<body class="bg-gray-50 min-h-screen">
<header class="bg-indigo-700 text-white py-4 px-6 shadow">
  <div class="max-w-4xl mx-auto flex items-center gap-3">
    <a href="/" class="text-indigo-200 hover:text-white">🏠</a>
    <span class="text-lg font-bold">選擇考試</span>
  </div>
</header>
<main class="max-w-4xl mx-auto px-4 py-8">
  <div id="exam-list" class="grid gap-4"></div>
</main>
<script>
async function loadExams() {
  const res = await fetch('/api/exams');
  const exams = await res.json();
  const active = exams.filter(e => e.status === 'active');
  const container = document.getElementById('exam-list');
  if (!active.length) {
    container.innerHTML = '<p class="text-center text-gray-500 py-16">目前沒有開放中的考試</p>';
    return;
  }
  container.innerHTML = active.map(e => \`
    <div class="bg-white rounded-xl shadow p-6 flex justify-between items-center">
      <div>
        <h3 class="text-lg font-bold text-gray-800">\${e.title}</h3>
        <p class="text-sm text-gray-500 mt-1">\${e.description || ''}</p>
        <div class="flex gap-4 mt-2 text-sm text-gray-600">
          <span>📋 \${e.question_count} 題</span>
          <span>⏱ \${e.duration_min} 分鐘</span>
          <span>💯 滿分 \${e.total_score} 分</span>
        </div>
      </div>
      <a href="/exam.html?id=\${e.id}" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">開始作答</a>
    </div>
  \`).join('');
}
loadExams();
</script>
</body>
</html>`;

// ── exam.html ──────────────────────────────────────────────────────────────
const examHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>考試作答 - 數理資優班考題系統</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script" async></script>
<style>body{font-family:'Noto Sans TC',sans-serif;}</style>
</head>
<body class="bg-gray-50 min-h-screen">

<!-- Registration Modal -->
<div id="reg-modal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div class="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">填寫考生資料</h2>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">姓名 <span class="text-red-500">*</span></label>
        <input id="student-name" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="請輸入真實姓名">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">座號 / 學號</label>
        <input id="student-id" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="選填">
      </div>
    </div>
    <button onclick="startExam()" class="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium text-lg transition-colors">開始考試</button>
  </div>
</div>

<!-- Exam Header -->
<header class="bg-indigo-700 text-white py-3 px-6 shadow sticky top-0 z-40">
  <div class="max-w-4xl mx-auto flex justify-between items-center">
    <div>
      <span class="font-bold" id="exam-title">載入中...</span>
      <span class="text-indigo-200 text-sm ml-3" id="progress-text"></span>
    </div>
    <div class="flex items-center gap-4">
      <div id="timer" class="bg-indigo-800 px-4 py-1 rounded-full font-mono text-lg font-bold">--:--</div>
      <button onclick="confirmSubmit()" class="bg-green-500 hover:bg-green-600 px-4 py-1 rounded-lg font-medium transition-colors">提交作答</button>
    </div>
  </div>
</header>

<main class="max-w-4xl mx-auto px-4 py-6" id="questions-container">
  <div class="text-center py-16 text-gray-500">載入中...</div>
</main>

<div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-30">
  <div class="max-w-4xl mx-auto flex gap-2 flex-wrap justify-center" id="question-nav"></div>
</div>

<script>
const params = new URLSearchParams(location.search);
const examId = params.get('id');
let examData = null;
let answers = {};
let timerInterval = null;
let timeLeft = 0;
let studentName = '';
let studentId = '';

async function loadExam() {
  const res = await fetch(\`/api/exams/\${examId}/take\`);
  if (!res.ok) { document.getElementById('questions-container').innerHTML = '<p class="text-center py-16 text-red-500">試卷不存在或尚未開放</p>'; document.getElementById('reg-modal').remove(); return; }
  examData = await res.json();
  document.getElementById('exam-title').textContent = examData.title;
  timeLeft = examData.duration_min * 60;
}

function startExam() {
  studentName = document.getElementById('student-name').value.trim();
  if (!studentName) { alert('請填寫姓名'); return; }
  studentId = document.getElementById('student-id').value.trim();
  document.getElementById('reg-modal').remove();
  renderQuestions();
  startTimer();
}

function renderQuestions() {
  const container = document.getElementById('questions-container');
  const nav = document.getElementById('question-nav');
  container.innerHTML = examData.questions.map((q, i) => \`
    <div id="q-\${i}" class="bg-white rounded-xl shadow p-6 mb-4">
      <div class="flex justify-between items-start mb-3">
        <span class="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">第 \${i+1} 題 · \${q.subject_name} · \${q.score}分</span>
        <span class="text-xs text-gray-400">\${'★'.repeat(q.difficulty || 1)}\${'☆'.repeat(5-(q.difficulty||1))}</span>
      </div>
      <p class="text-gray-800 mb-4 leading-relaxed">\${q.content}</p>
      \${q.type === 'choice' ? renderChoices(q, i) : renderFill(q, i)}
    </div>
  \`).join('') + '<div class="h-24"></div>';

  nav.innerHTML = examData.questions.map((q,i) => \`
    <button id="nav-\${i}" onclick="scrollToQ(\${i})" class="w-8 h-8 rounded text-sm font-medium border-2 border-gray-300 text-gray-600 hover:border-indigo-400">\${i+1}</button>
  \`).join('');
  updateProgress();
}

function renderChoices(q, idx) {
  return ['A','B','C','D'].map(opt => {
    const val = q['option_' + opt.toLowerCase()];
    if (!val) return '';
    return \`<label class="flex items-start gap-3 p-3 rounded-lg border-2 border-transparent hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer mb-2 transition-all">
      <input type="radio" name="q-\${idx}" value="\${opt}" onchange="setAnswer(\${idx}, '\${opt}')" class="mt-0.5 accent-indigo-600">
      <span class="font-medium text-indigo-700 min-w-4">\${opt}.</span>
      <span class="text-gray-700">\${val}</span>
    </label>\`;
  }).join('');
}

function renderFill(q, idx) {
  return \`<input type="text" placeholder="請填寫答案" onchange="setAnswer(\${idx}, this.value)"
    class="w-full border-2 border-gray-300 focus:border-indigo-500 rounded-lg px-3 py-2 outline-none transition-colors">\`;
}

function setAnswer(idx, val) {
  const qid = examData.questions[idx].id;
  answers[qid] = val;
  const btn = document.getElementById(\`nav-\${idx}\`);
  btn.classList.remove('border-gray-300','text-gray-600');
  btn.classList.add('border-green-400','bg-green-50','text-green-700');
  updateProgress();
}

function scrollToQ(idx) { document.getElementById(\`q-\${idx}\`).scrollIntoView({ behavior: 'smooth', block: 'center' }); }

function updateProgress() {
  const answered = Object.keys(answers).length;
  document.getElementById('progress-text').textContent = \`已作答 \${answered}/\${examData.questions.length} 題\`;
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    const m = Math.floor(timeLeft / 60).toString().padStart(2,'0');
    const s = (timeLeft % 60).toString().padStart(2,'0');
    const el = document.getElementById('timer');
    el.textContent = \`\${m}:\${s}\`;
    if (timeLeft <= 300) el.classList.add('text-yellow-300');
    if (timeLeft <= 60)  el.classList.replace('text-yellow-300','text-red-300');
    if (timeLeft <= 0)   { clearInterval(timerInterval); submitAnswers(); }
  }, 1000);
}

function confirmSubmit() {
  if (confirm('確定要提交作答嗎？')) submitAnswers();
}

async function submitAnswers() {
  clearInterval(timerInterval);
  const res = await fetch(\`/api/exams/\${examId}/submit\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_name: studentName, student_id: studentId, answers })
  });
  const data = await res.json();
  if (data.submission_id) {
    location.href = \`/result.html?id=\${data.submission_id}\`;
  } else {
    alert('提交失敗：' + (data.error || '未知錯誤'));
  }
}

loadExam();
</script>
</body>
</html>`;

// ── result.html ────────────────────────────────────────────────────────────
const resultHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>考試結果 - 數理資優班考題系統</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{font-family:'Noto Sans TC',sans-serif;}</style>
</head>
<body class="bg-gray-50 min-h-screen">
<header class="bg-indigo-700 text-white py-4 px-6 shadow">
  <div class="max-w-4xl mx-auto flex items-center gap-3">
    <a href="/" class="text-indigo-200 hover:text-white">🏠</a>
    <span class="text-lg font-bold">考試結果</span>
  </div>
</header>
<main class="max-w-4xl mx-auto px-4 py-8" id="result-container">
  <div class="text-center py-16 text-gray-500">載入中...</div>
</main>
<script>
const id = new URLSearchParams(location.search).get('id');
async function loadResult() {
  const res = await fetch('/api/submissions/' + id);
  const data = await res.json();
  const pct = Math.round(data.score / data.total_score * 100);
  const color = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';
  document.getElementById('result-container').innerHTML = \`
    <div class="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
      <h2 class="text-2xl font-bold text-gray-800 mb-2">\${data.student_name} 的成績</h2>
      <div class="text-7xl font-bold \${color} my-6">\${pct}%</div>
      <p class="text-gray-500">\${data.score} / \${data.total_score} 分 &nbsp;·&nbsp; 作答時間: \${data.submitted_at}</p>
    </div>
    <div class="space-y-4">
      \${data.details.map((d,i) => \`
        <div class="bg-white rounded-xl shadow p-5 border-l-4 \${d.is_correct ? 'border-green-400' : 'border-red-400'}">
          <div class="flex justify-between mb-2">
            <span class="font-medium text-gray-700">第 \${i+1} 題</span>
            <span class="\${d.is_correct ? 'text-green-600' : 'text-red-600'} font-bold">
              \${d.is_correct ? '✓ 答對 +'+d.score_earned+'分' : '✗ 答錯'}
            </span>
          </div>
          <p class="text-gray-800 mb-3">\${d.content}</p>
          <div class="text-sm space-y-1">
            <p>你的答案：<span class="\${d.is_correct ? 'text-green-600' : 'text-red-600'} font-medium">\${d.given_answer || '（未作答）'}</span></p>
            \${!d.is_correct ? \`<p>正確答案：<span class="text-green-600 font-medium">\${d.correct_answer}</span></p>\` : ''}
            \${d.explanation ? \`<p class="text-gray-500 mt-2 bg-gray-50 p-2 rounded">💡 \${d.explanation}</p>\` : ''}
          </div>
        </div>
      \`).join('')}
    </div>
    <div class="mt-6 text-center">
      <a href="/exam-list.html" class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">返回考試列表</a>
    </div>
  \`;
}
loadResult();
</script>
</body>
</html>`;

// ── admin.html ─────────────────────────────────────────────────────────────
const adminHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>後台管理 - 數理資優班考題系統</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
body{font-family:'Noto Sans TC',sans-serif;}
.tab-btn.active{background:#4338ca;color:#fff;}
.tab-btn{transition:all .2s;}
</style>
</head>
<body class="bg-gray-100 min-h-screen">
<header class="bg-indigo-700 text-white py-4 px-6 shadow sticky top-0 z-50">
  <div class="max-w-7xl mx-auto flex items-center gap-4">
    <a href="/" class="text-indigo-200 hover:text-white">🏠</a>
    <span class="text-lg font-bold">後台管理</span>
    <div class="ml-auto flex gap-2">
      <button class="tab-btn active px-4 py-1.5 rounded-lg text-sm font-medium border border-white/30" onclick="switchTab('questions',this)">題庫管理</button>
      <button class="tab-btn px-4 py-1.5 rounded-lg text-sm font-medium border border-white/30 text-indigo-200" onclick="switchTab('exams',this)">試卷管理</button>
      <button class="tab-btn px-4 py-1.5 rounded-lg text-sm font-medium border border-white/30 text-indigo-200" onclick="switchTab('stats',this)">成績統計</button>
    </div>
  </div>
</header>

<main class="max-w-7xl mx-auto px-4 py-6">
  <!-- 題庫管理 -->
  <div id="tab-questions">
    <div class="flex gap-3 mb-4 flex-wrap">
      <button onclick="openQuestionModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">+ 新增題目</button>
      <select id="filter-subject" onchange="loadQuestions()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
        <option value="">全部科目</option>
      </select>
      <select id="filter-type" onchange="loadQuestions()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
        <option value="">全部題型</option>
        <option value="choice">選擇題</option>
        <option value="fill">填充題</option>
        <option value="calculation">計算題</option>
      </select>
      <select id="filter-diff" onchange="loadQuestions()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
        <option value="">全部難度</option>
        <option value="1">★ 入門</option>
        <option value="2">★★ 基礎</option>
        <option value="3">★★★ 中級</option>
        <option value="4">★★★★ 進階</option>
        <option value="5">★★★★★ 競賽</option>
      </select>
      <input id="filter-search" type="text" placeholder="搜尋題目..." onkeyup="loadQuestions()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48">
    </div>
    <div id="questions-table" class="bg-white rounded-xl shadow overflow-hidden">
      <div class="text-center py-8 text-gray-400">載入中...</div>
    </div>
    <div id="pagination" class="mt-4 flex justify-center gap-2"></div>
  </div>

  <!-- 試卷管理 -->
  <div id="tab-exams" class="hidden">
    <div class="flex gap-3 mb-4">
      <button onclick="openExamModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">+ 新增試卷</button>
    </div>
    <div id="exams-list" class="space-y-3">
      <div class="text-center py-8 text-gray-400">載入中...</div>
    </div>
  </div>

  <!-- 成績統計 -->
  <div id="tab-stats" class="hidden">
    <div class="mb-4">
      <select id="stats-exam-select" onchange="loadStats()" class="border border-gray-300 rounded-lg px-3 py-2">
        <option value="">選擇試卷</option>
      </select>
    </div>
    <div id="stats-container"></div>
  </div>
</main>

<!-- 題目新增/編輯 Modal -->
<div id="question-modal" class="fixed inset-0 bg-black/50 z-50 hidden overflow-y-auto">
  <div class="min-h-screen flex items-start justify-center py-8 px-4">
    <div class="bg-white rounded-2xl p-6 w-full max-w-2xl">
      <h3 class="text-xl font-bold text-gray-800 mb-5" id="modal-title">新增題目</h3>
      <form id="question-form" class="space-y-4">
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">科目 *</label>
            <select id="q-subject" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required></select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">題型 *</label>
            <select id="q-type" onchange="toggleOptions()" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
              <option value="choice">選擇題</option>
              <option value="fill">填充題</option>
              <option value="calculation">計算題</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">難度 *</label>
            <select id="q-difficulty" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
              <option value="1">★ 入門</option>
              <option value="2">★★ 基礎</option>
              <option value="3">★★★ 中級</option>
              <option value="4">★★★★ 進階</option>
              <option value="5">★★★★★ 競賽</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">題目內容 *</label>
          <textarea id="q-content" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" placeholder="支援 LaTeX 數學式，如：\$x^2 + y^2 = z^2\$" required></textarea>
        </div>
        <div id="choice-options">
          <label class="block text-sm font-medium text-gray-700 mb-2">選項（選擇題）</label>
          <div class="space-y-2">
            <div class="flex gap-2 items-center"><span class="w-6 text-sm font-medium text-indigo-600">A.</span><input id="q-opt-a" type="text" class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm" placeholder="選項 A"></div>
            <div class="flex gap-2 items-center"><span class="w-6 text-sm font-medium text-indigo-600">B.</span><input id="q-opt-b" type="text" class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm" placeholder="選項 B"></div>
            <div class="flex gap-2 items-center"><span class="w-6 text-sm font-medium text-indigo-600">C.</span><input id="q-opt-c" type="text" class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm" placeholder="選項 C"></div>
            <div class="flex gap-2 items-center"><span class="w-6 text-sm font-medium text-indigo-600">D.</span><input id="q-opt-d" type="text" class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm" placeholder="選項 D"></div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">正確答案 *</label>
            <input id="q-answer" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="選擇題填 A/B/C/D，填充題填答案" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">標籤</label>
            <input id="q-tags" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="以逗號分隔，如：代數,方程式">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">解析</label>
          <textarea id="q-explanation" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" placeholder="詳細解題說明（選填）"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">來源</label>
          <input id="q-source" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="如：2023年台北市資優班考題">
        </div>
      </form>
      <div class="flex gap-3 mt-6 justify-end">
        <button onclick="closeModal('question-modal')" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
        <button onclick="saveQuestion()" class="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">儲存</button>
      </div>
    </div>
  </div>
</div>

<!-- 試卷 Modal -->
<div id="exam-modal" class="fixed inset-0 bg-black/50 z-50 hidden overflow-y-auto">
  <div class="min-h-screen flex items-start justify-center py-8 px-4">
    <div class="bg-white rounded-2xl p-6 w-full max-w-3xl">
      <h3 class="text-xl font-bold text-gray-800 mb-5" id="exam-modal-title">新增試卷</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">試卷名稱 *</label>
          <input id="exam-title-input" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="如：112學年度數理資優班入學考試">
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">說明</label>
          <textarea id="exam-desc-input" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">考試時間（分鐘）</label>
          <input id="exam-duration-input" type="number" value="90" min="10" class="w-full border border-gray-300 rounded-lg px-3 py-2">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">狀態</label>
          <select id="exam-status-input" class="w-full border border-gray-300 rounded-lg px-3 py-2">
            <option value="draft">草稿</option>
            <option value="active">開放考試</option>
            <option value="closed">已關閉</option>
          </select>
        </div>
      </div>
      <div class="border rounded-xl p-4 mb-4">
        <div class="flex gap-3 mb-3 flex-wrap">
          <h4 class="font-medium text-gray-700">選擇題目</h4>
          <select id="eq-subject" onchange="loadExamQuestions()" class="border border-gray-300 rounded px-2 py-1 text-sm ml-auto">
            <option value="">全部科目</option>
          </select>
          <select id="eq-diff" onchange="loadExamQuestions()" class="border border-gray-300 rounded px-2 py-1 text-sm">
            <option value="">全部難度</option>
            <option value="1">★</option><option value="2">★★</option><option value="3">★★★</option>
            <option value="4">★★★★</option><option value="5">★★★★★</option>
          </select>
        </div>
        <div id="eq-list" class="max-h-60 overflow-y-auto space-y-1 text-sm"></div>
      </div>
      <div class="border border-amber-200 rounded-xl p-4 mb-4 bg-amber-50/40">
        <h4 class="font-medium text-gray-700 mb-3">🎲 隨機抽題</h4>
        <div class="flex gap-2 flex-wrap items-end">
          <div>
            <label class="block text-xs text-gray-500 mb-1">科目</label>
            <select id="rand-subject" class="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="">全部</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">題型</label>
            <select id="rand-type" class="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="">全部</option>
              <option value="choice">選擇題</option>
              <option value="fill">填充題</option>
              <option value="calculation">計算題</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">最低難度</label>
            <select id="rand-diff-min" class="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="">不限</option>
              <option value="1">★</option><option value="2">★★</option><option value="3">★★★</option>
              <option value="4">★★★★</option><option value="5">★★★★★</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">最高難度</label>
            <select id="rand-diff-max" class="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="">不限</option>
              <option value="1">★</option><option value="2">★★</option><option value="3">★★★</option>
              <option value="4">★★★★</option><option value="5">★★★★★</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">抽題數量</label>
            <input id="rand-count" type="number" value="10" min="1" max="100" class="border border-gray-300 rounded px-2 py-1 text-sm w-16">
          </div>
          <button onclick="randomPickQuestions()" class="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-medium transition-colors">隨機抽題</button>
        </div>
        <p id="rand-msg" class="text-xs text-gray-500 mt-2 hidden"></p>
      </div>
      <div class="border rounded-xl p-4 mb-4">
        <h4 class="font-medium text-gray-700 mb-3">已選題目 <span id="selected-count" class="text-indigo-600">0</span> 題</h4>
        <div id="selected-questions" class="space-y-1 text-sm max-h-48 overflow-y-auto"></div>
      </div>
      <div class="flex gap-3 justify-end">
        <button onclick="closeModal('exam-modal')" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">取消</button>
        <button onclick="saveExam()" class="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium">儲存</button>
      </div>
    </div>
  </div>
</div>

<script>
let currentPage = 1;
let editingQuestionId = null;
let editingExamId = null;
let subjects = [];
let selectedQuestions = {};
let allExamQPool = [];

// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  const res = await fetch('/api/subjects');
  subjects = await res.json();
  const selects = ['q-subject','filter-subject','eq-subject','rand-subject'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    subjects.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id; opt.textContent = s.name;
      el.appendChild(opt);
    });
  });
  loadQuestions();
}

// ── Tab Switching ─────────────────────────────────────────────────────────
function switchTab(tab, btn) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('hidden'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.classList.add('text-indigo-200'); });
  btn.classList.add('active'); btn.classList.remove('text-indigo-200');
  if (tab === 'exams') loadExams();
  if (tab === 'stats') loadStatsExamList();
}

// ── Questions ─────────────────────────────────────────────────────────────
async function loadQuestions(page = 1) {
  currentPage = page;
  const params = new URLSearchParams();
  const s = document.getElementById('filter-subject').value;
  const t = document.getElementById('filter-type').value;
  const d = document.getElementById('filter-diff').value;
  const q = document.getElementById('filter-search').value;
  if (s) params.set('subject_id', s);
  if (t) params.set('type', t);
  if (d) params.set('difficulty', d);
  if (q) params.set('search', q);
  params.set('page', page); params.set('limit', 20);

  const res = await fetch('/api/questions?' + params);
  const data = await res.json();
  const typeLabel = {choice:'選擇題',fill:'填充題',calculation:'計算題'};
  const tbody = data.data.map(q => \`
    <tr class="hover:bg-gray-50 border-b border-gray-100">
      <td class="px-4 py-3 text-sm text-gray-500">\${q.id}</td>
      <td class="px-4 py-3"><span class="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded">\${q.subject_name}</span></td>
      <td class="px-4 py-3 text-sm">\${typeLabel[q.type]||q.type}</td>
      <td class="px-4 py-3 text-sm">\${'★'.repeat(q.difficulty)}</td>
      <td class="px-4 py-3 text-sm text-gray-800 max-w-xs truncate">\${q.content}</td>
      <td class="px-4 py-3 text-sm text-gray-500">\${q.tags||''}</td>
      <td class="px-4 py-3">
        <div class="flex gap-2">
          <button onclick="editQuestion(\${q.id})" class="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition-colors">編輯</button>
          <button onclick="deleteQuestion(\${q.id})" class="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded transition-colors">刪除</button>
        </div>
      </td>
    </tr>
  \`).join('');

  document.getElementById('questions-table').innerHTML = \`
    <div class="px-4 py-3 bg-gray-50 border-b text-sm text-gray-500">共 \${data.total} 道題目</div>
    <table class="w-full"><thead class="bg-gray-50 text-xs text-gray-500 uppercase">
      <tr><th class="px-4 py-3 text-left">ID</th><th class="px-4 py-3 text-left">科目</th><th class="px-4 py-3 text-left">題型</th><th class="px-4 py-3 text-left">難度</th><th class="px-4 py-3 text-left">題目</th><th class="px-4 py-3 text-left">標籤</th><th class="px-4 py-3 text-left">操作</th></tr>
    </thead><tbody>\${tbody || '<tr><td colspan="7" class="text-center py-8 text-gray-400">沒有題目</td></tr>'}</tbody></table>
  \`;

  const pages = Math.ceil(data.total / 20);
  document.getElementById('pagination').innerHTML = Array.from({length: pages}, (_,i) =>
    \`<button onclick="loadQuestions(\${i+1})" class="px-3 py-1 rounded text-sm \${i+1===page?'bg-indigo-600 text-white':'bg-white border text-gray-600 hover:bg-gray-50'}">\${i+1}</button>\`
  ).join('');
}

function openQuestionModal(data = null) {
  editingQuestionId = data ? data.id : null;
  document.getElementById('modal-title').textContent = data ? '編輯題目' : '新增題目';
  document.getElementById('q-subject').value    = data?.subject_id || subjects[0]?.id || '';
  document.getElementById('q-type').value       = data?.type || 'choice';
  document.getElementById('q-difficulty').value = data?.difficulty || '3';
  document.getElementById('q-content').value    = data?.content || '';
  document.getElementById('q-opt-a').value      = data?.option_a || '';
  document.getElementById('q-opt-b').value      = data?.option_b || '';
  document.getElementById('q-opt-c').value      = data?.option_c || '';
  document.getElementById('q-opt-d').value      = data?.option_d || '';
  document.getElementById('q-answer').value     = data?.answer || '';
  document.getElementById('q-explanation').value= data?.explanation || '';
  document.getElementById('q-source').value     = data?.source || '';
  document.getElementById('q-tags').value       = data?.tags || '';
  toggleOptions();
  document.getElementById('question-modal').classList.remove('hidden');
}

function toggleOptions() {
  const isChoice = document.getElementById('q-type').value === 'choice';
  document.getElementById('choice-options').classList.toggle('hidden', !isChoice);
}

async function editQuestion(id) {
  const res = await fetch('/api/questions/' + id);
  openQuestionModal(await res.json());
}

async function deleteQuestion(id) {
  if (!confirm('確定刪除這道題目？')) return;
  await fetch('/api/questions/' + id, { method: 'DELETE' });
  loadQuestions(currentPage);
}

async function saveQuestion() {
  const body = {
    subject_id:  document.getElementById('q-subject').value,
    type:        document.getElementById('q-type').value,
    difficulty:  document.getElementById('q-difficulty').value,
    content:     document.getElementById('q-content').value.trim(),
    option_a:    document.getElementById('q-opt-a').value.trim(),
    option_b:    document.getElementById('q-opt-b').value.trim(),
    option_c:    document.getElementById('q-opt-c').value.trim(),
    option_d:    document.getElementById('q-opt-d').value.trim(),
    answer:      document.getElementById('q-answer').value.trim(),
    explanation: document.getElementById('q-explanation').value.trim(),
    source:      document.getElementById('q-source').value.trim(),
    tags:        document.getElementById('q-tags').value.trim(),
  };
  if (!body.content || !body.answer) { alert('請填寫題目內容與正確答案'); return; }
  const url    = editingQuestionId ? '/api/questions/' + editingQuestionId : '/api/questions';
  const method = editingQuestionId ? 'PUT' : 'POST';
  await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  closeModal('question-modal');
  loadQuestions(currentPage);
}

// ── Exams ─────────────────────────────────────────────────────────────────
async function loadExams() {
  const res = await fetch('/api/exams');
  const exams = await res.json();
  const statusLabel = {draft:'草稿',active:'開放中',closed:'已關閉'};
  const statusColor = {draft:'bg-gray-100 text-gray-600',active:'bg-green-100 text-green-700',closed:'bg-red-100 text-red-600'};
  document.getElementById('exams-list').innerHTML = exams.length ? exams.map(e => \`
    <div class="bg-white rounded-xl shadow p-5 flex justify-between items-center">
      <div>
        <h3 class="font-bold text-gray-800">\${e.title}</h3>
        <div class="flex gap-3 mt-1 text-sm text-gray-500">
          <span>📋 \${e.question_count||0} 題</span>
          <span>⏱ \${e.duration_min} 分鐘</span>
          <span>💯 \${e.total_score||0} 分</span>
          <span class="\${statusColor[e.status]||''} text-xs px-2 py-0.5 rounded font-medium">\${statusLabel[e.status]||e.status}</span>
        </div>
      </div>
      <div class="flex gap-2">
        <a href="/results.html?exam_id=\${e.id}" class="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded transition-colors">成績</a>
        <button onclick="editExam(\${e.id})" class="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors">編輯</button>
        <button onclick="deleteExam(\${e.id})" class="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded transition-colors">刪除</button>
      </div>
    </div>
  \`).join('') : '<p class="text-center py-8 text-gray-400">尚無試卷</p>';
}

async function openExamModal(data = null) {
  editingExamId = data ? data.id : null;
  selectedQuestions = {};
  document.getElementById('exam-modal-title').textContent = data ? '編輯試卷' : '新增試卷';
  document.getElementById('exam-title-input').value = data?.title || '';
  document.getElementById('exam-desc-input').value = data?.description || '';
  document.getElementById('exam-duration-input').value = data?.duration_min || 90;
  document.getElementById('exam-status-input').value = data?.status || 'draft';

  if (data && data.questions) {
    data.questions.forEach(q => { selectedQuestions[q.id] = { ...q, score: q.score }; });
  }
  await loadExamQuestions();
  renderSelectedQuestions();
  document.getElementById('exam-modal').classList.remove('hidden');
}

async function editExam(id) {
  const res = await fetch('/api/exams/' + id);
  openExamModal(await res.json());
}

async function deleteExam(id) {
  if (!confirm('確定刪除此試卷？')) return;
  await fetch('/api/exams/' + id, { method: 'DELETE' });
  loadExams();
}

async function loadExamQuestions() {
  const params = new URLSearchParams();
  const s = document.getElementById('eq-subject').value;
  const d = document.getElementById('eq-diff').value;
  if (s) params.set('subject_id', s);
  if (d) params.set('difficulty', d);
  params.set('limit', 100);
  const res = await fetch('/api/questions?' + params);
  const data = await res.json();
  allExamQPool = data.data;
  document.getElementById('eq-list').innerHTML = data.data.map(q => \`
    <div class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 \${selectedQuestions[q.id] ? 'bg-indigo-50' : ''}">
      <input type="checkbox" id="eq-\${q.id}" \${selectedQuestions[q.id] ? 'checked' : ''} onchange="toggleQuestion(\${q.id})" class="accent-indigo-600">
      <label for="eq-\${q.id}" class="flex-1 cursor-pointer text-gray-700 truncate">\${q.content}</label>
      <span class="text-xs text-gray-400 shrink-0">\${q.subject_name} \${'★'.repeat(q.difficulty)}</span>
    </div>
  \`).join('') || '<p class="text-gray-400 text-center py-4">沒有題目</p>';
}

function toggleQuestion(id) {
  const q = allExamQPool.find(q => q.id === id);
  if (selectedQuestions[id]) delete selectedQuestions[id];
  else if (q) selectedQuestions[id] = { ...q, score: 5 };
  renderSelectedQuestions();
}

async function randomPickQuestions() {
  const params = new URLSearchParams();
  const s    = document.getElementById('rand-subject').value;
  const t    = document.getElementById('rand-type').value;
  const dMin = document.getElementById('rand-diff-min').value;
  const dMax = document.getElementById('rand-diff-max').value;
  const cnt  = parseInt(document.getElementById('rand-count').value) || 10;
  if (s)    params.set('subject_id', s);
  if (t)    params.set('type', t);
  if (dMin) params.set('difficulty_min', dMin);
  if (dMax) params.set('difficulty_max', dMax);
  params.set('count', cnt);
  const res = await fetch('/api/questions/random?' + params);
  const questions = await res.json();
  let added = 0;
  questions.forEach(q => {
    if (!selectedQuestions[q.id]) {
      selectedQuestions[q.id] = { ...q, score: 5 };
      if (!allExamQPool.find(p => p.id === q.id)) allExamQPool.push(q);
      added++;
    }
  });
  const msg = document.getElementById('rand-msg');
  msg.textContent = \`已加入 \${added} 題（共抽到 \${questions.length} 題，其中 \${questions.length - added} 題已在清單中）\`;
  msg.classList.remove('hidden');
  await loadExamQuestions();
  renderSelectedQuestions();
}

function renderSelectedQuestions() {
  const list = Object.values(selectedQuestions);
  document.getElementById('selected-count').textContent = list.length;
  document.getElementById('selected-questions').innerHTML = list.length ? list.map(q => \`
    <div class="flex items-center gap-2 p-2 rounded bg-indigo-50">
      <span class="flex-1 text-gray-700 truncate text-xs">\${q.content}</span>
      <span class="text-xs text-gray-500">分值：</span>
      <input type="number" value="\${q.score}" min="1" max="50"
        onchange="selectedQuestions[\${q.id}].score = parseInt(this.value)||5"
        class="w-14 border border-gray-300 rounded px-1 py-0.5 text-xs text-center">
      <button onclick="delete selectedQuestions[\${q.id}]; document.getElementById('eq-\${q.id}') && (document.getElementById('eq-\${q.id}').checked=false); renderSelectedQuestions()"
        class="text-red-400 hover:text-red-600 text-xs">✕</button>
    </div>
  \`).join('') : '<p class="text-gray-400 text-center py-4 text-xs">請從上方勾選題目</p>';
}

async function saveExam() {
  const title = document.getElementById('exam-title-input').value.trim();
  if (!title) { alert('請填寫試卷名稱'); return; }
  const body = {
    title,
    description: document.getElementById('exam-desc-input').value.trim(),
    duration_min: parseInt(document.getElementById('exam-duration-input').value) || 90,
    status: document.getElementById('exam-status-input').value,
    question_ids: Object.values(selectedQuestions).map(q => ({ id: q.id, score: q.score }))
  };
  const url    = editingExamId ? '/api/exams/' + editingExamId : '/api/exams';
  const method = editingExamId ? 'PUT' : 'POST';
  await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  closeModal('exam-modal');
  loadExams();
}

// ── Stats ─────────────────────────────────────────────────────────────────
async function loadStatsExamList() {
  const res = await fetch('/api/exams');
  const exams = await res.json();
  const sel = document.getElementById('stats-exam-select');
  sel.innerHTML = '<option value="">選擇試卷</option>' + exams.map(e => \`<option value="\${e.id}">\${e.title}</option>\`).join('');
}

async function loadStats() {
  const id = document.getElementById('stats-exam-select').value;
  if (!id) return;
  const [statsRes, subsRes] = await Promise.all([
    fetch('/api/exams/' + id + '/stats'),
    fetch('/api/exams/' + id + '/submissions')
  ]);
  const stats = await statsRes.json();
  const subs  = await subsRes.json();
  document.getElementById('stats-container').innerHTML = \`
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      \${[['考生人數', stats.count+'人'], ['平均成績', (stats.avg_pct||0)+'%'], ['最高分', (stats.max_pct||0).toFixed(1)+'%'], ['最低分', (stats.min_pct||0).toFixed(1)+'%']].map(([label,val]) =>
        \`<div class="bg-white rounded-xl shadow p-4 text-center"><p class="text-gray-500 text-sm">\${label}</p><p class="text-2xl font-bold text-indigo-700 mt-1">\${val}</p></div>\`
      ).join('')}
    </div>
    \${stats.most_wrong.length ? \`
    <div class="bg-white rounded-xl shadow p-5 mb-6">
      <h4 class="font-bold text-gray-700 mb-3">⚠️ 常錯題目（Top 5）</h4>
      \${stats.most_wrong.map((w,i) => \`<div class="flex justify-between py-2 border-b last:border-0 text-sm"><span class="text-gray-700 truncate max-w-lg">\${i+1}. \${w.content}</span><span class="text-red-600 font-medium shrink-0 ml-4">錯誤 \${w.wrong_count} 次</span></div>\`).join('')}
    </div>\` : ''}
    <div class="bg-white rounded-xl shadow p-5">
      <h4 class="font-bold text-gray-700 mb-3">📋 考生成績列表</h4>
      <table class="w-full text-sm">
        <thead class="bg-gray-50"><tr>
          <th class="px-3 py-2 text-left text-gray-500">姓名</th>
          <th class="px-3 py-2 text-left text-gray-500">學號</th>
          <th class="px-3 py-2 text-right text-gray-500">得分</th>
          <th class="px-3 py-2 text-right text-gray-500">百分比</th>
          <th class="px-3 py-2 text-right text-gray-500">作答時間</th>
        </tr></thead>
        <tbody>
          \${subs.map(s => \`<tr class="border-b hover:bg-gray-50">
            <td class="px-3 py-2 font-medium">\${s.student_name}</td>
            <td class="px-3 py-2 text-gray-500">\${s.student_id||'-'}</td>
            <td class="px-3 py-2 text-right">\${s.score}/\${s.total_score}</td>
            <td class="px-3 py-2 text-right font-bold \${s.percentage>=80?'text-green-600':s.percentage>=60?'text-yellow-600':'text-red-600'}">\${s.percentage}%</td>
            <td class="px-3 py-2 text-right text-gray-400 text-xs">\${s.submitted_at}</td>
          </tr>\`).join('') || '<tr><td colspan="5" class="text-center py-6 text-gray-400">尚無作答紀錄</td></tr>'}
        </tbody>
      </table>
    </div>
  \`;
}

// ── Utils ─────────────────────────────────────────────────────────────────
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

init();
</script>
</body>
</html>`;

// ── results.html ───────────────────────────────────────────────────────────
const resultsHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>成績查詢 - 數理資優班考題系統</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{font-family:'Noto Sans TC',sans-serif;}</style>
</head>
<body class="bg-gray-50 min-h-screen">
<header class="bg-indigo-700 text-white py-4 px-6 shadow">
  <div class="max-w-4xl mx-auto flex items-center gap-3">
    <a href="/" class="text-indigo-200 hover:text-white">🏠</a>
    <span class="text-lg font-bold">成績查詢</span>
  </div>
</header>
<main class="max-w-4xl mx-auto px-4 py-8">
  <div class="bg-white rounded-xl shadow p-6 mb-6">
    <h2 class="font-bold text-gray-700 mb-4">查詢考試成績</h2>
    <div class="flex gap-3">
      <select id="exam-select" class="flex-1 border border-gray-300 rounded-lg px-3 py-2">
        <option value="">請選擇試卷</option>
      </select>
      <button onclick="loadSubmissions()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg transition-colors">查詢</button>
    </div>
  </div>
  <div id="submissions-list"></div>
</main>
<script>
async function init() {
  const res = await fetch('/api/exams');
  const exams = await res.json();
  const sel = document.getElementById('exam-select');
  exams.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id; opt.textContent = e.title;
    sel.appendChild(opt);
  });
  const params = new URLSearchParams(location.search);
  if (params.get('exam_id')) { sel.value = params.get('exam_id'); loadSubmissions(); }
}

async function loadSubmissions() {
  const id = document.getElementById('exam-select').value;
  if (!id) return;
  const [subsRes, statsRes] = await Promise.all([
    fetch('/api/exams/' + id + '/submissions'),
    fetch('/api/exams/' + id + '/stats')
  ]);
  const subs  = await subsRes.json();
  const stats = await statsRes.json();
  const pctColor = p => p>=80?'text-green-600':p>=60?'text-yellow-600':'text-red-600';

  document.getElementById('submissions-list').innerHTML = \`
    <div class="grid grid-cols-4 gap-4 mb-6">
      \${[['參加人數',stats.count+'人'],['平均分',+(stats.avg_pct||0).toFixed(1)+'%'],['最高分',+(stats.max_pct||0).toFixed(1)+'%'],['最低分',+(stats.min_pct||0).toFixed(1)+'%']].map(([l,v])=>
        \`<div class="bg-white rounded-xl shadow p-4 text-center"><p class="text-sm text-gray-500">\${l}</p><p class="text-2xl font-bold text-indigo-700 mt-1">\${v}</p></div>\`
      ).join('')}
    </div>
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 text-sm text-gray-500"><tr>
          <th class="px-4 py-3 text-left">考生姓名</th>
          <th class="px-4 py-3 text-left">學號</th>
          <th class="px-4 py-3 text-right">得分</th>
          <th class="px-4 py-3 text-right">成績</th>
          <th class="px-4 py-3 text-right">作答時間</th>
          <th class="px-4 py-3 text-center">詳情</th>
        </tr></thead>
        <tbody>
          \${subs.map(s=>\`
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">\${s.student_name}</td>
              <td class="px-4 py-3 text-gray-500">\${s.student_id||'-'}</td>
              <td class="px-4 py-3 text-right">\${s.score}/\${s.total_score}</td>
              <td class="px-4 py-3 text-right font-bold \${pctColor(s.percentage)}">\${s.percentage}%</td>
              <td class="px-4 py-3 text-right text-gray-400 text-xs">\${s.submitted_at}</td>
              <td class="px-4 py-3 text-center"><a href="/result.html?id=\${s.id}" class="text-indigo-600 hover:text-indigo-800 text-sm">查看</a></td>
            </tr>
          \`).join('')||'<tr><td colspan="6" class="text-center py-8 text-gray-400">尚無成績紀錄</td></tr>'}
        </tbody>
      </table>
    </div>
  \`;
}
init();
</script>
</body>
</html>`;

const files = {
  'public/index.html':     indexHtml,
  'public/exam-list.html': examListHtml,
  'public/exam.html':      examHtml,
  'public/result.html':    resultHtml,
  'public/admin.html':     adminHtml,
  'public/results.html':   resultsHtml,
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(filepath, content, 'utf8');
  console.log('✅ 產生', filepath);
}
console.log('\n✅ 所有前端檔案已產生完成！');
