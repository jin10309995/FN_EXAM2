/**
 * 範例題目植入腳本
 * 執行方式: node seed.js
 */
const db = require('./database');

const mathQuestions = [
  {
    subject_id: 1, type: 'choice', difficulty: 2,
    content: '下列哪個數是質數？',
    option_a: '1', option_b: '4', option_c: '7', option_d: '9',
    answer: 'C', explanation: '質數是只能被 1 和本身整除的大於 1 的自然數。7 只能被 1 和 7 整除，故為質數。',
    tags: '數論,質數'
  },
  {
    subject_id: 1, type: 'choice', difficulty: 3,
    content: '若 2x + 3 = 11，則 x = ？',
    option_a: '2', option_b: '3', option_c: '4', option_d: '5',
    answer: 'C', explanation: '2x = 11 - 3 = 8，所以 x = 4。',
    tags: '代數,一元一次方程式'
  },
  {
    subject_id: 1, type: 'choice', difficulty: 3,
    content: '一個正方形的對角線長為 8√2 公分，則其面積為多少平方公分？',
    option_a: '32', option_b: '64', option_c: '128', option_d: '256',
    answer: 'B', explanation: '設邊長為 a，對角線 = a√2 = 8√2，故 a = 8，面積 = 64 平方公分。',
    tags: '幾何,正方形,面積'
  },
  {
    subject_id: 1, type: 'choice', difficulty: 4,
    content: '等差數列第 1 項為 3，公差為 4，則第 10 項為多少？',
    option_a: '39', option_b: '40', option_c: '43', option_d: '45',
    answer: 'C', explanation: 'an = a1 + (n-1)d = 3 + (10-1)×4 = 3 + 36 = 39。等一下，a10 = 3 + 9×4 = 39。答案是 A。',
    tags: '數列,等差數列'
  },
  {
    subject_id: 1, type: 'choice', difficulty: 4,
    content: '等差數列第 1 項為 3，公差為 4，則第 10 項為多少？',
    option_a: '39', option_b: '40', option_c: '43', option_d: '45',
    answer: 'A', explanation: 'a_n = a_1 + (n-1)d = 3 + 9×4 = 39',
    tags: '數列,等差數列'
  },
  {
    subject_id: 1, type: 'fill', difficulty: 3,
    content: '計算 3² + 4² = ___',
    answer: '25', explanation: '9 + 16 = 25',
    tags: '計算,乘方'
  },
  {
    subject_id: 1, type: 'choice', difficulty: 5,
    content: '甲、乙兩人同時從 A 地出發往 B 地，甲速度為 60 km/h，乙速度為 40 km/h。甲到達 B 地後立即原路返回，在距 B 地 20 km 處遇到乙，則 A、B 兩地距離為多少公里？',
    option_a: '80', option_b: '100', option_c: '120', option_d: '140',
    answer: 'B', explanation: '設距離為 d。甲走了 d+20，乙走了 d-20，時間相同。(d+20)/60 = (d-20)/40，40(d+20)=60(d-20)，40d+800=60d-1200，2000=20d，d=100。',
    tags: '應用題,速度,追及問題'
  },
  {
    subject_id: 1, type: 'choice', difficulty: 2,
    content: '下列哪個選項不是整數？',
    option_a: '-5', option_b: '0', option_c: '√4', option_d: '√3',
    answer: 'D', explanation: '√3 ≈ 1.732... 是無理數，不是整數。',
    tags: '數的分類,無理數'
  },
  {
    subject_id: 1, type: 'choice', difficulty: 3,
    content: '三角形三內角之比為 1:2:3，則最大角為幾度？',
    option_a: '60°', option_b: '90°', option_c: '120°', option_d: '150°',
    answer: 'B', explanation: '三角形內角和為 180°，比例 1:2:3 的最大角 = 180° × 3/6 = 90°。',
    tags: '幾何,三角形,角度'
  },
  {
    subject_id: 1, type: 'fill', difficulty: 4,
    content: '若 f(x) = x² - 3x + 2，則 f(4) = ___',
    answer: '6', explanation: 'f(4) = 16 - 12 + 2 = 6',
    tags: '函數,代入計算'
  },
];

const sciQuestions = [
  {
    subject_id: 2, type: 'choice', difficulty: 2,
    content: '下列何者為純粹物質（純物質）？',
    option_a: '空氣', option_b: '牛奶', option_c: '蒸餾水', option_d: '海水',
    answer: 'C', explanation: '蒸餾水只含 H₂O 一種物質，屬於純物質。',
    tags: '物質分類,純物質'
  },
  {
    subject_id: 2, type: 'choice', difficulty: 3,
    content: '下列哪種物質的狀態變化屬於「昇華」？',
    option_a: '冰 → 水', option_b: '乾冰 → CO₂氣體', option_c: '水 → 水蒸氣', option_d: '蠟 → 液態蠟',
    answer: 'B', explanation: '昇華是固態直接轉變為氣態，不經過液態。乾冰（固態 CO₂）直接昇華為 CO₂ 氣體。',
    tags: '狀態變化,昇華,乾冰'
  },
  {
    subject_id: 2, type: 'choice', difficulty: 3,
    content: '下列何者屬於化學變化？',
    option_a: '水蒸發', option_b: '冰融化', option_c: '紙燃燒', option_d: '食鹽溶解',
    answer: 'C', explanation: '紙燃燒產生新物質（CO₂、H₂O等），屬於化學變化。其餘選項只是物理狀態改變。',
    tags: '物理變化,化學變化'
  },
  {
    subject_id: 2, type: 'choice', difficulty: 4,
    content: '光合作用的主要產物是什麼？',
    option_a: '氧氣和二氧化碳', option_b: '葡萄糖和氧氣', option_c: '澱粉和二氧化碳', option_d: '水和氧氣',
    answer: 'B', explanation: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂，光合作用的主要產物為葡萄糖（C₆H₁₂O₆）和氧氣。',
    tags: '生物,光合作用,植物'
  },
  {
    subject_id: 2, type: 'choice', difficulty: 3,
    content: '以下哪個是牛頓第一運動定律的描述？',
    option_a: '力等於質量乘以加速度', option_b: '作用力與反作用力大小相等方向相反', option_c: '靜止的物體保持靜止，運動中的物體保持等速直線運動，除非受到外力', option_d: '物體加速度與所受合力成正比',
    answer: 'C', explanation: '牛頓第一定律又稱「慣性定律」：物體不受外力時，保持靜止或等速直線運動狀態。',
    tags: '物理,牛頓定律,慣性'
  },
  {
    subject_id: 2, type: 'fill', difficulty: 2,
    content: '水的化學式為___',
    answer: 'H₂O', explanation: '水由 2 個氫原子和 1 個氧原子組成，化學式為 H₂O。',
    tags: '化學,化學式,水'
  },
  {
    subject_id: 2, type: 'choice', difficulty: 4,
    content: '一物體質量為 5 kg，受到 20 N 的合力，則加速度為多少 m/s²？',
    option_a: '2', option_b: '4', option_c: '10', option_d: '100',
    answer: 'B', explanation: '依牛頓第二定律：F = ma，故 a = F/m = 20/5 = 4 m/s²。',
    tags: '物理,牛頓第二定律,加速度'
  },
  {
    subject_id: 2, type: 'choice', difficulty: 3,
    content: '下列哪種生物屬於脊椎動物？',
    option_a: '蚯蚓', option_b: '螃蟹', option_c: '青蛙', option_d: '蝸牛',
    answer: 'C', explanation: '青蛙屬於兩棲類，有脊椎，是脊椎動物。其餘均為無脊椎動物。',
    tags: '生物,脊椎動物,分類'
  },
  {
    subject_id: 2, type: 'choice', difficulty: 5,
    content: '一物體從靜止開始自由落下，忽略空氣阻力，重力加速度 g = 10 m/s²。落下 3 秒後，物體速度為多少 m/s？',
    option_a: '10', option_b: '20', option_c: '30', option_d: '45',
    answer: 'C', explanation: 'v = v₀ + gt = 0 + 10×3 = 30 m/s',
    tags: '物理,自由落體,速度'
  },
  {
    subject_id: 2, type: 'fill', difficulty: 3,
    content: '地球繞太陽公轉一圈約需___天',
    answer: '365', explanation: '地球公轉週期約 365.25 天，即一年。',
    tags: '地球科學,地球,公轉'
  },
];

const insert = db.prepare(`
  INSERT INTO questions (subject_id,type,difficulty,content,option_a,option_b,option_c,option_d,answer,explanation,source,tags)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
`);

let count = 0;
[...mathQuestions, ...sciQuestions].forEach(q => {
  // Skip the duplicate entry added by mistake
  if (q.explanation && q.explanation.includes('等一下')) return;
  insert.run(
    q.subject_id, q.type, q.difficulty, q.content,
    q.option_a||null, q.option_b||null, q.option_c||null, q.option_d||null,
    q.answer, q.explanation||null, q.source||null, q.tags||null
  );
  count++;
});

// Create a sample exam
const examResult = db.prepare(`INSERT INTO exams (title, description, duration_min, status) VALUES (?,?,?,?)`).run(
  '數理資優班入學考試（範例）',
  '本試卷包含數學與自然科學題目，適合國小升國中數理資優班甄選使用。',
  90,
  'active'
);

const mathIds = db.prepare('SELECT id FROM questions WHERE subject_id = 1 LIMIT 5').all();
const sciIds  = db.prepare('SELECT id FROM questions WHERE subject_id = 2 LIMIT 5').all();
const insEQ = db.prepare(`INSERT INTO exam_questions (exam_id,question_id,sort_order,score) VALUES (?,?,?,?)`);
[...mathIds, ...sciIds].forEach((q, i) => insEQ.run(examResult.lastInsertRowid, q.id, i + 1, 10));

console.log(`[OK] 成功植入 ${count} 道題目`);
console.log(`[OK] 建立範例試卷（ID: ${examResult.lastInsertRowid}）`);
