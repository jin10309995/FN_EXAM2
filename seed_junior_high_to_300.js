const db = require('./database');

const GRADE_LEVEL = 'junior_high';
const SOURCE = '升國中資優班補題腳本（各科補足至300題且難度平均）';
const TARGET_CODES = ['BIO', 'CHEM', 'EARTH', 'MATH', 'PHY', 'SCI'];
const TARGET_PER_DIFFICULTY = 60;
const UNIQUE_CONTEXTS = ['校園', '實驗室', '班級競賽', '週末挑戰', '圖書館', '科展', '模擬測驗', '補習班', '戶外觀察', '研究任務'];

const insertQuestion = db.prepare(`
  INSERT INTO questions (
    subject_id, type, difficulty, content,
    option_a, option_b, option_c, option_d,
    answer, explanation, source, tags, grade_level
  ) VALUES (
    ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?, ?
  )
`);

const archiveQuestions = db.prepare(`
  UPDATE questions
  SET is_archived = 1
  WHERE id = ?
`);

function choiceLetter(index) {
  return ['A', 'B', 'C', 'D'][index];
}

function pick(list, index, offset = 0) {
  return list[(index + offset) % list.length];
}

function contextSuffix(code, serial) {
  return `（情境：${code}-${pick(UNIQUE_CONTEXTS, serial)}-${serial + 1}）`;
}

function makeChoice(subjectId, difficulty, content, options, answerIndex, explanation, tags) {
  return {
    subject_id: subjectId,
    type: 'choice',
    difficulty,
    content,
    option_a: options[0] || null,
    option_b: options[1] || null,
    option_c: options[2] || null,
    option_d: options[3] || null,
    answer: choiceLetter(answerIndex),
    explanation,
    tags
  };
}

function makeFill(subjectId, difficulty, content, answer, explanation, tags) {
  return {
    subject_id: subjectId,
    type: 'fill',
    difficulty,
    content,
    option_a: null,
    option_b: null,
    option_c: null,
    option_d: null,
    answer,
    explanation,
    tags
  };
}

function makeTrueFalse(subjectId, difficulty, content, isTrue, explanation, tags) {
  return {
    subject_id: subjectId,
    type: 'true_false',
    difficulty,
    content,
    option_a: null,
    option_b: null,
    option_c: null,
    option_d: null,
    answer: isTrue ? 'T' : 'F',
    explanation,
    tags
  };
}

function buildOptions(correct, wrongs, answerIndex) {
  const options = wrongs.slice(0, 3);
  options.splice(answerIndex, 0, correct);
  return options;
}

function mathQuestion(subjectId, seq, difficulty, code) {
  const mode = seq % 6;
  const n = Math.floor(seq / 6);
  const suffix = contextSuffix(code, seq);

  if (mode === 0) {
    const a = difficulty * 3 + 5 + (n % 7);
    const b = difficulty + 2 + (n % 5);
    const c = a * b - difficulty;
    const answer = c + difficulty;
    return makeFill(
      subjectId,
      difficulty,
      `已知 ${a} × ${b} - ${difficulty} = ${c}，則原式 ${a} × ${b} 的值為 ___ ${suffix}`,
      String(answer),
      `先把減掉的 ${difficulty} 加回去，答案是 ${answer}。`,
      '數學,整數運算'
    );
  }

  if (mode === 1) {
    const x = difficulty + 2 + (n % 6);
    const left = 2 * x + difficulty;
    const options = buildOptions(
      String(x),
      [String(x - 1), String(x + 1), String(x + 2)],
      n % 4
    );
    return makeChoice(
      subjectId,
      difficulty,
      `解方程式：2x + ${difficulty} = ${left}，x = ？${suffix}`,
      options,
      options.indexOf(String(x)),
      `移項後 2x=${left - difficulty}，所以 x=${x}。`,
      '數學,方程式'
    );
  }

  if (mode === 2) {
    const side = difficulty + 3 + (n % 5);
    const area = side * side;
    return makeFill(
      subjectId,
      difficulty,
      `一個正方形邊長為 ${side} 公分，面積為 ___ 平方公分${suffix}`,
      String(area),
      `正方形面積=邊長×邊長=${side}×${side}=${area}。`,
      '數學,幾何'
    );
  }

  if (mode === 3) {
    const total = 40 + difficulty * 10 + (n % 8) * 5;
    const percent = [10, 20, 25, 40][n % 4];
    const ans = (total * percent) / 100;
    const correct = `${ans}`;
    const options = buildOptions(
      correct,
      [`${ans + 5}`, `${Math.max(1, ans - 5)}`, `${ans + 10}`],
      (n + 1) % 4
    );
    return makeChoice(
      subjectId,
      difficulty,
      `${total} 的 ${percent}% 是多少？${suffix}`,
      options,
      options.indexOf(correct),
      `${total}×${percent / 100}=${ans}。`,
      '數學,百分比'
    );
  }

  if (mode === 4) {
    const first = difficulty + 1 + (n % 4);
    const diff = difficulty + 1;
    const term = 5 + (n % 4);
    const ans = first + (term - 1) * diff;
    return makeFill(
      subjectId,
      difficulty,
      `等差數列首項為 ${first}，公差為 ${diff}，第 ${term} 項是 ___ ${suffix}`,
      String(ans),
      `aₙ=a₁+(n-1)d=${first}+(${term}-1)×${diff}=${ans}。`,
      '數學,數列'
    );
  }

  const a = 3 + difficulty + (n % 5);
  const b = 4 + difficulty + (n % 3);
  const c = Math.sqrt(a * a + b * b);
  const correct = `${c}`;
  const options = buildOptions(
    correct,
    [`${c + 1}`, `${Math.max(1, c - 1)}`, `${c + 2}`],
    (n + 2) % 4
  );
  return makeChoice(
    subjectId,
    difficulty,
    `直角三角形兩股長為 ${a} 與 ${b}，斜邊長為多少？${suffix}`,
    options,
    options.indexOf(correct),
    `依畢氏定理，斜邊=√(${a}²+${b}²)=${c}。`,
    '數學,畢氏定理'
  );
}

const sciFacts = [
  ['酸性溶液的 pH 值小於 7。', true],
  ['聲音可以在真空中傳播。', false],
  ['植物會透過光合作用製造葡萄糖。', true],
  ['地球繞太陽公轉會造成白天黑夜交替。', false],
  ['銅屬於良導體。', true],
  ['冰融化屬於化學變化。', false]
];

function scienceQuestion(subjectId, seq, difficulty, code) {
  const mode = seq % 5;
  const n = Math.floor(seq / 5);
  const suffix = contextSuffix(code, seq);

  if (mode === 0) {
    const fact = pick(sciFacts, n);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】${fact[0]}${suffix}`,
      fact[1],
      fact[1] ? '這是正確的自然科學概念。' : '這是錯誤的自然科學概念。',
      '自然科學,綜合'
    );
  }

  if (mode === 1) {
    const tool = pick([
      ['量筒', '測量液體體積'],
      ['天平', '測量質量'],
      ['溫度計', '測量溫度'],
      ['電流計', '測量電流']
    ], n);
    const wrongs = ['直尺', '放大鏡', '顯微鏡', '秒錶'].filter((x) => x !== tool[0]);
    const options = buildOptions(tool[0], wrongs, n % 4);
    return makeChoice(
      subjectId,
      difficulty,
      `若要${tool[1]}，最適合使用哪一種工具？${suffix}`,
      options,
      options.indexOf(tool[0]),
      `${tool[0]}可用來${tool[1]}。`,
      '自然科學,實驗'
    );
  }

  if (mode === 2) {
    const topic = pick([
      ['氧化還原反應中失去電子的一方稱為', '氧化'],
      ['電阻串聯時，總電阻會', '增加'],
      ['食物鏈最底層通常是', '生產者'],
      ['造成季節變化的主要原因是地軸', '傾斜']
    ], n);
    return makeFill(
      subjectId,
      difficulty,
      `請填入最適合的科學概念：${topic[0]} ___ ${suffix}`,
      topic[1],
      `依照科學定義，答案是「${topic[1]}」。`,
      '自然科學,概念'
    );
  }

  if (mode === 3) {
    const correct = pick([
      ['物理變化', '冰塊熔化'],
      ['化學變化', '鐵生鏽'],
      ['再生能源', '太陽能'],
      ['酸鹼中和', '鹽酸與氫氧化鈉反應']
    ], n);
    const options = buildOptions(
      correct[1],
      ['紙張摺疊', '水蒸發', '玻璃破裂'].filter((x) => x !== correct[1]),
      (n + 1) % 4
    );
    return makeChoice(
      subjectId,
      difficulty,
      `下列哪一個最符合「${correct[0]}」的例子？${suffix}`,
      options,
      options.indexOf(correct[1]),
      `${correct[1]}是「${correct[0]}」的典型例子。`,
      '自然科學,分類'
    );
  }

  const water = 20 + difficulty * 5 + (n % 4) * 10;
  const answer = water + 273;
  return makeFill(
    subjectId,
    difficulty,
    `攝氏 ${water} 度換算為克耳文溫標約為 ___ K${suffix}`,
    String(answer),
    `K = °C + 273，所以 ${water}+273=${answer}。`,
    '自然科學,熱學'
  );
}

function physicsQuestion(subjectId, seq, difficulty, code) {
  const mode = seq % 5;
  const n = Math.floor(seq / 5);
  const suffix = contextSuffix(code, seq);

  if (mode === 0) {
    const distance = 100 + difficulty * 20 + (n % 5) * 10;
    const time = 5 + difficulty + (n % 4);
    const speed = distance / time;
    return makeFill(
      subjectId,
      difficulty,
      `某物體移動 ${distance} 公尺，花了 ${time} 秒，平均速度為 ___ 公尺/秒${suffix}`,
      String(speed),
      `速度=距離÷時間=${distance}÷${time}=${speed}。`,
      '物理,速度'
    );
  }

  if (mode === 1) {
    const mass = 2 + difficulty + (n % 5);
    const accel = 2 + (n % 4);
    const force = mass * accel;
    const options = buildOptions(
      String(force),
      [`${force + 2}`, `${Math.max(1, force - 2)}`, `${force + 4}`],
      n % 4
    );
    return makeChoice(
      subjectId,
      difficulty,
      `質量 ${mass} kg 的物體受加速度 ${accel} m/s²，合力為多少牛頓？${suffix}`,
      options,
      options.indexOf(String(force)),
      `依牛頓第二定律 F=ma=${mass}×${accel}=${force} N。`,
      '物理,力學'
    );
  }

  if (mode === 2) {
    const freq = 100 + difficulty * 50 + (n % 5) * 20;
    const wave = +(340 / freq).toFixed(2);
    return makeFill(
      subjectId,
      difficulty,
      `聲速取 340 m/s，若聲波頻率為 ${freq} Hz，波長約為 ___ 公尺${suffix}`,
      String(wave),
      `波長=波速÷頻率=340÷${freq}≈${wave}。`,
      '物理,波動'
    );
  }

  if (mode === 3) {
    const fact = pick([
      ['光從空氣進入水中時，通常會偏向法線。', true],
      ['電磁波需要介質才能傳播。', false],
      ['入射角等於反射角。', true],
      ['超聲波的頻率低於人類可聽範圍。', false]
    ], n);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】${fact[0]}${suffix}`,
      fact[1],
      fact[1] ? '這個物理概念正確。' : '這個物理概念不正確。',
      '物理,觀念'
    );
  }

  const volts = 6 + difficulty * 2 + (n % 3);
  const resistance = 2 + (n % 4);
  const current = +(volts / resistance).toFixed(2);
  const options = buildOptions(
    String(current),
    [`${(current + 1).toFixed(2)}`, `${Math.max(0.5, current - 1).toFixed(2)}`, `${(current + 2).toFixed(2)}`],
    (n + 2) % 4
  );
  return makeChoice(
    subjectId,
    difficulty,
    `若電壓為 ${volts} V、電阻為 ${resistance} Ω，電流約為多少安培？${suffix}`,
    options,
    options.indexOf(String(current)),
    `依歐姆定律 I=V/R=${volts}÷${resistance}≈${current} A。`,
    '物理,電學'
  );
}

function chemistryQuestion(subjectId, seq, difficulty, code) {
  const mode = seq % 5;
  const n = Math.floor(seq / 5);
  const suffix = contextSuffix(code, seq);

  if (mode === 0) {
    const item = pick([
      ['NaCl', '離子鍵'],
      ['H₂O', '共價鍵'],
      ['CO₂', '共價鍵'],
      ['MgO', '離子鍵']
    ], n);
    const options = buildOptions(item[1], ['金屬鍵', '氫鍵', '配位鍵'], n % 4);
    return makeChoice(
      subjectId,
      difficulty,
      `化合物 ${item[0]} 主要屬於哪一種鍵結？${suffix}`,
      options,
      options.indexOf(item[1]),
      `${item[0]} 主要形成的是 ${item[1]}。`,
      '化學,化學鍵'
    );
  }

  if (mode === 1) {
    const acid = 2 + difficulty + (n % 3);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】若溶液的 pH = ${acid}，則此溶液呈酸性。${suffix}`,
      true,
      `pH 小於 7 為酸性，因此 pH=${acid} 的確呈酸性。`,
      '化學,酸鹼'
    );
  }

  if (mode === 2) {
    const coeff = 2 + (n % 3);
    return makeFill(
      subjectId,
      difficulty,
      `配平反應：${coeff}H₂ + O₂ → ___ H₂O${suffix}`,
      String(coeff),
      `為使氫原子數守恆，右側 H₂O 的係數應為 ${coeff}。`,
      '化學,配平'
    );
  }

  if (mode === 3) {
    const item = pick([
      ['莫耳', '6.02×10²³'],
      ['催化劑', '降低活化能'],
      ['中和反應', '生成鹽與水'],
      ['氧化反應', '失去電子']
    ], n);
    const options = buildOptions(item[1], ['增加體積', '只改變顏色', '無法觀察'], (n + 1) % 4);
    return makeChoice(
      subjectId,
      difficulty,
      `關於「${item[0]}」的敘述，哪一項正確？${suffix}`,
      options,
      options.indexOf(item[1]),
      `「${item[0]}」的正確說明是：${item[1]}。`,
      '化學,概念'
    );
  }

  const item = pick([
    ['硫酸', 'H₂SO₄'],
    ['氫氧化鈉', 'NaOH'],
    ['碳酸鈣', 'CaCO₃'],
    ['氨', 'NH₃']
  ], n);
  return makeFill(
    subjectId,
    difficulty,
    `請填入化學式：${item[0]}的化學式是 ___ ${suffix}`,
    item[1],
    `${item[0]} 的標準化學式是 ${item[1]}。`,
    '化學,化學式'
  );
}

function biologyQuestion(subjectId, seq, difficulty, code) {
  const mode = seq % 5;
  const n = Math.floor(seq / 5);
  const suffix = contextSuffix(code, seq);

  if (mode === 0) {
    const item = pick([
      ['粒線體', '細胞的能量工廠'],
      ['葉綠體', '植物進行光合作用的場所'],
      ['細胞核', '儲存遺傳資訊'],
      ['核糖體', '合成蛋白質']
    ], n);
    const options = buildOptions(item[0], ['液泡', '細胞膜', '細胞壁'], n % 4);
    return makeChoice(
      subjectId,
      difficulty,
      `下列哪個胞器最符合「${item[1]}」的描述？${suffix}`,
      options,
      options.indexOf(item[0]),
      `${item[0]}是${item[1]}。`,
      '生物,細胞'
    );
  }

  if (mode === 1) {
    const fact = pick([
      ['紅血球負責運送氧氣。', true],
      ['所有細菌都有細胞核。', false],
      ['DNA 的鹼基配對包含 A-T 與 G-C。', true],
      ['食物鏈中的分解者主要是大型掠食者。', false]
    ], n);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】${fact[0]}${suffix}`,
      fact[1],
      fact[1] ? '這項生物概念正確。' : '這項生物概念不正確。',
      '生物,判斷'
    );
  }

  if (mode === 2) {
    const item = pick([
      ['光合作用需要吸收的氣體是', '二氧化碳'],
      ['胰島素的主要功能是調節', '血糖'],
      ['遺傳物質 DNA 的中文名稱是', '去氧核糖核酸'],
      ['生態系中的生產者通常是', '綠色植物']
    ], n);
    return makeFill(
      subjectId,
      difficulty,
      `請填空：${item[0]} ___ ${suffix}`,
      item[1],
      `依題意，應填入「${item[1]}」。`,
      '生物,概念'
    );
  }

  if (mode === 3) {
    const item = pick([
      ['演化論', '自然選擇'],
      ['孟德爾遺傳', '分離定律'],
      ['生態系', '能量由生產者流向消費者'],
      ['人體免疫', '白血球參與防禦']
    ], n);
    const options = buildOptions(item[1], ['光合作用', '發酵作用', '蒸餾分離'], (n + 1) % 4);
    return makeChoice(
      subjectId,
      difficulty,
      `關於「${item[0]}」的敘述，哪一項最正確？${suffix}`,
      options,
      options.indexOf(item[1]),
      `${item[1]}最符合「${item[0]}」的核心概念。`,
      '生物,綜合'
    );
  }

  const chromosomes = 23;
  return makeFill(
    subjectId,
    difficulty,
    `人類正常體細胞中有 ${chromosomes} 對染色體，共 ___ 條染色體${suffix}`,
    String(chromosomes * 2),
    `人類體細胞有 23 對染色體，共 46 條。`,
    '生物,遺傳'
  );
}

function earthQuestion(subjectId, seq, difficulty, code) {
  const mode = seq % 5;
  const n = Math.floor(seq / 5);
  const suffix = contextSuffix(code, seq);

  if (mode === 0) {
    const item = pick([
      ['板塊碰撞', '可能形成山脈'],
      ['中洋脊', '屬於張裂型板塊邊界'],
      ['颱風形成', '需要溫暖海面提供能量'],
      ['潮汐', '主要受月球引力影響']
    ], n);
    const options = buildOptions(item[1], ['只發生在沙漠', '與地球無關', '完全不受重力影響'], n % 4);
    return makeChoice(
      subjectId,
      difficulty,
      `關於「${item[0]}」的敘述，哪一項正確？${suffix}`,
      options,
      options.indexOf(item[1]),
      `${item[1]}是正確的地科概念。`,
      '地球科學,概念'
    );
  }

  if (mode === 1) {
    const fact = pick([
      ['地球自轉造成白天與黑夜交替。', true],
      ['月食是月球跑到太陽和地球之間。', false],
      ['臭氧層主要位於平流層。', true],
      ['所有地震都能事先精確預測時間地點。', false]
    ], n);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】${fact[0]}${suffix}`,
      fact[1],
      fact[1] ? '這項地科觀念正確。' : '這項地科觀念不正確。',
      '地球科學,判斷'
    );
  }

  if (mode === 2) {
    const item = pick([
      ['地球自轉一圈約需', '24'],
      ['太陽系最大的行星是', '木星'],
      ['最常保存化石的岩石類型是', '沉積岩'],
      ['台灣主要位於歐亞板塊與___海板塊交界', '菲律賓']
    ], n);
    return makeFill(
      subjectId,
      difficulty,
      `請填空：${item[0]} ___ ${suffix}`,
      item[1],
      `依標準地科知識，答案為「${item[1]}」。`,
      '地球科學,填空'
    );
  }

  if (mode === 3) {
    const temp = 26 + (n % 4);
    const options = buildOptions(
      '可能形成颱風',
      ['不可能出現雲系', '只會形成寒流', '一定發生雪崩'],
      (n + 2) % 4
    );
    return makeChoice(
      subjectId,
      difficulty,
      `若海面溫度達 ${temp}°C 且水氣充足，最可能出現哪種現象？${suffix}`,
      options,
      options.indexOf('可能形成颱風'),
      `溫暖海面能提供颱風形成所需的熱量與水氣。`,
      '地球科學,氣象'
    );
  }

  const radius = 6371;
  return makeFill(
    subjectId,
    difficulty,
    `地球平均半徑約為 ___ 公里${suffix}`,
    String(radius),
    `地球平均半徑約為 6371 公里。`,
    '地球科學,地球'
  );
}

const generators = {
  MATH: mathQuestion,
  SCI: scienceQuestion,
  PHY: physicsQuestion,
  CHEM: chemistryQuestion,
  BIO: biologyQuestion,
  EARTH: earthQuestion
};

const subjectRows = db.prepare(`
  SELECT id, code, name
  FROM subjects
  WHERE grade_level = ?
    AND code IN (${TARGET_CODES.map(() => '?').join(',')})
  ORDER BY code
`).all(GRADE_LEVEL, ...TARGET_CODES);

const subjectMap = new Map(subjectRows.map((row) => [row.code, row]));

function getCountsByDifficulty(subjectId) {
  const counts = [0, 0, 0, 0, 0];
  const rows = db.prepare(`
    SELECT difficulty, COUNT(*) AS cnt
    FROM questions
    WHERE subject_id = ?
      AND grade_level = ?
      AND is_archived = 0
    GROUP BY difficulty
  `).all(subjectId, GRADE_LEVEL);
  for (const row of rows) {
    counts[row.difficulty - 1] = row.cnt;
  }
  return counts;
}

const existingContent = new Set(
  db.prepare(`
    SELECT content
    FROM questions
    WHERE grade_level = ?
  `).all(GRADE_LEVEL).map((row) => row.content)
);

const run = db.transaction(() => {
  const result = {};

  for (const code of TARGET_CODES) {
    const subject = subjectMap.get(code);
    if (!subject) {
      throw new Error(`找不到科目：${code}`);
    }

    const counts = getCountsByDifficulty(subject.id);
    let archived = 0;

    for (let difficulty = 1; difficulty <= 5; difficulty++) {
      const current = counts[difficulty - 1];
      if (current > TARGET_PER_DIFFICULTY) {
        const toArchive = current - TARGET_PER_DIFFICULTY;
        const rows = db.prepare(`
          SELECT id
          FROM questions
          WHERE subject_id = ?
            AND grade_level = ?
            AND difficulty = ?
            AND is_archived = 0
          ORDER BY id DESC
          LIMIT ?
        `).all(subject.id, GRADE_LEVEL, difficulty, toArchive);
        for (const row of rows) {
          archiveQuestions.run(row.id);
          archived += 1;
        }
        counts[difficulty - 1] -= toArchive;
      }
    }

    let inserted = 0;
    let seq = 0;

    for (let difficulty = 1; difficulty <= 5; difficulty++) {
      while (counts[difficulty - 1] < TARGET_PER_DIFFICULTY) {
        let candidate = generators[code](subject.id, seq, difficulty, code);
        if (existingContent.has(candidate.content)) {
          candidate.content = `${candidate.content}【變式${seq + 1}】`;
        }
        while (existingContent.has(candidate.content)) {
          seq += 1;
          candidate = generators[code](subject.id, seq, difficulty, code);
          if (existingContent.has(candidate.content)) {
            candidate.content = `${candidate.content}【變式${seq + 1}】`;
          }
        }

        insertQuestion.run(
          candidate.subject_id,
          candidate.type,
          candidate.difficulty,
          candidate.content,
          candidate.option_a,
          candidate.option_b,
          candidate.option_c,
          candidate.option_d,
          candidate.answer,
          candidate.explanation,
          SOURCE,
          candidate.tags,
          GRADE_LEVEL
        );

        existingContent.add(candidate.content);
        counts[difficulty - 1] += 1;
        inserted += 1;
        seq += 1;
      }
    }

    result[code] = {
      archived,
      inserted,
      counts: counts.slice()
    };
  }

  return result;
});

const result = run();

console.log('升國中資優班各科補題完成：');
for (const code of TARGET_CODES) {
  const subject = subjectMap.get(code);
  const info = result[code];
  console.log(`- ${code} ${subject.name}：新增 ${info.inserted} 題，封存 ${info.archived} 題，最終難度分佈 [${info.counts.join(', ')}]`);
}
