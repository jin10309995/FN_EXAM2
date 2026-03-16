/**
 * seed_math_e_to_500.js
 * 補充國小六年級數學（MATH_E）題目至 500 題
 * 使用 OpenAI gpt-4o-mini，分主題批次生成，三層防重覆。
 */
require('dotenv').config();
const db = require('./database.js');
const { generateQuestions } = require('./llm.js');

// 直接呼叫 Gemini（支援指定 model，用於切換備用模型）
async function generateQuestionsGemini(model, userPrompt) {
  require('dotenv').config();
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const SYSTEM_PROMPT = `你是一位專業的臺灣國小六年級數學出題老師，負責出高品質的繁體中文考題。
請根據使用者的要求，輸出指定數量的題目，格式為 JSON 陣列，每個物件包含以下欄位：
- content: 題目內容（字串，必填）
- option_a, option_b, option_c, option_d: 選項（字串，僅選擇題填寫，其他題型留 null）
- answer: 答案（選擇題填 A/B/C/D，填空題填標準答案字串，是非題填 T 或 F）
- explanation: 詳解（字串）
- tags: 關鍵字標籤，以逗號分隔
只輸出純 JSON 陣列，不要有任何前後文說明。`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const m = genAI.getGenerativeModel({
    model,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.8 }
  });
  const result = await m.generateContent(`${SYSTEM_PROMPT}\n\n${userPrompt}`);
  const raw = result.response.text();
  // 解析 JSON
  let parsed;
  try { parsed = JSON.parse(raw); } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('無法解析 JSON');
    parsed = JSON.parse(match[0]);
  }
  if (Array.isArray(parsed)) return parsed;
  const arr = Object.values(parsed).find(v => Array.isArray(v));
  if (arr) return arr;
  throw new Error('回傳格式不符');
}


const TARGET = 500;
const PROVIDER = 'gemini';
const GRADE = 'elementary_6';

// 取得 MATH_E subject_id
const subject = db.prepare("SELECT id, name FROM subjects WHERE code = 'MATH_E'").get();
if (!subject) { console.error('找不到 MATH_E 科目'); process.exit(1); }
const SID = subject.id;

// 正規化比對（與 server.js 保持一致）
function normalizeContent(s) {
  return String(s || '')
    .replace(/\$+/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[^\u4e00-\u9fffa-z0-9]+/gi, '')
    .toLowerCase()
    .trim();
}

// 讀取現有題目 content（用於 prompt 提示與去重）
function getExistingContents() {
  return db.prepare('SELECT content FROM questions WHERE subject_id=? AND is_archived=0').all(SID);
}

function getCurrentCount() {
  return db.prepare('SELECT COUNT(*) as n FROM questions WHERE subject_id=? AND is_archived=0').get(SID).n;
}

// 插入一批題目，回傳實際插入數
const insertQ = db.prepare(`
  INSERT OR IGNORE INTO questions
    (subject_id, type, difficulty, content, option_a, option_b, option_c, option_d,
     answer, explanation, tags, grade_level)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function insertBatch(questions, difficulty, type) {
  let inserted = 0;
  const existing = new Set(getExistingContents().map(r => normalizeContent(r.content)));

  for (const q of questions) {
    if (!q.content || !q.answer) continue;
    const nc = normalizeContent(q.content);
    if (!nc || existing.has(nc)) continue;

    const r = insertQ.run(
      SID, type, difficulty,
      q.content,
      q.option_a || null, q.option_b || null, q.option_c || null, q.option_d || null,
      String(q.answer),
      q.explanation || null,
      q.tags || null,
      GRADE
    );
    if (r.changes > 0) {
      existing.add(nc);
      inserted++;
    }
  }
  return inserted;
}

// 主題批次定義
const BATCHES = [
  { topic: '整數四則運算生活應用題，例如購物找錢、分配物品等文字題', type: 'choice', difficulty: 3, count: 10 },
  { topic: '整數四則運算生活應用題（填空形式），例如計算總價、剩餘數量', type: 'fill', difficulty: 2, count: 10 },
  { topic: '質因數分解、互質概念、最大公因數與最小公倍數進階應用', type: 'choice', difficulty: 3, count: 10 },
  { topic: '因數倍數進階應用填空題（質因數分解、互質判斷）', type: 'fill', difficulty: 3, count: 8 },
  { topic: '分數生活情境應用題（蛋糕分配、水量計算等），含帶分數與假分數互換', type: 'choice', difficulty: 3, count: 10 },
  { topic: '分數應用填空題（生活情境、比較大小、通分）', type: 'fill', difficulty: 3, count: 10 },
  { topic: '小數生活應用題（金錢找零、長度測量、體重比較）', type: 'choice', difficulty: 3, count: 8 },
  { topic: '小數應用填空題（金錢、測量、小數與分數互換）', type: 'fill', difficulty: 3, count: 8 },
  { topic: '百分比進階應用（折扣計算、利率、增加或減少百分之幾）', type: 'choice', difficulty: 3, count: 8 },
  { topic: '百分比與折扣應用填空題（售價、成本、獲利百分比）', type: 'fill', difficulty: 4, count: 8 },
  { topic: '比與比例進階應用（比例分配、等比例縮放、地圖比例尺）', type: 'choice', difficulty: 3, count: 8 },
  { topic: '比與比例填空題（比例方程式、地圖比例尺計算）', type: 'fill', difficulty: 4, count: 8 },
  { topic: '梯形面積計算、複合圖形（長方形加三角形、L形）面積', type: 'choice', difficulty: 3, count: 10 },
  { topic: '複合圖形面積與周長填空題（含梯形、半圓、不規則多邊形）', type: 'fill', difficulty: 4, count: 8 },
  { topic: '長方體表面積計算、體積應用（容量換算）', type: 'choice', difficulty: 3, count: 8 },
  { topic: '體積與表面積填空題（長方體、正方體展開圖）', type: 'fill', difficulty: 4, count: 6 },
  { topic: '速度、時間、距離三者關係應用題（相向而行、追趕問題）', type: 'choice', difficulty: 3, count: 8 },
  { topic: '速度與距離填空題（出發時間、到達時間、路程計算）', type: 'fill', difficulty: 4, count: 6 },
  { topic: '折線圖、長條圖、圓餅圖判讀與統計量（平均數、中位數）應用題', type: 'choice', difficulty: 3, count: 8 },
  { topic: '統計圖表判讀是非題（折線圖趨勢、長條圖比較）', type: 'true_false', difficulty: 2, count: 8 },
  { topic: '等差數列規律、圖形規律（幾何圖形個數）應用題', type: 'choice', difficulty: 3, count: 8 },
  { topic: '數型規律與數列填空題（找出規律、第幾項是多少）', type: 'fill', difficulty: 4, count: 6 },
  { topic: '單位換算綜合應用（公里公尺、公斤公克、公升毫升混合題）', type: 'choice', difficulty: 2, count: 8 },
  { topic: '時間計算應用題（經過時間、開始到結束、時差）', type: 'choice', difficulty: 2, count: 6 },
  { topic: '時間計算填空題（時分秒換算、跨日計算）', type: 'fill', difficulty: 3, count: 6 },
  { topic: '邏輯推理與綜合應用題（多步驟文字題、排列組合入門）', type: 'choice', difficulty: 4, count: 6 },
  { topic: '邏輯推理是非題（條件判斷、等量關係的真假）', type: 'true_false', difficulty: 3, count: 6 },
  { topic: '各主題難度 4–5 的進階是非題（分數不等式、幾何性質、百分比判斷）', type: 'true_false', difficulty: 4, count: 8 },
];

async function main() {
  let current = getCurrentCount();
  console.log(`\n📊 MATH_E 現有題數：${current} / ${TARGET}`);
  if (current >= TARGET) {
    console.log('✅ 已達目標，無需補充。');
    return;
  }

  // 已有題目的前綴清單（給 prompt 參考）
  const existingSamples = db.prepare(
    'SELECT content FROM questions WHERE subject_id=? AND is_archived=0 ORDER BY id LIMIT 60'
  ).all(SID).map(r => r.content.substring(0, 30)).join('、');

  let totalInserted = 0;

  for (const batch of BATCHES) {
    current = getCurrentCount();
    if (current >= TARGET) break;

    const need = TARGET - current;
    const count = Math.min(batch.count, need + 5); // 多生成一點以補重覆損耗

    const typeLabel = { choice: '選擇題', fill: '填空題', true_false: '是非題' }[batch.type] || batch.type;
    console.log(`\n🔄 [${typeLabel} 難度${batch.difficulty}] ${batch.topic.substring(0, 40)}...`);

    const prompt = `請出 ${count} 題國小六年級數學${typeLabel}，難度 ${batch.difficulty}/5。
主題：${batch.topic}。
要求：
- 題目內容必須與以下已有題目不同（不要出現重覆題目）：${existingSamples.substring(0, 300)}
- 每題數字、情境都要有所不同，不要出現雷同題目
- 使用自然繁體中文，不要 LaTeX 或特殊符號
- 數學式改寫成可讀文字，例如「3乘以4」、「x平方加5」
${batch.type === 'true_false' ? '- 是非題：answer 只能填 T 或 F，不需要選項' : ''}
${batch.type === 'choice' ? '- 選擇題：必須提供完整四個選項 A/B/C/D' : ''}
${batch.type === 'fill' ? '- 填空題：answer 填標準答案，不需要選項' : ''}`;

    try {
      const questions = await generateQuestionsGemini('gemini-2.0-flash-lite', prompt);
      const inserted = insertBatch(questions, batch.difficulty, batch.type);
      totalInserted += inserted;
      current = getCurrentCount();
      console.log(`   ✅ 生成 ${questions.length} 題，插入 ${inserted} 題，累計：${current}/${TARGET}`);
    } catch (err) {
      console.error(`   ❌ 失敗：${err.message}`);
    }

    // 避免 rate limit
    await new Promise(r => setTimeout(r, 1200));
  }

  const final = getCurrentCount();
  console.log(`\n🎉 完成！MATH_E 最終題數：${final} / ${TARGET}`);
  if (final < TARGET) {
    console.log(`⚠️  仍差 ${TARGET - final} 題，可再次執行此腳本繼續補充。`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
