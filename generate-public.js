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
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    <a href="/ai-generate.html" class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer block text-center">
      <div class="text-5xl mb-4">🤖</div>
      <h2 class="text-xl font-bold text-gray-800 mb-2">AI 出題</h2>
      <p class="text-gray-500 text-sm">用 LLM 自動生成考題</p>
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
<script>MathJax = { tex: { inlineMath: [['$','$'],['\\\\(','\\\\)']], displayMath: [['$$','$$'],['\\\\[','\\\\]']] } };</script>
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

const audioPlayCounts = {};
const AUDIO_MAX_PLAYS = 3;

function renderQuestions() {
  const container = document.getElementById('questions-container');
  const nav = document.getElementById('question-nav');
  container.innerHTML = examData.questions.map((q, i) => \`
    <div id="q-\${i}" class="bg-white rounded-xl shadow p-6 mb-4">
      <div class="flex justify-between items-start mb-3">
        <span class="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">第 \${i+1} 題 · \${q.subject_name} · \${q.score}分\${q.type === 'listening' ? ' · 🎧 聽力' : ''}</span>
        <span class="text-xs text-gray-400">\${'★'.repeat(q.difficulty || 1)}\${'☆'.repeat(5-(q.difficulty||1))}</span>
      </div>
      \${q.audio_url ? renderAudioPlayer(q, i) : ''}
      <p class="text-gray-800 mb-4 leading-relaxed">\${q.content}</p>
      \${(q.type === 'choice' || q.type === 'listening') ? renderChoices(q, i) : renderFill(q, i)}
    </div>
  \`).join('') + '<div class="h-24"></div>';
  if (window.MathJax) MathJax.typesetPromise([container]);
  nav.innerHTML = examData.questions.map((q,i) => \`
    <button id="nav-\${i}" onclick="scrollToQ(\${i})" class="w-8 h-8 rounded text-sm font-medium border-2 border-gray-300 text-gray-600 hover:border-indigo-400">\${i+1}</button>
  \`).join('');
  updateProgress();
}

function renderAudioPlayer(q, idx) {
  return \`
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-blue-700 font-medium text-sm">🎧 請先聆聽音訊再作答</span>
        <span id="play-count-\${idx}" class="text-xs text-blue-500 ml-auto">已播放：0 / \${AUDIO_MAX_PLAYS} 次</span>
      </div>
      <audio id="audio-\${idx}" src="\${q.audio_url}" preload="none" controlsList="nodownload"
        class="w-full h-10" onended="onAudioEnded(\${idx})"></audio>
      <button id="play-btn-\${idx}" onclick="playAudio(\${idx})"
        class="mt-2 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
        ▶ 播放音訊
      </button>
    </div>
  \`;
}

function playAudio(idx) {
  const audio = document.getElementById(\`audio-\${idx}\`);
  const btn   = document.getElementById(\`play-btn-\${idx}\`);
  const count = audioPlayCounts[idx] || 0;
  if (count >= AUDIO_MAX_PLAYS) {
    alert(\`已達播放上限（\${AUDIO_MAX_PLAYS} 次），無法再播放\`);
    return;
  }
  audioPlayCounts[idx] = count + 1;
  document.getElementById(\`play-count-\${idx}\`).textContent = \`已播放：\${audioPlayCounts[idx]} / \${AUDIO_MAX_PLAYS} 次\`;
  if (audioPlayCounts[idx] >= AUDIO_MAX_PLAYS) {
    btn.textContent = '已達播放上限';
    btn.disabled = true;
    btn.classList.replace('bg-blue-600','bg-gray-400');
    btn.classList.replace('hover:bg-blue-700','hover:bg-gray-400');
  }
  audio.currentTime = 0;
  audio.play();
}

function onAudioEnded(idx) {
  const btn = document.getElementById(\`play-btn-\${idx}\`);
  if (btn && !btn.disabled) btn.textContent = '▶ 再聽一次';
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
<script>MathJax = { tex: { inlineMath: [['$','$'],['\\\\(','\\\\)']], displayMath: [['$$','$$'],['\\\\[','\\\\]']] } };</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script" async></script>
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
function getOptionLabel(q, letter) {
  if (!letter) return '（未作答）';
  const map = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };
  const text = map[letter.toUpperCase()];
  return text ? letter.toUpperCase() + '. ' + text : letter.toUpperCase();
}
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
            <p>你的答案：<span class="\${d.is_correct ? 'text-green-600' : 'text-red-600'} font-medium">\${d.type === 'choice' ? getOptionLabel(d, d.given_answer) : (d.given_answer || '（未作答）')}</span></p>
            \${!d.is_correct ? \`<p>正確答案：<span class="text-green-600 font-medium">\${d.type === 'choice' ? getOptionLabel(d, d.correct_answer) : d.correct_answer}</span></p>\` : ''}
            \${d.explanation ? \`<p class="text-gray-500 mt-2 bg-gray-50 p-2 rounded">💡 \${d.explanation}</p>\` : ''}
          </div>
        </div>
      \`).join('')}
    </div>
    <div class="mt-6 text-center flex gap-4 justify-center">
      <a href="/exam-list.html" class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">返回考試列表</a>
      <a href="/analysis.html?id=\${id}" class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">📊 查看答題分析報告</a>
    </div>
  \`;
  if (window.MathJax) MathJax.typesetPromise([document.getElementById('result-container')]);
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
      <button class="tab-btn px-4 py-1.5 rounded-lg text-sm font-medium border border-white/30 text-indigo-200" onclick="switchTab('ml',this)">🧠 ML 分析</button>
    </div>
  </div>
</header>

<main class="max-w-7xl mx-auto px-4 py-6">
  <!-- 題庫管理 -->
  <div id="tab-questions">
    <div class="flex gap-3 mb-4 flex-wrap">
      <button onclick="openQuestionModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">+ 新增題目</button>
      <select id="filter-grade" onchange="onFilterGradeChange()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
        <option value="">全部學段</option>
        <option value="elementary_6">國小六年級</option>
        <option value="junior_high">升國中（資優班）</option>
        <option value="grade_7">國一（七年級）</option>
        <option value="grade_8">國二（八年級）</option>
        <option value="grade_9">國三（九年級）</option>
        <option value="bctest">國中教育會考</option>
      </select>
      <select id="filter-subject" onchange="loadQuestions()"class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
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
      <label class="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
        <input type="checkbox" id="filter-archived" onchange="loadQuestions()" class="accent-indigo-600">
        含封存題
      </label>
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

  <!-- ML 分析 -->
  <div id="tab-ml" class="hidden">
    <div class="flex gap-2 mb-5 flex-wrap">
      <button id="mlbtn-quality" onclick="switchMlTab('quality')" class="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white transition-colors">🔍 題目品質分析</button>
      <button id="mlbtn-calibration" onclick="switchMlTab('calibration')" class="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">📊 難度校正</button>
      <button id="mlbtn-ability" onclick="switchMlTab('ability')" class="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">🧠 學生能力查詢</button>
    </div>

    <!-- 題目品質分析 -->
    <div id="ml-quality">
      <div class="flex gap-3 mb-4 items-end flex-wrap">
        <div>
          <label class="block text-xs text-gray-500 mb-1">最少作答次數</label>
          <input id="ml-min-attempts" type="number" value="3" min="1" class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">學段</label>
          <select id="ml-grade" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">全部</option>
            <option value="junior_high">升國中（資優班）</option>
            <option value="elementary_6">國小六年級</option>
            <option value="grade_7">國一（七年級）</option>
            <option value="grade_8">國二（八年級）</option>
            <option value="grade_9">國三（九年級）</option>
            <option value="bctest">國中教育會考</option>
          </select>
        </div>
        <button onclick="loadQualityReport()"class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">載入報表</button>
        <label class="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" id="ml-needs-review-only" class="accent-indigo-600">
          只顯示需審查
        </label>
      </div>
      <div id="ml-quality-summary" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4"></div>
      <div id="ml-quality-table" class="bg-white rounded-xl shadow overflow-hidden">
        <div class="text-center py-8 text-gray-400 text-sm">點擊「載入報表」開始分析</div>
      </div>
    </div>

    <!-- 難度校正 -->
    <div id="ml-calibration" class="hidden">
      <div class="flex gap-3 mb-4 items-end flex-wrap">
        <div>
          <label class="block text-xs text-gray-500 mb-1">學段</label>
          <select id="cal-grade" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">全部</option>
            <option value="junior_high">升國中（資優班）</option>
            <option value="elementary_6">國小六年級</option>
            <option value="grade_7">國一（七年級）</option>
            <option value="grade_8">國二（八年級）</option>
            <option value="grade_9">國三（九年級）</option>
            <option value="bctest">國中教育會考</option>
          </select>
        </div>
        <button onclick="loadCalibration()"class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">載入報表</button>
        <label class="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" id="cal-anomalous-only" class="accent-indigo-600">
          只顯示異常題目
        </label>
      </div>
      <div id="cal-summary" class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4"></div>
      <div id="cal-table" class="bg-white rounded-xl shadow overflow-hidden">
        <div class="text-center py-8 text-gray-400 text-sm">點擊「載入報表」開始分析</div>
      </div>
    </div>

    <!-- 學生能力查詢 -->
    <div id="ml-ability" class="hidden">
      <div class="bg-white rounded-xl shadow p-5 mb-5">
        <h4 class="font-semibold text-gray-700 mb-3">查詢學生能力檔案</h4>
        <div class="flex gap-3 flex-wrap items-end">
          <div>
            <label class="block text-xs text-gray-500 mb-1">學生姓名</label>
            <input id="ability-student-name" type="text" placeholder="輸入學生姓名" class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40">
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">學生編號（選填）</label>
            <input id="ability-student-id" type="text" placeholder="學號" class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32">
          </div>
          <button onclick="loadStudentAbility()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">查詢</button>
        </div>
      </div>
      <div id="ability-result"></div>
    </div>
  </div>
</main>

<!-- 題目新增/編輯 Modal -->
<div id="question-modal" class="fixed inset-0 bg-black/50 z-50 hidden overflow-y-auto">
  <div class="min-h-screen flex items-start justify-center py-8 px-4">
    <div class="bg-white rounded-2xl p-6 w-full max-w-2xl">
      <h3 class="text-xl font-bold text-gray-800 mb-5" id="modal-title">新增題目</h3>
      <form id="question-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">學段 *</label>
          <select id="q-grade-level" onchange="onGradeLevelChange()" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
            <option value="junior_high">升國中（資優班）</option>
            <option value="elementary_6">國小六年級</option>
            <option value="grade_7">國一（七年級）</option>
            <option value="grade_8">國二（八年級）</option>
            <option value="grade_9">國三（九年級）</option>
            <option value="bctest">國中教育會考</option>
          </select>
        </div>
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
              <option value="listening">🎧 聽力題</option>
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
          <label class="block text-sm font-medium text-gray-700 mb-2">選項（選擇題／聽力題）</label>
          <div class="space-y-2">
            <div class="flex gap-2 items-center"><span class="w-6 text-sm font-medium text-indigo-600">A.</span><input id="q-opt-a" type="text" class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm" placeholder="選項 A"></div>
            <div class="flex gap-2 items-center"><span class="w-6 text-sm font-medium text-indigo-600">B.</span><input id="q-opt-b" type="text" class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm" placeholder="選項 B"></div>
            <div class="flex gap-2 items-center"><span class="w-6 text-sm font-medium text-indigo-600">C.</span><input id="q-opt-c" type="text" class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm" placeholder="選項 C"></div>
            <div class="flex gap-2 items-center"><span class="w-6 text-sm font-medium text-indigo-600">D.</span><input id="q-opt-d" type="text" class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm" placeholder="選項 D"></div>
          </div>
        </div>
        <!-- 聽力題音訊區塊 -->
        <div id="audio-section" class="hidden bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <p class="text-sm font-medium text-blue-800">🎧 聽力音訊設定</p>
          <div>
            <label class="block text-xs text-gray-600 mb-1">上傳音訊檔案（mp3/wav/ogg/m4a，最大 50MB）</label>
            <div class="flex gap-2 items-center">
              <input id="q-audio-file" type="file" accept="audio/*" onchange="previewAudio()" class="flex-1 text-sm border border-gray-300 rounded px-2 py-1">
              <button type="button" onclick="uploadAudio()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap">上傳</button>
            </div>
            <p id="audio-upload-status" class="text-xs text-gray-500 mt-1"></p>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">或直接輸入音訊 URL</label>
            <input id="q-audio-url" type="text" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" placeholder="https://example.com/audio.mp3 或 /audio/filename.mp3">
          </div>
          <div id="audio-preview-wrap" class="hidden">
            <label class="block text-xs text-gray-600 mb-1">預覽</label>
            <audio id="q-audio-preview" controls class="w-full h-8"></audio>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">逐字稿（選填，僅管理員可見）</label>
            <textarea id="q-audio-transcript" rows="2" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm resize-none" placeholder="音訊內容文字稿，幫助核稿與備份..."></textarea>
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
          <select id="eq-grade" onchange="onEqGradeChange()" class="border border-gray-300 rounded px-2 py-1 text-sm ml-auto">
            <option value="">全部學段</option>
            <option value="elementary_6">國小六年級</option>
            <option value="junior_high">升國中（資優班）</option>
            <option value="grade_7">國一（七年級）</option>
            <option value="grade_8">國二（八年級）</option>
            <option value="grade_9">國三（九年級）</option>
            <option value="bctest">國中教育會考</option>
          </select>
          <select id="eq-subject"onchange="loadExamQuestions()" class="border border-gray-300 rounded px-2 py-1 text-sm">
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
            <label class="block text-xs text-gray-500 mb-1">學段</label>
            <select id="rand-grade" onchange="onRandGradeChange()" class="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="">全部學段</option>
              <option value="elementary_6">國小六年級</option>
              <option value="junior_high">升國中（資優班）</option>
              <option value="grade_7">國一（七年級）</option>
              <option value="grade_8">國二（八年級）</option>
              <option value="grade_9">國三（九年級）</option>
              <option value="bctest">國中教育會考</option>
            </select>
          </div>
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
          <label class="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" id="rand-weighted" class="accent-amber-500">
            依答錯次數加權
          </label>
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
let selectedQuestions = {};
let allExamQPool = [];

// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  // 初始化時，依預設學段（junior_high）分別載入各科目下拉
  await Promise.all([
    loadSubjectsInto('q-subject',      'junior_high'),
    loadSubjectsInto('filter-subject', ''),
    loadSubjectsInto('eq-subject',     ''),
    loadSubjectsInto('rand-subject',   ''),
  ]);
  loadQuestions();
}

// 依學段載入科目選項到指定 select 元素
async function loadSubjectsInto(selectId, grade_level) {
  const el = document.getElementById(selectId);
  if (!el) return;
  const url = grade_level ? \`/api/subjects?grade_level=\${grade_level}\` : '/api/subjects';
  const res = await fetch(url);
  const list = await res.json();
  // 保留第一個空白「全部科目」選項（如果有），再填入科目
  const firstOpt = el.options[0] && el.options[0].value === '' ? el.options[0].outerHTML : '';
  el.innerHTML = firstOpt + list.map(s => \`<option value="\${s.id}">\${s.name}</option>\`).join('');
}

// 題庫篩選：學段變更 → 重新載入科目下拉並刷新題目列表
async function onFilterGradeChange() {
  const grade = document.getElementById('filter-grade').value;
  await loadSubjectsInto('filter-subject', grade);
  loadQuestions();
}

// 題目 Modal：學段變更 → 重新載入科目下拉
async function onGradeLevelChange() {
  const grade = document.getElementById('q-grade-level').value;
  await loadSubjectsInto('q-subject', grade);
}

// 試卷 Modal：學段變更 → 重新載入科目下拉並刷新題目清單
async function onEqGradeChange() {
  const grade = document.getElementById('eq-grade').value;
  await loadSubjectsInto('eq-subject', grade);
  loadExamQuestions();
}

// 隨機抽題：學段變更 → 重新載入科目下拉
async function onRandGradeChange() {
  const grade = document.getElementById('rand-grade').value;
  await loadSubjectsInto('rand-subject', grade);
}

// ── Tab Switching ─────────────────────────────────────────────────────────
function switchTab(tab, btn) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('hidden'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.classList.add('text-indigo-200'); });
  btn.classList.add('active'); btn.classList.remove('text-indigo-200');
  if (tab === 'exams') loadExams();
  if (tab === 'stats') loadStatsExamList();
  if (tab === 'ml') switchMlTab('quality');
}

function switchMlTab(tab) {
  ['quality','calibration','ability'].forEach(t => {
    document.getElementById('ml-' + t).classList.toggle('hidden', t !== tab);
    const btn = document.getElementById('mlbtn-' + t);
    if (t === tab) { btn.classList.replace('bg-gray-200','bg-indigo-600'); btn.classList.replace('text-gray-700','text-white'); }
    else { btn.classList.replace('bg-indigo-600','bg-gray-200'); btn.classList.replace('text-white','text-gray-700'); }
  });
}

// ── ML Analytics ─────────────────────────────────────────────────────────────
const diffLabel5 = {1:'★ 入門',2:'★★ 基礎',3:'★★★ 中級',4:'★★★★ 進階',5:'★★★★★ 競賽'};

function mlStat(label, value, sub, color='text-indigo-600') {
  return \`<div class="bg-white rounded-xl shadow p-4 text-center">
    <div class="text-2xl font-bold \${color}">\${value}</div>
    <div class="text-sm font-medium text-gray-700 mt-1">\${label}</div>
    \${sub ? \`<div class="text-xs text-gray-400 mt-0.5">\${sub}</div>\` : ''}
  </div>\`;
}

async function loadQualityReport() {
  const min = document.getElementById('ml-min-attempts').value || 3;
  const grade = document.getElementById('ml-grade').value;
  const reviewOnly = document.getElementById('ml-needs-review-only').checked;
  const params = new URLSearchParams({ min_attempts: min });
  if (grade) params.set('grade_level', grade);
  const r = await fetch('/api/analytics/question-quality?' + params, { headers: { 'x-api-key': document.getElementById('api_key')?.value || '' } });
  const data = await r.json();
  if (!r.ok) { document.getElementById('ml-quality-table').innerHTML = \`<div class="text-center py-8 text-red-500">\${data.error}</div>\`; return; }

  document.getElementById('ml-quality-summary').innerHTML = [
    mlStat('分析題數', data.summary.total),
    mlStat('需審查', data.summary.needs_review, '有品質問題', data.summary.needs_review > 0 ? 'text-red-500' : 'text-green-600'),
    mlStat('平均通過率', (data.summary.avg_pass_rate || 0) + '%', '全部題目'),
    mlStat('平均鑑別度', data.summary.avg_discrimination !== null ? data.summary.avg_discrimination : 'N/A', '越高越好（>0.4佳）')
  ].join('');

  const qs = reviewOnly ? data.questions.filter(q => q.needs_review) : data.questions;
  if (!qs.length) {
    document.getElementById('ml-quality-table').innerHTML = '<div class="text-center py-8 text-gray-400">無符合條件的題目</div>';
    return;
  }
  document.getElementById('ml-quality-table').innerHTML = \`
    <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
        <tr>
          <th class="px-3 py-2 text-left">ID</th>
          <th class="px-3 py-2 text-left">科目</th>
          <th class="px-3 py-2">難度</th>
          <th class="px-3 py-2">作答數</th>
          <th class="px-3 py-2">通過率</th>
          <th class="px-3 py-2">鑑別度</th>
          <th class="px-3 py-2">品質分</th>
          <th class="px-3 py-2 text-left">問題旗標</th>
        </tr>
      </thead>
      <tbody>
        \${qs.map(q => \`
          <tr class="border-b border-gray-100 hover:bg-gray-50 \${q.needs_review ? 'bg-red-50' : ''}">
            <td class="px-3 py-2 text-gray-500">#\${q.id}</td>
            <td class="px-3 py-2"><span class="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded">\${q.subject_name}</span></td>
            <td class="px-3 py-2 text-center text-xs">\${diffLabel5[q.difficulty]||q.difficulty}</td>
            <td class="px-3 py-2 text-center">\${q.total_attempts}</td>
            <td class="px-3 py-2 text-center \${q.pass_rate>70?'text-green-600':q.pass_rate<30?'text-red-500':'text-yellow-600'} font-medium">\${q.pass_rate}%</td>
            <td class="px-3 py-2 text-center \${q.discrimination_index===null?'text-gray-400':q.discrimination_index>=0.3?'text-green-600':q.discrimination_index<0?'text-red-500':'text-yellow-600'}">\${q.discrimination_index !== null ? q.discrimination_index : '—'}</td>
            <td class="px-3 py-2 text-center"><span class="px-2 py-0.5 rounded text-xs font-bold \${q.quality_score>=70?'bg-green-100 text-green-700':q.quality_score>=40?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}">\${q.quality_score}</span></td>
            <td class="px-3 py-2 text-xs text-red-600">\${q.quality_flags.join(' / ') || '—'}</td>
          </tr>
        \`).join('')}
      </tbody>
    </table>
    </div>
  \`;
}

async function loadCalibration() {
  const grade = document.getElementById('cal-grade').value;
  const anomalousOnly = document.getElementById('cal-anomalous-only').checked;
  const params = new URLSearchParams();
  if (grade) params.set('grade_level', grade);
  const r = await fetch('/api/analytics/difficulty-calibration?' + params, { headers: { 'x-api-key': document.getElementById('api_key')?.value || '' } });
  const data = await r.json();
  if (!r.ok) { document.getElementById('cal-table').innerHTML = \`<div class="text-center py-8 text-red-500">\${data.error}</div>\`; return; }

  document.getElementById('cal-summary').innerHTML = [
    mlStat('總題數', data.summary.total),
    mlStat('有資料', data.summary.with_data, '≥5次作答'),
    mlStat('難度異常', data.summary.anomalous_count, '偏差≥2級', data.summary.anomalous_count > 0 ? 'text-red-500' : 'text-green-600'),
  ].join('');

  const qs = anomalousOnly ? data.questions.filter(q => q.is_anomalous) : data.questions.filter(q => q.total_attempts >= 1);
  if (!qs.length) { document.getElementById('cal-table').innerHTML = '<div class="text-center py-8 text-gray-400">無符合條件的題目</div>'; return; }
  document.getElementById('cal-table').innerHTML = \`
    <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
        <tr>
          <th class="px-3 py-2 text-left">ID</th>
          <th class="px-3 py-2 text-left">科目</th>
          <th class="px-3 py-2">標示難度</th>
          <th class="px-3 py-2">實際難度</th>
          <th class="px-3 py-2">通過率</th>
          <th class="px-3 py-2">作答數</th>
          <th class="px-3 py-2">偏差</th>
          <th class="px-3 py-2 text-left min-w-48">題目摘要</th>
        </tr>
      </thead>
      <tbody>
        \${qs.map(q => \`
          <tr class="border-b border-gray-100 hover:bg-gray-50 \${q.is_anomalous ? 'bg-orange-50' : ''}">
            <td class="px-3 py-2 text-gray-500">#\${q.id}</td>
            <td class="px-3 py-2"><span class="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded">\${q.subject_name}</span></td>
            <td class="px-3 py-2 text-center text-xs">\${diffLabel5[q.labeled_difficulty]||q.labeled_difficulty}</td>
            <td class="px-3 py-2 text-center text-xs \${q.empirical_difficulty===null?'text-gray-400':''}">\${q.empirical_difficulty !== null ? (diffLabel5[q.empirical_difficulty]||q.empirical_difficulty) : '—'}</td>
            <td class="px-3 py-2 text-center">\${q.pass_rate !== null ? q.pass_rate + '%' : '—'}</td>
            <td class="px-3 py-2 text-center">\${q.total_attempts}</td>
            <td class="px-3 py-2 text-center font-bold \${q.deviation===null?'text-gray-400':q.is_anomalous?'text-red-500':Math.abs(q.deviation)>=1?'text-yellow-600':'text-gray-600'}">\${q.deviation !== null ? (q.deviation > 0 ? '+' : '') + q.deviation : '—'}</td>
            <td class="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">\${q.content}</td>
          </tr>
        \`).join('')}
      </tbody>
    </table>
    </div>
  \`;
}

async function loadStudentAbility() {
  const name = document.getElementById('ability-student-name').value.trim();
  const sid = document.getElementById('ability-student-id').value.trim();
  if (!name && !sid) { alert('請輸入學生姓名或學號'); return; }
  const params = new URLSearchParams();
  if (name) params.set('student_name', name);
  if (sid)  params.set('student_id', sid);
  const r = await fetch('/api/analytics/student-ability?' + params, { headers: { 'x-api-key': document.getElementById('api_key')?.value || '' } });
  const data = await r.json();
  const el = document.getElementById('ability-result');
  if (!r.ok) { el.innerHTML = \`<div class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">\${data.error}</div>\`; return; }
  const abilityColor = a => a >= 4 ? 'text-green-600' : a >= 2.5 ? 'text-yellow-600' : 'text-red-500';
  const abilityBar = a => {
    if (a === null) return '<div class="text-gray-400 text-xs">資料不足</div>';
    const pct = Math.round((a - 1) / 4 * 100);
    const c = a >= 4 ? 'bg-green-500' : a >= 2.5 ? 'bg-yellow-400' : 'bg-red-400';
    return \`<div class="flex items-center gap-2"><div class="flex-1 bg-gray-200 rounded-full h-2"><div class="\${c} h-2 rounded-full" style="width:\${pct}%"></div></div><span class="text-xs font-bold w-8 \${abilityColor(a)}">\${a}</span></div>\`;
  };
  el.innerHTML = \`
    <div class="bg-white rounded-2xl shadow-lg p-6">
      <div class="flex items-center gap-4 mb-5 pb-4 border-b">
        <div class="text-4xl">🧑‍🎓</div>
        <div>
          <div class="text-xl font-bold text-gray-800">\${data.student_name || data.student_id}</div>
          <div class="text-gray-500 text-sm">共 \${data.exam_count} 份考卷 · \${data.total_responses} 題作答紀錄</div>
        </div>
        <div class="ml-auto text-center">
          <div class="text-3xl font-bold \${abilityColor(data.overall_ability)}">\${data.overall_ability ?? '—'}</div>
          <div class="text-xs text-gray-500">綜合能力值（1–5）</div>
        </div>
      </div>
      <h4 class="font-semibold text-gray-700 mb-3">各科能力分布</h4>
      <div class="space-y-3">
        \${data.ability_profile.map(p => \`
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="font-medium text-gray-700">\${p.subject_name}</span>
              <span class="text-gray-500 text-xs">\${p.correct_count}/\${p.sample_size} 答對（\${p.pass_rate}%），\${p.sample_size} 題</span>
            </div>
            \${abilityBar(p.ability)}
          </div>
        \`).join('')}
      </div>
      <p class="text-xs text-gray-400 mt-4">* 能力值採用 Rasch 模型（IRT）估算，1=最低，5=最高。樣本數越多越準確。</p>
    </div>
  \`;
}

// ── Questions ─────────────────────────────────────────────────────────────
async function loadQuestions(page = 1) {
  currentPage = page;
  const params = new URLSearchParams();
  const s = document.getElementById('filter-subject').value;
  const t = document.getElementById('filter-type').value;
  const d = document.getElementById('filter-diff').value;
  const g = document.getElementById('filter-grade').value;
  const q = document.getElementById('filter-search').value;
  const archived = document.getElementById('filter-archived')?.checked;
  if (s) params.set('subject_id', s);
  if (t) params.set('type', t);
  if (d) params.set('difficulty', d);
  if (g) params.set('grade_level', g);
  if (q) params.set('search', q);
  if (archived) params.set('include_archived', '1');
  params.set('page', page); params.set('limit', 20);

  const res = await fetch('/api/questions?' + params);
  const data = await res.json();
  const typeLabel = {choice:'選擇題',fill:'填充題',calculation:'計算題',listening:'🎧 聽力題'};
  const gradeLabel = {junior_high:'升國中',elementary_6:'國小六年級',grade_7:'國一',grade_8:'國二',grade_9:'國三',bctest:'會考'};
  const gradeCls = {elementary_6:'bg-green-50 text-green-700',junior_high:'bg-blue-50 text-blue-700',grade_7:'bg-purple-50 text-purple-700',grade_8:'bg-orange-50 text-orange-700',grade_9:'bg-red-50 text-red-700',bctest:'bg-yellow-50 text-yellow-700'};
  const tbody = data.data.map(q => \`
    <tr class="hover:bg-gray-50 border-b border-gray-100 \${q.is_archived ? 'opacity-50' : ''}">
      <td class="px-4 py-3 text-sm text-gray-500">\${q.id}\${q.is_archived ? ' <span class="text-xs bg-gray-200 text-gray-500 px-1 py-0.5 rounded">已封存</span>' : ''}</td>
      <td class="px-4 py-3"><span class="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded">\${q.subject_name}</span></td>
      <td class="px-4 py-3 text-sm">\${typeLabel[q.type]||q.type}</td>
      <td class="px-4 py-3 text-sm">\${'★'.repeat(q.difficulty)}</td>
      <td class="px-4 py-3 text-sm"><span class="\${gradeCls[q.grade_level]||'bg-gray-50 text-gray-700'} text-xs px-2 py-0.5 rounded">\${gradeLabel[q.grade_level]||q.grade_level}</span></td>
      <td class="px-4 py-3 text-sm text-gray-800 max-w-xs truncate">\${q.content}</td>
      <td class="px-4 py-3 text-sm text-gray-500">\${q.tags||''}</td>
      <td class="px-4 py-3 text-sm text-center"><span class="text-green-600 font-medium">\${q.correct_count||0}</span></td>
      <td class="px-4 py-3 text-sm text-center"><span class="text-red-500 font-medium">\${q.wrong_count||0}</span></td>
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
      <tr><th class="px-4 py-3 text-left">ID</th><th class="px-4 py-3 text-left">科目</th><th class="px-4 py-3 text-left">題型</th><th class="px-4 py-3 text-left">難度</th><th class="px-4 py-3 text-left">學段</th><th class="px-4 py-3 text-left">題目</th><th class="px-4 py-3 text-left">標籤</th><th class="px-4 py-3 text-left text-green-600">✓答對</th><th class="px-4 py-3 text-left text-red-500">✗答錯</th><th class="px-4 py-3 text-left">操作</th></tr>
    </thead><tbody>\${tbody || '<tr><td colspan="10" class="text-center py-8 text-gray-400">沒有題目</td></tr>'}</tbody></table>
  \`;

  const pages = Math.ceil(data.total / 20);
  document.getElementById('pagination').innerHTML = Array.from({length: pages}, (_,i) =>
    \`<button onclick="loadQuestions(\${i+1})" class="px-3 py-1 rounded text-sm \${i+1===page?'bg-indigo-600 text-white':'bg-white border text-gray-600 hover:bg-gray-50'}">\${i+1}</button>\`
  ).join('');
}

function openQuestionModal(data = null) {
  editingQuestionId = data ? data.id : null;
  document.getElementById('modal-title').textContent = data ? '編輯題目' : '新增題目';
  const gradeLevel = data?.grade_level || 'junior_high';
  document.getElementById('q-grade-level').value  = gradeLevel;
  // 先載入對應學段的科目，再設定已選科目
  loadSubjectsInto('q-subject', gradeLevel).then(() => {
    document.getElementById('q-subject').value = data?.subject_id || '';
  });
  document.getElementById('q-type').value         = data?.type || 'choice';
  document.getElementById('q-difficulty').value   = data?.difficulty || '3';
  document.getElementById('q-content').value      = data?.content || '';
  document.getElementById('q-opt-a').value        = data?.option_a || '';
  document.getElementById('q-opt-b').value        = data?.option_b || '';
  document.getElementById('q-opt-c').value        = data?.option_c || '';
  document.getElementById('q-opt-d').value        = data?.option_d || '';
  document.getElementById('q-answer').value       = data?.answer || '';
  document.getElementById('q-explanation').value  = data?.explanation || '';
  document.getElementById('q-source').value       = data?.source || '';
  document.getElementById('q-tags').value         = data?.tags || '';
  document.getElementById('q-audio-url').value    = data?.audio_url || '';
  document.getElementById('q-audio-transcript').value = data?.audio_transcript || '';
  document.getElementById('audio-upload-status').textContent = '';
  // 若有音訊 URL 則顯示預覽
  const previewWrap = document.getElementById('audio-preview-wrap');
  const audioPreview = document.getElementById('q-audio-preview');
  if (data?.audio_url) {
    audioPreview.src = data.audio_url;
    previewWrap.classList.remove('hidden');
  } else {
    audioPreview.src = '';
    previewWrap.classList.add('hidden');
  }
  toggleOptions();
  document.getElementById('question-modal').classList.remove('hidden');
}

function toggleOptions() {
  const type = document.getElementById('q-type').value;
  const isChoiceOrListening = type === 'choice' || type === 'listening';
  const isListening = type === 'listening';
  document.getElementById('choice-options').classList.toggle('hidden', !isChoiceOrListening);
  document.getElementById('audio-section').classList.toggle('hidden', !isListening);
}

async function uploadAudio() {
  const fileInput = document.getElementById('q-audio-file');
  const statusEl  = document.getElementById('audio-upload-status');
  if (!fileInput.files.length) { alert('請先選擇音訊檔案'); return; }
  const formData = new FormData();
  formData.append('audio', fileInput.files[0]);
  statusEl.textContent = '上傳中...';
  try {
    const res = await fetch('/api/audio/upload', {
      method: 'POST',
      headers: adminKey ? { 'x-api-key': adminKey } : {},
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '上傳失敗');
    document.getElementById('q-audio-url').value = data.audio_url;
    const audioPreview = document.getElementById('q-audio-preview');
    audioPreview.src = data.audio_url;
    document.getElementById('audio-preview-wrap').classList.remove('hidden');
    statusEl.textContent = '✅ 上傳成功：' + data.filename;
  } catch (err) {
    statusEl.textContent = '❌ ' + err.message;
  }
}

function previewAudio() {
  const fileInput = document.getElementById('q-audio-file');
  if (!fileInput.files.length) return;
  const url = URL.createObjectURL(fileInput.files[0]);
  const audioPreview = document.getElementById('q-audio-preview');
  audioPreview.src = url;
  document.getElementById('audio-preview-wrap').classList.remove('hidden');
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
    subject_id:       document.getElementById('q-subject').value,
    type:             document.getElementById('q-type').value,
    difficulty:       document.getElementById('q-difficulty').value,
    grade_level:      document.getElementById('q-grade-level').value,
    content:          document.getElementById('q-content').value.trim(),
    option_a:         document.getElementById('q-opt-a').value.trim(),
    option_b:         document.getElementById('q-opt-b').value.trim(),
    option_c:         document.getElementById('q-opt-c').value.trim(),
    option_d:         document.getElementById('q-opt-d').value.trim(),
    answer:           document.getElementById('q-answer').value.trim(),
    explanation:      document.getElementById('q-explanation').value.trim(),
    source:           document.getElementById('q-source').value.trim(),
    tags:             document.getElementById('q-tags').value.trim(),
    audio_url:        document.getElementById('q-audio-url').value.trim() || null,
    audio_transcript: document.getElementById('q-audio-transcript').value.trim() || null,
  };
  if (!body.content || !body.answer) { alert('請填寫題目內容與正確答案'); return; }
  if (body.type === 'listening' && !body.audio_url) { alert('聽力題必須填寫音訊 URL 或先上傳音訊檔案'); return; }
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
  const g = document.getElementById('eq-grade').value;
  const d = document.getElementById('eq-diff').value;
  if (s) params.set('subject_id', s);
  if (g) params.set('grade_level', g);
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
  const g    = document.getElementById('rand-grade').value;
  const t    = document.getElementById('rand-type').value;
  const dMin = document.getElementById('rand-diff-min').value;
  const dMax = document.getElementById('rand-diff-max').value;
  const cnt  = parseInt(document.getElementById('rand-count').value) || 10;
  const weighted = document.getElementById('rand-weighted')?.checked;
  if (s)    params.set('subject_id', s);
  if (g)    params.set('grade_level', g);
  if (t)    params.set('type', t);
  if (dMin) params.set('difficulty_min', dMin);
  if (dMax) params.set('difficulty_max', dMax);
  params.set('count', cnt);
  if (weighted) params.set('weighted', '1');
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

// ── ai-generate.html ────────────────────────────────────────────────────────
const aiGenerateHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 出題 - 數理資優班考題系統</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>MathJax = { tex: { inlineMath: [['$','$'],['\\\\(','\\\\)']], displayMath: [['$$','$$'],['\\\\[','\\\\]']] } };</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script" async></script>
<style>body{font-family:'Noto Sans TC',sans-serif;}</style>
</head>
<body class="bg-gray-50 min-h-screen">
<header class="bg-indigo-700 text-white py-4 px-6 shadow">
  <div class="max-w-5xl mx-auto flex items-center gap-3">
    <a href="/" class="text-indigo-200 hover:text-white">🏠</a>
    <span class="text-lg font-bold">🤖 AI 智慧出題</span>
  </div>
</header>
<main class="max-w-5xl mx-auto px-4 py-8">

  <!-- API Key 設定說明 -->
  <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
    <div class="flex items-start gap-3">
      <span class="text-xl mt-0.5">🔑</span>
      <div class="flex-1">
        <p class="font-semibold text-amber-800 mb-1">使用前請先在伺服器設定 LLM API Key</p>
        <p class="text-sm text-amber-700 mb-2">AI 出題功能需要在伺服器端的 <code class="bg-amber-100 px-1 rounded font-mono">.env</code> 檔案中設定 API Key，並重新啟動伺服器。<strong>前端頁面上的「管理員金鑰」欄位是後台驗證用，與 LLM 金鑰無關。</strong></p>
        <details class="text-sm text-amber-700">
          <summary class="cursor-pointer font-medium hover:text-amber-900">📋 展開設定說明</summary>
          <div class="mt-2 space-y-1 pl-2 border-l-2 border-amber-300">
            <p>1. 在系統資料夾中找到 <code class="bg-amber-100 px-1 rounded font-mono">.env</code> 檔案（若不存在請複製 <code class="bg-amber-100 px-1 rounded font-mono">.env.example</code>）</p>
            <p>2. 依選用的服務填入對應金鑰：</p>
            <ul class="ml-4 mt-1 space-y-0.5 list-disc">
              <li><strong>OpenAI</strong>（GPT-4o-mini）：<code class="bg-amber-100 px-1 rounded font-mono">OPENAI_API_KEY=sk-...</code></li>
              <li><strong>Google Gemini</strong>：<code class="bg-amber-100 px-1 rounded font-mono">GEMINI_API_KEY=AIza...</code></li>
              <li><strong>Anthropic Claude</strong>：<code class="bg-amber-100 px-1 rounded font-mono">ANTHROPIC_API_KEY=sk-ant-...</code></li>
            </ul>
            <p>3. 儲存 <code class="bg-amber-100 px-1 rounded font-mono">.env</code> 後，重新啟動伺服器（<code class="bg-amber-100 px-1 rounded font-mono">start.bat</code>）即可使用</p>
          </div>
        </details>
      </div>
    </div>
  </div>

  <!-- 設定面板 -->
  <div class="bg-white rounded-xl shadow p-6 mb-6">
    <h2 class="text-lg font-bold text-gray-700 mb-4">出題設定</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">LLM 提供者</label>
        <select id="provider" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="openai">OpenAI (GPT-4o-mini)</option>
          <option value="gemini" selected>Google Gemini 2.5 Flash</option>
          <option value="claude">Anthropic Claude 3.5 Haiku</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">學段</label>
        <select id="grade_level" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" onchange="loadSubjects()">
          <option value="junior_high">升國中（資優班）</option>
          <option value="elementary_6">國小六年級</option>
          <option value="grade_7">國一（七年級）</option>
          <option value="grade_8">國二（八年級）</option>
          <option value="grade_9">國三（九年級）</option>
          <option value="bctest">國中教育會考</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">科目</label>
        <select id="subject_id" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"></select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">題型</label>
        <select id="type" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="choice">單選題</option>
          <option value="fill">填空題</option>
          <option value="calculation">計算題</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">難度（1–5）</label>
        <select id="difficulty" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="1">1 – 基礎</option>
          <option value="2">2 – 初級</option>
          <option value="3" selected>3 – 中等</option>
          <option value="4">4 – 偏難</option>
          <option value="5">5 – 挑戰</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">題數</label>
        <input id="count" type="number" min="1" max="20" value="5" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
      </div>

      <div class="md:col-span-2 lg:col-span-3">
        <label class="block text-sm font-medium text-gray-600 mb-1">自訂提示（選填，例如：著重二次方程式、避免文字題）</label>
        <input id="hint" type="text" placeholder="可補充出題範圍或特殊要求…" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">管理員金鑰（若伺服器有設定）</label>
        <input id="api_key" type="password" placeholder="x-api-key" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
      </div>

    </div>
    <div class="mt-5 flex gap-3 flex-wrap">
      <button onclick="generate()" id="btn-generate"
        class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2">
        <span id="btn-icon">✨</span> <span id="btn-text">開始出題</span>
      </button>
      <button onclick="saveSelected()" id="btn-save"
        class="hidden bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors">
        💾 儲存勾選的題目（<span id="save-count">0</span>）
      </button>
    </div>
  </div>

  <!-- 錯誤訊息 -->
  <div id="error-box" class="hidden bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6"></div>

  <!-- 成功訊息 -->
  <div id="success-box" class="hidden bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-6"></div>

  <!-- 預覽區域 -->
  <div id="preview-area"></div>

</main>
<script>
let generatedQuestions = [];

async function loadSubjects() {
  const grade = document.getElementById('grade_level').value;
  const res = await fetch('/api/subjects?grade_level=' + grade);
  const subjects = await res.json();
  const sel = document.getElementById('subject_id');
  sel.innerHTML = subjects.map(s => \`<option value="\${s.id}">\${s.name}</option>\`).join('');
}

async function generate() {
  const btn = document.getElementById('btn-generate');
  const btnText = document.getElementById('btn-text');
  const btnIcon = document.getElementById('btn-icon');
  btn.disabled = true;
  btnIcon.textContent = '⏳';
  btnText.textContent = '生成中…';
  document.getElementById('error-box').classList.add('hidden');
  document.getElementById('success-box').classList.add('hidden');

  const payload = {
    provider:    document.getElementById('provider').value,
    subject_id:  parseInt(document.getElementById('subject_id').value),
    type:        document.getElementById('type').value,
    difficulty:  parseInt(document.getElementById('difficulty').value),
    count:       parseInt(document.getElementById('count').value),
    grade_level: document.getElementById('grade_level').value,
    hint:        document.getElementById('hint').value.trim()
  };
  const headers = { 'Content-Type': 'application/json' };
  const key = document.getElementById('api_key').value.trim();
  if (key) headers['x-api-key'] = key;

  try {
    const res = await fetch('/api/generate/questions', { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '生成失敗');
    generatedQuestions = data.questions;
    renderPreview(generatedQuestions);
    document.getElementById('btn-save').classList.remove('hidden');
  } catch(e) {
    const box = document.getElementById('error-box');
    const isKeyMissing = e.message.includes('未設定');
    if (isKeyMissing) {
      const providerName = {openai:'OpenAI', gemini:'Google Gemini', claude:'Anthropic Claude'}[document.getElementById('provider').value] || '';
      box.innerHTML = \`<p class="font-semibold mb-2">❌ \${e.message}</p>
        <p class="text-sm">請在伺服器端的 <code class="bg-red-100 px-1 rounded font-mono">.env</code> 檔案中設定 <strong>\${providerName}</strong> 的 API Key，然後重新啟動伺服器（start.bat）。</p>
        <p class="text-sm mt-1">詳細說明請參閱頁面頂端的「🔑 使用前請先在伺服器設定 LLM API Key」提示框。</p>\`;
    } else {
      box.textContent = '❌ ' + e.message;
    }
    box.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btnIcon.textContent = '✨';
    btnText.textContent = '重新出題';
  }
}

function renderPreview(questions) {
  const area = document.getElementById('preview-area');
  if (!questions.length) { area.innerHTML = '<p class="text-gray-400 text-center py-8">沒有生成任何題目</p>'; return; }
  const typeMap = {choice:'選擇題', fill:'填空題', calculation:'計算題'};
  area.innerHTML = questions.map((q, i) => \`
    <div class="bg-white rounded-xl shadow p-5 mb-4 border-l-4 border-indigo-400">
      <div class="flex items-start gap-3">
        <input type="checkbox" id="chk-\${i}" checked onchange="updateSaveCount()"
          class="mt-1 w-4 h-4 accent-indigo-600 flex-shrink-0">
        <div class="flex-1">
          <div class="flex gap-2 mb-2 flex-wrap">
            <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">\${q.subject_name}</span>
            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">\${typeMap[q.type]||q.type}</span>
            <span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">難度 \${q.difficulty}</span>
          </div>
          <p class="font-medium text-gray-800 mb-2 whitespace-pre-wrap" contenteditable="true"
            onblur="generatedQuestions[\${i}].content=this.innerText">\${escHtml(q.content)}</p>
          \${q.option_a ? \`
          <div class="grid grid-cols-2 gap-1 mb-2 text-sm">
            \${['a','b','c','d'].map(opt => q['option_'+opt] ? \`
              <div class="flex gap-1 items-start">
                <span class="font-bold text-indigo-600 uppercase">\${opt}.</span>
                <span contenteditable="true" onblur="generatedQuestions[\${i}]['option_'+'\${opt}']=this.innerText">\${escHtml(q['option_'+opt])}</span>
              </div>\` : '').join('')}
          </div>\` : ''}
          <div class="text-sm flex gap-4 flex-wrap mt-1">
            <span>✅ 答案：<strong contenteditable="true" onblur="generatedQuestions[\${i}].answer=this.innerText">\${escHtml(q.answer)}</strong></span>
            \${q.explanation ? \`<span class="text-gray-500">💡 <span contenteditable="true" onblur="generatedQuestions[\${i}].explanation=this.innerText">\${escHtml(q.explanation)}</span></span>\` : ''}
          </div>
          \${q.tags ? \`<p class="text-xs text-gray-400 mt-1">🏷 \${escHtml(q.tags)}</p>\` : ''}
        </div>
      </div>
    </div>
  \`).join('');
  updateSaveCount();
  if (window.MathJax) MathJax.typesetPromise([area]);
}

function updateSaveCount() {
  let count = 0;
  generatedQuestions.forEach((_, i) => {
    if (document.getElementById('chk-' + i)?.checked) count++;
  });
  document.getElementById('save-count').textContent = count;
}

async function saveSelected() {
  const key = document.getElementById('api_key').value.trim();
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers['x-api-key'] = key;

  const toSave = generatedQuestions.filter((_, i) => document.getElementById('chk-' + i)?.checked);
  if (!toSave.length) { alert('請至少勾選一道題目'); return; }

  try {
    const res = await fetch('/api/questions/batch', { method: 'POST', headers, body: JSON.stringify({ questions: toSave }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '儲存失敗');
    const box = document.getElementById('success-box');
    box.textContent = '✅ ' + data.message;
    box.classList.remove('hidden');
    document.getElementById('btn-save').classList.add('hidden');
    generatedQuestions.forEach((_, i) => {
      const chk = document.getElementById('chk-' + i);
      if (chk) chk.disabled = true;
    });
  } catch(e) {
    const box = document.getElementById('error-box');
    box.textContent = '❌ ' + e.message;
    box.classList.remove('hidden');
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadSubjects();
</script>
</body>
</html>`;

const analysisHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>答題分析報告 - 數理資優班考題系統</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{font-family:'Noto Sans TC',sans-serif;}</style>
</head>
<body class="bg-gray-50 min-h-screen">
<header class="bg-emerald-700 text-white py-4 px-6 shadow">
  <div class="max-w-4xl mx-auto flex items-center gap-3">
    <a href="/" class="text-emerald-200 hover:text-white">🏠</a>
    <span class="text-lg font-bold">📊 答題分析報告</span>
  </div>
</header>
<main class="max-w-4xl mx-auto px-4 py-8" id="analysis-container">
  <div class="text-center py-16 text-gray-500">載入中...</div>
</main>
<script>
const id = new URLSearchParams(location.search).get('id');
function getOptionLabel(q, letter) {
  if (!letter) return '（未作答）';
  const map = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };
  const text = map[letter.toUpperCase()];
  return text ? letter.toUpperCase() + '. ' + text : letter.toUpperCase();
}

async function loadAnalysis() {
  const res = await fetch('/api/submissions/' + id + '/analysis');
  if (!res.ok) {
    document.getElementById('analysis-container').innerHTML = '<p class="text-center py-16 text-red-500">找不到分析資料</p>';
    return;
  }
  const d = await res.json();
  const pct = d.percentage;
  const pctColor = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';
  const pctBg    = pct >= 80 ? 'bg-green-50 border-green-200' : pct >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
  const diffLabel = {1:'★ 入門',2:'★★ 基礎',3:'★★★ 中級',4:'★★★★ 進階',5:'★★★★★ 競賽'};

  // 科目進度條
  const subjectBars = Object.entries(d.by_subject).map(([name, v]) => {
    const rate = v.total ? Math.round(v.correct * 100 / v.total) : 0;
    const barColor = rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-400' : 'bg-red-400';
    return \`
      <div class="mb-3">
        <div class="flex justify-between text-sm mb-1">
          <span class="font-medium text-gray-700">\${name}</span>
          <span class="text-gray-500">\${v.correct}/\${v.total} 題答對（\${rate}%）</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3">
          <div class="\${barColor} h-3 rounded-full transition-all" style="width:\${rate}%"></div>
        </div>
      </div>
    \`;
  }).join('');

  // 難度分布
  const diffRows = Object.entries(d.by_difficulty)
    .filter(([, v]) => v.total > 0)
    .map(([diff, v]) => {
      const rate = Math.round(v.correct * 100 / v.total);
      const c = rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600';
      return \`
        <tr class="border-b border-gray-100">
          <td class="px-4 py-2 text-sm text-gray-700">\${diffLabel[diff]||diff}</td>
          <td class="px-4 py-2 text-sm text-center">\${v.total}</td>
          <td class="px-4 py-2 text-sm text-center text-green-600">\${v.correct}</td>
          <td class="px-4 py-2 text-sm text-center text-red-500">\${v.wrong}</td>
          <td class="px-4 py-2 text-sm text-center font-bold \${c}">\${rate}%</td>
        </tr>
      \`;
    }).join('');

  // 弱點題目
  const weakHtml = d.weak_questions.length ? d.weak_questions.map((q, i) => \`
    <div class="bg-white rounded-xl shadow p-5 border-l-4 border-red-400 mb-3">
      <div class="flex justify-between mb-2">
        <span class="text-sm font-medium text-gray-500">第 \${i+1} 題 · \${q.subject_name} · \${'★'.repeat(q.difficulty||1)}</span>
        <span class="text-xs text-red-500">✗ 答錯</span>
      </div>
      <p class="text-gray-800 mb-2">\${q.content}</p>
      <div class="text-sm space-y-1">
        \${q.type==='choice'?[\`<p>你的答案：<span class="text-red-500 font-medium">\${getOptionLabel(q, q.given_answer)}</span></p>\`,\`<p>正確答案：<span class="text-green-600 font-medium">\${getOptionLabel(q, q.correct_answer)}</span></p>\`].join(''):\`<p>你的答案：<span class="text-red-500 font-medium">\${q.given_answer||'（未作答）'}</span></p><p>正確答案：<span class="text-green-600 font-medium">\${q.correct_answer}</span></p>\`}
        \${q.explanation ? \`<p class="text-gray-500 mt-2 bg-gray-50 p-2 rounded">💡 \${q.explanation}</p>\` : ''}
      </div>
    </div>
  \`).join('') : '<p class="text-gray-400 text-center py-4">🎉 全部答對，沒有弱點題目！</p>';

  document.getElementById('analysis-container').innerHTML = \`
    <!-- 頂部概覽 -->
    <div class="bg-white rounded-2xl shadow-lg p-8 mb-6 \${pctBg} border">
      <div class="text-center mb-4">
        <h2 class="text-2xl font-bold text-gray-800 mb-1">\${d.student_name} 的答題分析報告</h2>
        <p class="text-gray-500 text-sm">\${d.exam_title} ｜ \${d.submitted_at}</p>
      </div>
      <div class="flex justify-center gap-12 mt-6">
        <div class="text-center">
          <div class="text-5xl font-bold \${pctColor}">\${pct}%</div>
          <p class="text-gray-500 text-sm mt-1">得分率</p>
        </div>
        <div class="text-center">
          <div class="text-4xl font-bold text-gray-700">\${d.score}/\${d.total_score}</div>
          <p class="text-gray-500 text-sm mt-1">得分</p>
        </div>
        <div class="text-center">
          <div class="text-4xl font-bold text-green-600">\${d.correct_count}</div>
          <p class="text-gray-500 text-sm mt-1">答對</p>
        </div>
        <div class="text-center">
          <div class="text-4xl font-bold text-red-500">\${d.wrong_count}</div>
          <p class="text-gray-500 text-sm mt-1">答錯</p>
        </div>
      </div>
    </div>

    <!-- 科目表現 -->
    <div class="bg-white rounded-2xl shadow p-6 mb-6">
      <h3 class="text-lg font-bold text-gray-800 mb-4">📚 各科目表現</h3>
      \${subjectBars || '<p class="text-gray-400">無科目資料</p>'}
    </div>

    <!-- 難度分布 -->
    <div class="bg-white rounded-2xl shadow p-6 mb-6">
      <h3 class="text-lg font-bold text-gray-800 mb-4">🎯 難度分布</h3>
      \${diffRows ? \`
        <table class="w-full">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-2 text-left">難度</th>
              <th class="px-4 py-2 text-center">共</th>
              <th class="px-4 py-2 text-center">答對</th>
              <th class="px-4 py-2 text-center">答錯</th>
              <th class="px-4 py-2 text-center">正確率</th>
            </tr>
          </thead>
          <tbody>\${diffRows}</tbody>
        </table>
      \` : '<p class="text-gray-400">無難度資料</p>'}
    </div>

    <!-- 學習建議 -->
    <div class="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
      <h3 class="text-lg font-bold text-blue-800 mb-3">💡 學習建議</h3>
      \${d.suggestions.map(s => \`<p class="text-blue-700 mb-1">• \${s}</p>\`).join('')}
    </div>

    <!-- 能力估算（Rasch Model） -->
    \${d.ability_profile && d.ability_profile.length ? \`
    <div class="bg-white rounded-2xl shadow p-6 mb-6">
      <h3 class="text-lg font-bold text-gray-800 mb-1">🧠 能力估算</h3>
      <p class="text-xs text-gray-400 mb-4">以 Rasch IRT 模型依本次作答估算各科能力值（1–5）。樣本數越多越準確。</p>
      \${d.ability_profile.map(p => {
        const pct = p.ability !== null ? Math.round((p.ability - 1) / 4 * 100) : 0;
        const c = p.ability >= 4 ? 'bg-green-500' : p.ability >= 2.5 ? 'bg-yellow-400' : 'bg-red-400';
        const tc = p.ability >= 4 ? 'text-green-600' : p.ability >= 2.5 ? 'text-yellow-600' : 'text-red-500';
        return \`<div class="mb-3">
          <div class="flex justify-between text-sm mb-1">
            <span class="font-medium text-gray-700">\${p.subject_name}</span>
            <span class="font-bold \${tc}">\${p.ability !== null ? p.ability + ' / 5' : '資料不足'} <span class="text-xs font-normal text-gray-400">(\${p.sample_size} 題)</span></span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="\${c} h-3 rounded-full transition-all" style="width:\${pct}%"></div>
          </div>
        </div>\`;
      }).join('')}
      <div class="mt-3 pt-3 border-t flex justify-between items-center">
        <span class="text-sm text-gray-600">綜合能力值</span>
        <span class="text-2xl font-bold \${d.overall_ability >= 4 ? 'text-green-600' : d.overall_ability >= 2.5 ? 'text-yellow-600' : 'text-red-500'}">\${d.overall_ability !== null ? d.overall_ability + ' / 5' : '—'}</span>
      </div>
    </div>
    \` : ''}

    <!-- 弱點題目清單 -->
    <div class="mb-6">
      <h3 class="text-lg font-bold text-gray-800 mb-4">🔍 弱點題目（答錯題目詳析）</h3>
      \${weakHtml}
    </div>

    <!-- 底部按鈕 -->
    <div class="mt-6 flex gap-4 justify-center">
      <a href="/result.html?id=\${id}" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">← 返回成績頁</a>
      <a href="/exam-list.html" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">返回考試列表</a>
    </div>
  \`;
}

loadAnalysis();
</script>
</body>
</html>`;

const files = {
  'public/index.html':       indexHtml,
  'public/exam-list.html':   examListHtml,
  'public/exam.html':        examHtml,
  'public/result.html':      resultHtml,
  'public/admin.html':       adminHtml,
  'public/results.html':     resultsHtml,
  'public/ai-generate.html': aiGenerateHtml,
  'public/analysis.html':    analysisHtml,
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(filepath, content, 'utf8');
  console.log('✅ 產生', filepath);
}
console.log('\n✅ 所有前端檔案已產生完成！');
