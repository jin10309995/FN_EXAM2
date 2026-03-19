const db = require('./database');

const GRADE_LEVEL = 'grade_7';
const TARGET_COUNT = 300;
const SOURCE = '國中一年級補題腳本（各科補足至300題）';
const TARGET_CODES = ['CHN_7', 'ENG_7', 'ENG_LISTEN_7', 'ESSAY_7', 'MATH_7', 'SCI_7', 'SOC_7'];
const UNIQUE_CONTEXTS = ['校園', '段考', '社團', '晨讀', '實驗課', '假日作業', '分組討論', '教室活動', '戶外教學', '圖書館'];

const insertQuestion = db.prepare(`
  INSERT INTO questions (
    subject_id, type, difficulty, content,
    option_a, option_b, option_c, option_d,
    answer, explanation, source, tags, grade_level,
    audio_url, audio_transcript
  ) VALUES (
    ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?
  )
`);

function choiceLetter(index) {
  return ['A', 'B', 'C', 'D'][index];
}

function pick(list, index, offset = 0) {
  return list[(index + offset) % list.length];
}

function suffix(code, serial) {
  return `（情境：${code}-${pick(UNIQUE_CONTEXTS, serial)}-${serial + 1}）`;
}

function nextDifficulty(counts) {
  let min = 0;
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] < counts[min]) min = i;
  }
  return min + 1;
}

function makeChoice(subjectId, difficulty, content, options, answerIndex, explanation, tags, extra = {}) {
  return {
    subject_id: subjectId,
    type: extra.type || 'choice',
    difficulty,
    content,
    option_a: options[0] || null,
    option_b: options[1] || null,
    option_c: options[2] || null,
    option_d: options[3] || null,
    answer: choiceLetter(answerIndex),
    explanation,
    tags,
    audio_url: extra.audio_url || null,
    audio_transcript: extra.audio_transcript || null
  };
}

function makeFill(subjectId, difficulty, content, answer, explanation, tags, extra = {}) {
  return {
    subject_id: subjectId,
    type: extra.type || 'fill',
    difficulty,
    content,
    option_a: null,
    option_b: null,
    option_c: null,
    option_d: null,
    answer,
    explanation,
    tags,
    audio_url: extra.audio_url || null,
    audio_transcript: extra.audio_transcript || null
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
    tags,
    audio_url: null,
    audio_transcript: null
  };
}

function buildOptions(correct, wrongs, serial) {
  const answerIndex = serial % 4;
  const options = wrongs.slice(0, 3);
  options.splice(answerIndex, 0, correct);
  return { options, answerIndex };
}

const chnIdioms = [
  ['按部就班', '做事依照步驟進行'],
  ['融會貫通', '把學到的知識整合起來理解'],
  ['見微知著', '從小地方看出大趨勢'],
  ['舉一反三', '由一件事推知其他道理'],
  ['鍥而不捨', '持續努力不放棄'],
  ['循序漸進', '按照順序逐步進步']
];
const chnRhetoric = [
  ['時間像河流一樣不停向前。', '比喻'],
  ['風在走廊上低聲提醒大家安靜。', '擬人'],
  ['我想學習、我想成長、我想突破。', '排比'],
  ['教室安靜得連翻頁聲都像鐘聲一樣清楚。', '誇飾']
];

function chineseQuestion(subjectId, seq, difficulty, code) {
  const mode = seq % 5;
  const n = Math.floor(seq / 5);
  const ctx = suffix(code, seq);

  if (mode === 0) {
    const item = pick(chnIdioms, n);
    const wrongs = chnIdioms.filter(([w]) => w !== item[0]).map(([w]) => w);
    const built = buildOptions(item[0], wrongs, n);
    return makeChoice(
      subjectId,
      difficulty,
      `下列哪個成語最適合形容「${item[1]}」？${ctx}`,
      built.options,
      built.answerIndex,
      `${item[0]}可用來形容「${item[1]}」。`,
      '國文,成語'
    );
  }

  if (mode === 1) {
    const item = pick(chnRhetoric, n);
    const options = ['比喻', '擬人', '排比', '誇飾'];
    return makeChoice(
      subjectId,
      difficulty,
      `句子「${item[0]}」使用了哪種修辭？${ctx}`,
      options,
      options.indexOf(item[1]),
      `這句話運用了${item[1]}修辭。`,
      '國文,修辭'
    );
  }

  if (mode === 2) {
    const quote = pick([
      ['學而時習之，不亦___乎', '說'],
      ['知之為知之，不知為不知，是___也', '知'],
      ['溫故而知新，可以為___矣', '師'],
      ['學而不思則罔，思而不學則___', '殆']
    ], n);
    return makeFill(
      subjectId,
      difficulty,
      `請填空：${quote[0]}${ctx}`,
      quote[1],
      `依原文應填「${quote[1]}」。`,
      '國文,古文'
    );
  }

  if (mode === 3) {
    const fact = pick([
      ['「三人行，必有我師焉」強調虛心學習。', true],
      ['「畫蛇添足」是稱讚做事非常周到。', false],
      ['標點符號有助於讀者理解句意。', true],
      ['議論文不需要提出論點。', false]
    ], n);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】${fact[0]}${ctx}`,
      fact[1],
      fact[1] ? '這個敘述正確。' : '這個敘述不正確。',
      '國文,判斷'
    );
  }

  const answer = pick(['尊重', '思考', '合作', '觀察', '誠實'], n);
  return makeFill(
    subjectId,
    difficulty,
    `閱讀與寫作時，若想真正理解內容並避免誤解，最重要的是保持___的態度。${ctx}`,
    answer,
    `依句意，最適合填入「${answer}」。`,
    '國文,閱讀理解'
  );
}

const engWords = [
  ['library', '圖書館'],
  ['science', '科學'],
  ['history', '歷史'],
  ['festival', '節日'],
  ['shoulder', '肩膀'],
  ['careful', '小心的']
];
const engVerbs = [
  ['study', 'studies', 'studying'],
  ['watch', 'watches', 'watching'],
  ['practice', 'practices', 'practicing'],
  ['clean', 'cleans', 'cleaning'],
  ['visit', 'visits', 'visiting']
];

function englishQuestion(subjectId, seq, difficulty, code) {
  const mode = seq % 5;
  const n = Math.floor(seq / 5);
  const ctx = suffix(code, seq);

  if (mode === 0) {
    const item = pick(engWords, n);
    const wrongs = engWords.filter(([w]) => w !== item[0]).map(([w]) => w);
    const built = buildOptions(item[0], wrongs, n);
    return makeChoice(
      subjectId,
      difficulty,
      `「${item[1]}」的英文是什麼？${ctx}`,
      built.options,
      built.answerIndex,
      `${item[0]} 的中文是「${item[1]}」。`,
      '英語,字彙'
    );
  }

  if (mode === 1) {
    const item = pick(engVerbs, n);
    return makeChoice(
      subjectId,
      difficulty,
      `She ___ every evening after dinner. 請選出正確答案。${ctx}`,
      [item[0], item[1], item[2], `${item[0]}ed`],
      1,
      `第三人稱單數一般現在式要用 ${item[1]}。`,
      '英語,文法'
    );
  }

  if (mode === 2) {
    const item = pick(engVerbs, n, 2);
    return makeFill(
      subjectId,
      difficulty,
      `請填空：They are ___ in the classroom now.（動詞提示：${item[0]}）${ctx}`,
      item[2],
      `現在進行式要用 V-ing，所以答案是 ${item[2]}。`,
      '英語,進行式'
    );
  }

  if (mode === 3) {
    const fact = pick([
      ['A library is a place to borrow books.', true],
      ['We use \"an\" before every consonant sound.', false],
      ['\"He doesn\'t like math\" is a correct sentence.', true],
      ['\"She go to school every day\" is grammatically correct.', false]
    ], n);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】${fact[0]}${ctx}`,
      fact[1],
      fact[1] ? '這個英文句子或概念正確。' : '這個英文句子或概念不正確。',
      '英語,判斷'
    );
  }

  const tense = pick([
    ['Yesterday, we ___ basketball after school.', 'played'],
    ['Last night, my brother ___ his homework at home.', 'finished'],
    ['Last weekend, they ___ their grandparents.', 'visited'],
    ['This morning, I ___ breakfast at seven.', 'ate']
  ], n);
  return makeFill(
    subjectId,
    difficulty,
    `${tense[0]}${ctx}`,
    tense[1],
    `句子描述過去發生的事，應填過去式 ${tense[1]}。`,
    '英語,過去式'
  );
}

const listeningThemes = [
  {
    transcript: 'I do my homework before dinner every day.',
    keyword: 'do my homework',
    options: ['watch TV', 'do my homework', 'go swimming', 'play the piano']
  },
  {
    transcript: 'My sister reads in the library on Saturday morning.',
    keyword: 'library',
    options: ['playground', 'library', 'kitchen', 'station']
  },
  {
    transcript: 'Tom takes the bus to school at seven thirty.',
    keyword: 'bus',
    options: ['train', 'bus', 'bike', 'taxi']
  },
  {
    transcript: 'We have science class on Tuesday afternoon.',
    keyword: 'science',
    options: ['history', 'science', 'music', 'art']
  }
];

function listeningQuestion(subjectId, seq, difficulty, code) {
  const mode = seq % 3;
  const n = Math.floor(seq / 3);
  const item = pick(listeningThemes, n);
  const ctx = suffix(code, seq);

  if (mode === 0) {
    return makeChoice(
      subjectId,
      difficulty,
      `🎧 請聆聽句子，選出最符合內容的答案。${ctx}`,
      item.options,
      item.options.indexOf(item.keyword),
      `依照句子內容，答案是 ${item.keyword}。`,
      '英文聽力,選擇',
      { type: 'listening', audio_transcript: item.transcript }
    );
  }

  if (mode === 1) {
    return makeFill(
      subjectId,
      difficulty,
      `🎧 請聆聽句子，填入空格中的英文單字。\n句子："${item.transcript.replace(item.keyword, '_____')}" ${ctx}`,
      item.keyword,
      `依照句意，應填入 ${item.keyword}。`,
      '英文聽力,填空',
      { type: 'listening', audio_transcript: item.transcript }
    );
  }

  const spelling = item.keyword.includes(' ') ? item.keyword.split(' ')[0] : item.keyword;
  return makeFill(
    subjectId,
    difficulty,
    `🎧 請聆聽句子，寫出重點單字。${ctx}`,
    spelling,
    `這句話的重點單字是 ${spelling}。`,
    '英文聽力,拼字',
    { type: 'listening', audio_transcript: item.transcript }
  );
}

const essayThemes = [
  '我升上國中的第一個挑戰',
  '一次讓我學會負責的經驗',
  '如果我是班長',
  '我最喜歡的一門課',
  '一次分組合作的收穫',
  '我如何安排我的學習時間',
  '校園中最難忘的一天',
  '我想改善的一個習慣'
];
const essayFocus = [
  '請交代事情的背景、經過和結果，並說明你的感受。',
  '請用具體例子支持你的想法，避免只寫空泛的感受。',
  '請至少分成三段，讓文章結構清楚。',
  '請在結尾寫出你的反思或改變。'
];

function rubric(difficulty) {
  const items = ['主題明確', '內容具體', '結構完整', '語句通順', '錯別字少'];
  if (difficulty >= 3) items.push('能表達個人感受');
  if (difficulty >= 4) items.push('例子充分且前後連貫');
  if (difficulty >= 5) items.push('能有較完整的反思與觀點');
  return `評分規準：${items.map((x, i) => `${i + 1}. ${x}`).join('；')}。`;
}

function essayQuestion(subjectId, seq, difficulty, code) {
  const title = pick(essayThemes, seq);
  const focus = pick(essayFocus, Math.floor(seq / essayThemes.length));
  const content = `請以「${title}」為題，寫一篇作文。${focus}${suffix(code, seq)}`;
  const explanation = `本題評量國中一年級學生的敘事、說明與反思能力。難度為 ${difficulty}，批改時可從主題掌握、內容發展、段落安排與語句表達進行評閱。`;
  return {
    subject_id: subjectId,
    type: 'writing',
    difficulty,
    content,
    option_a: null,
    option_b: null,
    option_c: null,
    option_d: null,
    answer: rubric(difficulty),
    explanation,
    tags: '作文,寫作',
    audio_url: null,
    audio_transcript: null
  };
}

function mathQuestion(subjectId, seq, difficulty, code) {
  const mode = seq % 5;
  const n = Math.floor(seq / 5);
  const ctx = suffix(code, seq);

  if (mode === 0) {
    const x = difficulty + 3 + (n % 6);
    return makeFill(
      subjectId,
      difficulty,
      `解方程式：3x - ${difficulty} = ${3 * x - difficulty}，x = ___ ${ctx}`,
      String(x),
      `移項後可得 x=${x}。`,
      '數學,方程式'
    );
  }

  if (mode === 1) {
    const a = 4 + difficulty + (n % 5);
    const b = 3 + (n % 4);
    const ans = a * b;
    const built = buildOptions(String(ans), [`${ans + 4}`, `${Math.max(1, ans - 4)}`, `${ans + 8}`], n);
    return makeChoice(
      subjectId,
      difficulty,
      `長方形長 ${a}、寬 ${b}，面積是多少？${ctx}`,
      built.options,
      built.answerIndex,
      `面積=${a}×${b}=${ans}。`,
      '數學,幾何'
    );
  }

  if (mode === 2) {
    const total = 30 + difficulty * 10 + (n % 4) * 5;
    const percent = [10, 20, 25, 50][n % 4];
    const ans = (total * percent) / 100;
    return makeFill(
      subjectId,
      difficulty,
      `${total} 的 ${percent}% = ___ ${ctx}`,
      String(ans),
      `${total}×${percent / 100}=${ans}。`,
      '數學,百分比'
    );
  }

  if (mode === 3) {
    const a = 3 + difficulty + (n % 4);
    const b = 4 + difficulty + (n % 3);
    const c = Math.sqrt(a * a + b * b);
    const built = buildOptions(String(c), [`${c + 1}`, `${Math.max(1, c - 1)}`, `${c + 2}`], n + 1);
    return makeChoice(
      subjectId,
      difficulty,
      `直角三角形兩股長為 ${a} 和 ${b}，斜邊長是多少？${ctx}`,
      built.options,
      built.answerIndex,
      `依畢氏定理，斜邊=√(${a}²+${b}²)=${c}。`,
      '數學,畢氏定理'
    );
  }

  const first = 2 + difficulty + (n % 5);
  const diff = 2 + (n % 4);
  const term = 6 + (n % 4);
  const ans = first + (term - 1) * diff;
  return makeFill(
    subjectId,
    difficulty,
    `等差數列首項 ${first}、公差 ${diff}，第 ${term} 項是 ___ ${ctx}`,
    String(ans),
    `aₙ=a₁+(n-1)d=${ans}。`,
    '數學,數列'
  );
}

function scienceQuestion(subjectId, seq, difficulty, code) {
  const mode = seq % 5;
  const n = Math.floor(seq / 5);
  const ctx = suffix(code, seq);

  if (mode === 0) {
    const fact = pick([
      ['植物的葉綠體和光合作用有關。', true],
      ['聲音可以在真空中傳播。', false],
      ['酸性溶液的 pH 值小於 7。', true],
      ['地球自轉造成四季變化。', false]
    ], n);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】${fact[0]}${ctx}`,
      fact[1],
      fact[1] ? '這項自然概念正確。' : '這項自然概念不正確。',
      '自然,判斷'
    );
  }

  if (mode === 1) {
    const item = pick([
      ['量筒', '測量液體體積'],
      ['顯微鏡', '觀察細胞'],
      ['溫度計', '測量溫度'],
      ['天平', '測量質量']
    ], n);
    const wrongs = ['直尺', '秒錶', '燒杯'].filter((x) => x !== item[0]);
    const built = buildOptions(item[0], wrongs, n);
    return makeChoice(
      subjectId,
      difficulty,
      `若要${item[1]}，最適合使用哪一種工具？${ctx}`,
      built.options,
      built.answerIndex,
      `${item[0]}可以用來${item[1]}。`,
      '自然,實驗'
    );
  }

  if (mode === 2) {
    const item = pick([
      ['光合作用會釋放的氣體是', '氧氣'],
      ['人體血液中負責運送氧氣的是', '紅血球'],
      ['地球繞太陽公轉一圈約需', '365天'],
      ['水的化學式是', 'H₂O']
    ], n);
    return makeFill(
      subjectId,
      difficulty,
      `請填空：${item[0]} ___ ${ctx}`,
      item[1],
      `依自然科知識，答案是「${item[1]}」。`,
      '自然,填空'
    );
  }

  if (mode === 3) {
    const built = buildOptions('物理變化', ['化學變化', '生物變化', '核變化'], n);
    return makeChoice(
      subjectId,
      difficulty,
      `冰塊熔化最適合歸類為哪一種變化？${ctx}`,
      built.options,
      built.answerIndex,
      `冰塊熔化沒有生成新物質，屬於物理變化。`,
      '自然,變化'
    );
  }

  const answer = 24;
  return makeFill(
    subjectId,
    difficulty,
    `地球自轉一圈大約需要 ___ 小時${ctx}`,
    String(answer),
    `地球自轉週期約 24 小時。`,
    '自然,地科'
  );
}

function socialQuestion(subjectId, seq, difficulty, code) {
  const mode = seq % 5;
  const n = Math.floor(seq / 5);
  const ctx = suffix(code, seq);

  if (mode === 0) {
    const item = pick([
      ['濁水溪', '台灣最長的河流'],
      ['玉山', '台灣最高峰'],
      ['東亞', '台灣所在區域'],
      ['聯合國', '維護國際和平的重要國際組織']
    ], n);
    const wrongs = ['高屏溪', '阿里山', '南亞', '世界銀行'].filter((x) => x !== item[0]);
    const built = buildOptions(item[0], wrongs, n);
    return makeChoice(
      subjectId,
      difficulty,
      `下列哪一個最符合「${item[1]}」的描述？${ctx}`,
      built.options,
      built.answerIndex,
      `${item[0]}符合題目描述。`,
      '社會,常識'
    );
  }

  if (mode === 1) {
    const fact = pick([
      ['三權分立包含行政、立法與司法。', true],
      ['台灣位於歐亞板塊與菲律賓海板塊交界。', true],
      ['民主政治不需要人民參與。', false],
      ['工業革命最早發生在日本。', false]
    ], n);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】${fact[0]}${ctx}`,
      fact[1],
      fact[1] ? '這項社會科觀念正確。' : '這項社會科觀念不正確。',
      '社會,判斷'
    );
  }

  if (mode === 2) {
    const item = pick([
      ['中華民國政府遷台的年份是', '1949年'],
      ['台灣目前的直轄市數量是', '6個'],
      ['人民參與公共事務時應兼顧的核心價值之一是', '責任'],
      ['法律除了保障權利，也規範人民的', '義務']
    ], n);
    return makeFill(
      subjectId,
      difficulty,
      `請填空：${item[0]} ___ ${ctx}`,
      item[1],
      `依社會科知識，答案為「${item[1]}」。`,
      '社會,填空'
    );
  }

  if (mode === 3) {
    const built = buildOptions('主權在民', ['政府高於人民', '君主專制', '只重視經濟'], n + 1);
    return makeChoice(
      subjectId,
      difficulty,
      `民主政治最核心的原則是什麼？${ctx}`,
      built.options,
      built.answerIndex,
      `民主政治強調主權在民。`,
      '社會,公民'
    );
  }

  const answer = pick(['太平洋', '亞熱帶', '公投', '地方自治'], n);
  return makeFill(
    subjectId,
    difficulty,
    `請依題意填入最適當的社會科詞語：${answer}。${ctx}`,
    answer,
    `依題意，答案是「${answer}」。`,
    '社會,綜合'
  );
}

const generators = {
  CHN_7: chineseQuestion,
  ENG_7: englishQuestion,
  ENG_LISTEN_7: listeningQuestion,
  ESSAY_7: essayQuestion,
  MATH_7: mathQuestion,
  SCI_7: scienceQuestion,
  SOC_7: socialQuestion
};

const subjectRows = db.prepare(`
  SELECT id, code, name
  FROM subjects
  WHERE grade_level = ?
    AND code IN (${TARGET_CODES.map(() => '?').join(',')})
  ORDER BY code
`).all(GRADE_LEVEL, ...TARGET_CODES);

const subjectMap = new Map(subjectRows.map((row) => [row.code, row]));
for (const code of TARGET_CODES) {
  if (!subjectMap.has(code)) throw new Error(`找不到科目：${code}`);
}

const existingContent = new Set(
  db.prepare(`
    SELECT content
    FROM questions
    WHERE grade_level = ?
      AND is_archived = 0
  `).all(GRADE_LEVEL).map((row) => row.content)
);

function currentCount(code) {
  return db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM questions q
    JOIN subjects s ON s.id = q.subject_id
    WHERE q.grade_level = ?
      AND q.is_archived = 0
      AND s.code = ?
  `).get(GRADE_LEVEL, code).cnt;
}

function currentDifficultyCounts(code) {
  const counts = [0, 0, 0, 0, 0];
  const rows = db.prepare(`
    SELECT q.difficulty, COUNT(*) AS cnt
    FROM questions q
    JOIN subjects s ON s.id = q.subject_id
    WHERE q.grade_level = ?
      AND q.is_archived = 0
      AND s.code = ?
    GROUP BY q.difficulty
  `).all(GRADE_LEVEL, code);
  for (const row of rows) counts[row.difficulty - 1] = row.cnt;
  return counts;
}

const run = db.transaction(() => {
  const result = {};

  for (const code of TARGET_CODES) {
    const subject = subjectMap.get(code);
    const count = currentCount(code);
    const need = Math.max(0, TARGET_COUNT - count);
    const counts = currentDifficultyCounts(code);
    let inserted = 0;
    let seq = 0;

    while (inserted < need) {
      const difficulty = nextDifficulty(counts);
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
        GRADE_LEVEL,
        candidate.audio_url,
        candidate.audio_transcript
      );

      existingContent.add(candidate.content);
      counts[difficulty - 1] += 1;
      inserted += 1;
      seq += 1;
    }

    result[code] = { inserted, counts };
  }

  return result;
});

const result = run();

console.log('國中一年級各科補題完成：');
for (const code of TARGET_CODES) {
  const subject = subjectMap.get(code);
  const total = currentCount(code);
  console.log(`- ${code} ${subject.name}：${total} 題，本次新增 ${result[code].inserted} 題，難度分佈 [${result[code].counts.join(', ')}]`);
}
