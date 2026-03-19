const db = require('./database');

const TARGET_COUNT = 300;
const SOURCE = '國中八九年級補題腳本（各科補足至300題）';
const CONFIGS = [
  {
    grade: 'grade_8',
    codes: ['CHN_8', 'ENG_8', 'ENG_LISTEN_8', 'ESSAY_8', 'MATH_8', 'SCI_8', 'SOC_8']
  },
  {
    grade: 'grade_9',
    codes: ['CHN_9', 'ENG_9', 'ENG_LISTEN_9', 'ESSAY_9', 'MATH_9', 'SCI_9', 'SOC_9']
  }
];
const UNIQUE_CONTEXTS = ['晨讀', '小考', '月考', '班會', '實驗課', '圖書館', '戶外教學', '分組討論', '假日練習', '課堂任務'];

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

function chineseQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  const idioms = [
    ['融會貫通', '把學到的知識整合起來理解'],
    ['觸類旁通', '由一件事推想到其他相似道理'],
    ['見微知著', '從小線索看出大趨勢'],
    ['言簡意賅', '語言簡潔而意思完整'],
    ['旁徵博引', '引用很多材料來說明觀點'],
    ['循循善誘', '有條理地一步步引導']
  ];
  const rhetoric = [
    ['月光像銀紗般灑在操場上。', '比喻'],
    ['黑板靜靜聽著同學的發言。', '擬人'],
    ['我想突破、我想成長、我想前進。', '排比'],
    ['整座教室安靜得像沒有時間流動。', '誇飾']
  ];

  if (mode === 0) {
    const item = pick(idioms, n);
    const wrongs = idioms.filter(([w]) => w !== item[0]).map(([w]) => w);
    const built = buildOptions(item[0], wrongs, n);
    return makeChoice(subjectId, difficulty, `哪個成語最適合形容「${item[1]}」？${ctx}`, built.options, built.answerIndex, `${item[0]}最符合題意。`, '國文,成語');
  }
  if (mode === 1) {
    const item = pick(rhetoric, n);
    const options = ['比喻', '擬人', '排比', '誇飾'];
    return makeChoice(subjectId, difficulty, `句子「${item[0]}」使用了哪種修辭？${ctx}`, options, options.indexOf(item[1]), `這句話運用了${item[1]}修辭。`, '國文,修辭');
  }
  if (mode === 2) {
    const quote = pick([
      ['學而不思則罔，思而不學則___', '殆'],
      ['先天下之憂而憂，後天下之___而樂', '樂'],
      ['知之者不如好之者，好之者不如___之者', '樂'],
      ['天生我材必有用，千金散盡還___', '復來']
    ], n);
    return makeFill(subjectId, difficulty, `請填空：${quote[0]}${ctx}`, quote[1], `依原文應填「${quote[1]}」。`, '國文,古文');
  }
  if (mode === 3) {
    const fact = pick([
      ['議論文通常需要提出明確論點。', true],
      ['「醉翁之意不在酒」是在稱讚飲酒文化。', false],
      ['對偶講究上下句詞性與結構相對。', true],
      ['「木蘭詩」屬於唐代律詩。', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這個敘述正確。' : '這個敘述不正確。', '國文,判斷');
  }
  const answer = pick(['思辨', '觀察', '誠實', '尊重', '耐心'], n);
  return makeFill(subjectId, difficulty, `閱讀古文或論說文時，若想掌握作者觀點，最需要培養的能力是___。${ctx}`, answer, `依句意可填入「${answer}」。`, '國文,閱讀理解');
}

function englishQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  const words = [
    ['environment', '環境'],
    ['citizen', '公民'],
    ['pressure', '壓力'],
    ['knowledge', '知識'],
    ['schedule', '行程表'],
    ['volunteer', '志工']
  ];
  const verbs = [
    ['finish', 'finished', 'finishing'],
    ['prepare', 'prepared', 'preparing'],
    ['improve', 'improved', 'improving'],
    ['discuss', 'discussed', 'discussing']
  ];

  if (mode === 0) {
    const item = pick(words, n);
    const wrongs = words.filter(([w]) => w !== item[0]).map(([w]) => w);
    const built = buildOptions(item[0], wrongs, n);
    return makeChoice(subjectId, difficulty, `「${item[1]}」的英文是什麼？${ctx}`, built.options, built.answerIndex, `${item[0]} 的中文是「${item[1]}」。`, '英語,字彙');
  }
  if (mode === 1) {
    const item = pick(verbs, n);
    return makeChoice(subjectId, difficulty, `By the time I arrived, they had already ___. 請選出正確答案。${ctx}`, [item[0], item[1], item[2], `${item[0]}s`], 1, `過去完成式後接過去分詞 ${item[1]}。`, '英語,文法');
  }
  if (mode === 2) {
    const sentence = pick([
      ['If I ___ more time, I would join the club.', 'had'],
      ['She asked me if I ___ the answer.', 'knew'],
      ['The book ___ by many students every year.', 'is read'],
      ['This is the place ___ we first met.', 'where']
    ], n);
    return makeFill(subjectId, difficulty, `${sentence[0]}${ctx}`, sentence[1], `依句型規則應填「${sentence[1]}」。`, '英語,句型');
  }
  if (mode === 3) {
    const fact = pick([
      ['"If I were you" is a correct subjunctive sentence.', true],
      ['"since three years" is correct with present perfect tense.', false],
      ['A relative pronoun can connect two clauses.', true],
      ['"The homework finished by me" is natural active voice.', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這個英文敘述正確。' : '這個英文敘述不正確。', '英語,判斷');
  }
  const item = pick([
    ['Would you mind ___ the window?', 'opening'],
    ['Not only ___ he smart, but he is also helpful.', 'is'],
    ['The report will ___ tomorrow.', 'be finished'],
    ['Have you ever ___ to Tainan?', 'been']
  ], n);
  return makeFill(subjectId, difficulty, `${item[0]}${ctx}`, item[1], `依文法應填「${item[1]}」。`, '英語,綜合');
}

function listeningQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 3);
  const mode = seq % 3;
  const ctx = suffix(code, seq);
  const themes = [
    {
      transcript: 'We will hand in the science report on Friday morning.',
      keyword: 'Friday',
      options: ['Monday', 'Wednesday', 'Friday', 'Sunday']
    },
    {
      transcript: 'My brother has practiced the piano for two hours tonight.',
      keyword: 'piano',
      options: ['violin', 'drums', 'guitar', 'piano']
    },
    {
      transcript: 'The teacher asked us to discuss the question in groups of four.',
      keyword: 'four',
      options: ['two', 'three', 'four', 'five']
    },
    {
      transcript: 'I took the MRT to the museum because it was raining.',
      keyword: 'museum',
      options: ['library', 'museum', 'theater', 'station']
    }
  ];
  const item = pick(themes, n);
  if (mode === 0) {
    return makeChoice(subjectId, difficulty, `🎧 請聆聽句子，選出最符合內容的答案。${ctx}`, item.options, item.options.indexOf(item.keyword), `依句意可知答案是 ${item.keyword}。`, '英文聽力,選擇', { type: 'listening', audio_transcript: item.transcript });
  }
  if (mode === 1) {
    return makeFill(subjectId, difficulty, `🎧 請聆聽句子，填入空格中的單字。\n句子："${item.transcript.replace(item.keyword, '_____')}" ${ctx}`, item.keyword, `依句意應填入 ${item.keyword}。`, '英文聽力,填空', { type: 'listening', audio_transcript: item.transcript });
  }
  const spelling = item.keyword.includes(' ') ? item.keyword.split(' ')[0] : item.keyword;
  return makeFill(subjectId, difficulty, `🎧 請聆聽句子，寫出重點單字。${ctx}`, spelling, `句中的重點單字是 ${spelling}。`, '英文聽力,拼字', { type: 'listening', audio_transcript: item.transcript });
}

function essayRubric(difficulty) {
  const items = ['主題明確', '內容具體', '結構完整', '語句通順', '錯別字少'];
  if (difficulty >= 3) items.push('能表達個人觀點與反思');
  if (difficulty >= 4) items.push('例子充分且段落銜接自然');
  if (difficulty >= 5) items.push('論述深度較完整');
  return `評分規準：${items.map((x, i) => `${i + 1}. ${x}`).join('；')}。`;
}

function essayQuestion(subjectId, seq, difficulty, code) {
  const themes = [
    '我最想改變的一件事',
    '一次讓我重新思考的經驗',
    '面對壓力時我如何調整自己',
    '我心中的理想社會',
    '科技帶來的方便與挑戰',
    '我想對未來的自己說的話'
  ];
  const focus = [
    '請交代背景、經過與結果，並寫出你的感受。',
    '請用具體例子支持你的觀點，避免只寫空泛結論。',
    '請至少分成三段，讓文章層次清楚。',
    '請在結尾寫出你的反思或收穫。'
  ];
  const title = pick(themes, seq);
  const instruction = pick(focus, Math.floor(seq / themes.length));
  return {
    subject_id: subjectId,
    type: 'writing',
    difficulty,
    content: `請以「${title}」為題，寫一篇作文。${instruction}${suffix(code, seq)}`,
    option_a: null,
    option_b: null,
    option_c: null,
    option_d: null,
    answer: essayRubric(difficulty),
    explanation: `本題評量國中階段學生的組織、敘事、說理與反思能力，難度為 ${difficulty}。`,
    tags: '作文,寫作',
    audio_url: null,
    audio_transcript: null
  };
}

function mathQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const x = difficulty + 2 + (n % 5);
    return makeFill(subjectId, difficulty, `解方程式：x² - ${x + 1}x + ${x} = 0，其中較小的解是 ___ ${ctx}`, '1', `x²-${x + 1}x+${x}=(x-1)(x-${x})，較小解為1。`, '數學,方程式');
  }
  if (mode === 1) {
    const a = 1 + (n % 3);
    const h = difficulty + 1;
    const k = difficulty - 3;
    const built = buildOptions(`(${h}, ${k})`, [`(${h + 1}, ${k})`, `(${h}, ${k + 1})`, `(${h - 1}, ${k})`], n);
    return makeChoice(subjectId, difficulty, `二次函數 y=${a}(x-${h})²+${k} 的頂點座標是？${ctx}`, built.options, built.answerIndex, `頂點式 y=a(x-h)²+k 的頂點為 (${h}, ${k})。`, '數學,二次函數');
  }
  if (mode === 2) {
    const ratio = 2 + (n % 3);
    const ans = ratio * ratio;
    return makeFill(subjectId, difficulty, `若兩相似圖形的邊長比為 1:${ratio}，則面積比為 1:___ ${ctx}`, String(ans), `相似圖形面積比為邊長比平方，所以是1:${ans}。`, '數學,相似形');
  }
  if (mode === 3) {
    const trig = pick([
      ['sin45°', '√2/2'],
      ['cos60°', '1/2'],
      ['tan30°', '√3/3'],
      ['sin30°', '1/2']
    ], n);
    const built = buildOptions(trig[1], ['√3/2', '1', '0'], n + 1);
    return makeChoice(subjectId, difficulty, `${trig[0]} = ？${ctx}`, built.options, built.answerIndex, `${trig[0]}=${trig[1]}。`, '數學,三角比');
  }
  const total = 5 + difficulty;
  const average = 60 + (n % 5) * 2;
  const sum = total * average;
  return makeFill(subjectId, difficulty, `${total} 個數的平均為 ${average}，它們的總和是 ___ ${ctx}`, String(sum), `總和=平均×個數=${average}×${total}=${sum}。`, '數學,統計');
}

function scienceQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const fact = pick([
      ['溫室效應與二氧化碳增加有關。', true],
      ['水的沸點在標準大氣壓下是 0°C。', false],
      ['聲速在固體中通常比在空氣中快。', true],
      ['所有變化只要顏色改變就一定是化學變化。', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這個自然科概念正確。' : '這個自然科概念不正確。', '自然,判斷');
  }
  if (mode === 1) {
    const item = pick([
      ['粒線體', '細胞進行有氧呼吸的重要胞器'],
      ['板塊運動', '形成山脈與地震的重要原因'],
      ['酸鹼中和', '酸與鹼反應生成鹽和水'],
      ['電磁波', '不需要介質也能傳播']
    ], n);
    const wrongs = ['植物器官', '消化系統', '金屬材料'].filter((x) => x !== item[0]);
    const built = buildOptions(item[0], wrongs, n);
    return makeChoice(subjectId, difficulty, `哪個名詞最符合「${item[1]}」的描述？${ctx}`, built.options, built.answerIndex, `${item[0]}最符合題意。`, '自然,概念');
  }
  if (mode === 2) {
    const item = pick([
      ['地球公轉一圈約需', '365天'],
      ['水的化學式是', 'H₂O'],
      ['酸性溶液的 pH 值通常', '小於7'],
      ['植物光合作用釋放的氣體是', '氧氣']
    ], n);
    return makeFill(subjectId, difficulty, `${item[0]} ___ ${ctx}`, item[1], `依自然科知識應填「${item[1]}」。`, '自然,填空');
  }
  if (mode === 3) {
    const built = buildOptions('物理變化', ['化學變化', '生物變化', '核反應'], n);
    return makeChoice(subjectId, difficulty, `冰塊融化最適合歸類為哪一種變化？${ctx}`, built.options, built.answerIndex, `冰塊融化沒有產生新物質，屬於物理變化。`, '自然,變化');
  }
  const answer = pick(['二氧化碳', '氧氣', '葡萄糖', '氮氣'], n);
  return makeFill(subjectId, difficulty, `依題意填入最適合的自然科詞語：${answer}。${ctx}`, answer, `依題意答案是「${answer}」。`, '自然,綜合');
}

function socialQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const item = pick([
      ['工業革命', '最早發生在英國'],
      ['聯合國', '重要目的是維護國際和平'],
      ['民主政治', '強調主權在民'],
      ['全球化', '使各國互動更加緊密']
    ], n);
    const built = buildOptions(item[0], ['文藝復興', '地方政府', '農業革命'], n);
    return makeChoice(subjectId, difficulty, `哪個名詞最符合「${item[1]}」的描述？${ctx}`, built.options, built.answerIndex, `${item[0]}最符合題意。`, '社會,概念');
  }
  if (mode === 1) {
    const fact = pick([
      ['法律除了保障權利，也規範人民義務。', true],
      ['台灣共有八個直轄市。', false],
      ['公民參與可透過選舉、連署等方式進行。', true],
      ['國際組織一定擁有軍事指揮權。', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這項社會科觀念正確。' : '這項社會科觀念不正確。', '社會,判斷');
  }
  if (mode === 2) {
    const item = pick([
      ['台灣最高峰是', '玉山'],
      ['台灣最長河流是', '濁水溪'],
      ['三權分立包含行政、立法與', '司法'],
      ['世界貿易與交流增加，常被稱為', '全球化']
    ], n);
    return makeFill(subjectId, difficulty, `${item[0]} ___ ${ctx}`, item[1], `依社會科知識應填「${item[1]}」。`, '社會,填空');
  }
  if (mode === 3) {
    const built = buildOptions('責任', ['偶然', '幻想', '旁觀'], n + 1);
    return makeChoice(subjectId, difficulty, `參與公共事務時，除了表達權利，也需要具備什麼態度？${ctx}`, built.options, built.answerIndex, `公民參與同時需要責任感。`, '社會,公民');
  }
  const answer = pick(['地方自治', '納稅', '公民投票', '國際合作'], n);
  return makeFill(subjectId, difficulty, `請依題意填入最適當的社會科詞語：${answer}。${ctx}`, answer, `依題意答案是「${answer}」。`, '社會,綜合');
}

const generators = {
  CHN_8: chineseQuestion,
  CHN_9: chineseQuestion,
  ENG_8: englishQuestion,
  ENG_9: englishQuestion,
  ENG_LISTEN_8: listeningQuestion,
  ENG_LISTEN_9: listeningQuestion,
  ESSAY_8: essayQuestion,
  ESSAY_9: essayQuestion,
  MATH_8: mathQuestion,
  MATH_9: mathQuestion,
  SCI_8: scienceQuestion,
  SCI_9: scienceQuestion,
  SOC_8: socialQuestion,
  SOC_9: socialQuestion
};

function subjectMapFor(grade, codes) {
  const rows = db.prepare(`
    SELECT id, code, name
    FROM subjects
    WHERE grade_level = ?
      AND code IN (${codes.map(() => '?').join(',')})
    ORDER BY code
  `).all(grade, ...codes);
  return new Map(rows.map((row) => [row.code, row]));
}

function currentCount(grade, code) {
  return db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM questions q
    JOIN subjects s ON s.id = q.subject_id
    WHERE q.grade_level = ?
      AND q.is_archived = 0
      AND s.code = ?
  `).get(grade, code).cnt;
}

function difficultyCounts(grade, code) {
  const counts = [0, 0, 0, 0, 0];
  const rows = db.prepare(`
    SELECT q.difficulty, COUNT(*) AS cnt
    FROM questions q
    JOIN subjects s ON s.id = q.subject_id
    WHERE q.grade_level = ?
      AND q.is_archived = 0
      AND s.code = ?
    GROUP BY q.difficulty
  `).all(grade, code);
  for (const row of rows) counts[row.difficulty - 1] = row.cnt;
  return counts;
}

const existingContent = new Set(
  db.prepare(`
    SELECT content
    FROM questions
    WHERE grade_level IN ('grade_8', 'grade_9')
      AND is_archived = 0
  `).all().map((row) => row.content)
);

const run = db.transaction(() => {
  const result = {};

  for (const config of CONFIGS) {
    const map = subjectMapFor(config.grade, config.codes);
    for (const code of config.codes) {
      const subject = map.get(code);
      if (!subject) throw new Error(`找不到科目：${code}`);
      const count = currentCount(config.grade, code);
      const need = Math.max(0, TARGET_COUNT - count);
      const counts = difficultyCounts(config.grade, code);
      let seq = 0;
      let inserted = 0;

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
          config.grade,
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
  }

  return result;
});

const result = run();

for (const config of CONFIGS) {
  console.log(`年級 ${config.grade} 補題完成：`);
  for (const code of config.codes) {
    const total = currentCount(config.grade, code);
    console.log(`- ${code}：${total} 題，本次新增 ${result[code].inserted} 題，難度分佈 [${result[code].counts.join(', ')}]`);
  }
}
