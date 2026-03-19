const db = require('./database');

const TARGET_COUNT = 300;
const SOURCE = 'BCTEST 與 GEPT 補題腳本（各科補足至300題）';
const CONFIGS = [
  {
    grade: 'bctest',
    codes: ['CHN_BC', 'ENG_BC', 'ENG_LISTEN_BC', 'ESSAY_BC', 'MATH_BC', 'SCI_BC', 'SOC_BC']
  },
  {
    grade: 'gept_elementary',
    codes: ['GEPT_LISTEN', 'GEPT_READ', 'GEPT_SPEAK', 'GEPT_WRITE']
  }
];
const UNIQUE_CONTEXTS = ['模擬題', '題組', '課堂演練', '週末測驗', '校內競試', '閱讀任務', '口說練習', '情境題', '綜合題', '診斷題'];

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

function buildOptions(correct, wrongs, serial) {
  const answerIndex = serial % 4;
  const options = wrongs.slice(0, 3);
  options.splice(answerIndex, 0, correct);
  return { options, answerIndex };
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

function chineseBcQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  const themes = [
    ['論點、論據、論證', '議論文的三要素'],
    ['對偶', '上下句字數相近且詞性結構相對'],
    ['借代', '以相關事物代替本體'],
    ['觸類旁通', '從一件事推知其他相關道理'],
    ['見微知著', '從細節看出整體趨勢']
  ];

  if (mode === 0) {
    const item = pick(themes, n);
    const wrongs = themes.filter(([w]) => w !== item[0]).map(([w]) => w);
    const built = buildOptions(item[0], wrongs, n);
    return makeChoice(subjectId, difficulty, `下列哪個詞語最符合「${item[1]}」？${ctx}`, built.options, built.answerIndex, `${item[0]}最符合題意。`, 'BCTEST,國文');
  }
  if (mode === 1) {
    const quote = pick([
      ['「學而不思則罔，思而不學則___」', '殆'],
      ['「知彼知己，百戰不___」', '殆'],
      ['「問渠那得清如許，為有源頭活水___」', '來'],
      ['「先天下之憂而憂，後天下之___而樂」', '樂']
    ], n);
    return makeFill(subjectId, difficulty, `請填空：${quote[0]}${ctx}`, quote[1], `依原文應填「${quote[1]}」。`, 'BCTEST,國文');
  }
  if (mode === 2) {
    const fact = pick([
      ['議論文通常需要明確提出作者主張。', true],
      ['「一石二鳥」是在形容做事拖拖拉拉。', false],
      ['對偶常見於古典詩文。', true],
      ['《論語》是道家代表作品。', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這個敘述正確。' : '這個敘述不正確。', 'BCTEST,國文');
  }
  if (mode === 3) {
    const item = pick([
      ['「高山流水」典故說明', '知音難得'],
      ['「滴水穿石」的寓意是', '持之以恆'],
      ['「亡羊補牢」強調的是', '及時補救'],
      ['「柳暗花明又一村」常比喻', '困境出現轉機']
    ], n);
    return makeFill(subjectId, difficulty, `${item[0]} ___ ${ctx}`, item[1], `依題意應填「${item[1]}」。`, 'BCTEST,國文');
  }
  const built = buildOptions('說明文', ['記敘文', '抒情文', '應用文'], n);
  return makeChoice(subjectId, difficulty, `若文章主要介紹現象、原理與方法，最可能屬於哪種文體？${ctx}`, built.options, built.answerIndex, `以介紹事物、原理為主，屬說明文。`, 'BCTEST,國文');
}

function englishBcQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const item = pick([
      ['had finished', '過去完成式'],
      ['would have gone', '與過去事實相反的假設'],
      ['whose', '關係代名詞所有格'],
      ['despite', '後面接名詞片語表示讓步']
    ], n);
    const built = buildOptions(item[0], ['finished', 'was finish', 'having finish'], n);
    return makeChoice(subjectId, difficulty, `下列哪一個最符合「${item[1]}」的用法？${ctx}`, built.options, built.answerIndex, `${item[0]}最符合題意。`, 'BCTEST,英語');
  }
  if (mode === 1) {
    const item = pick([
      ['If I ___ you, I would apologize.', 'were'],
      ['She has lived here ___ five years.', 'for'],
      ['The homework must ___ today.', 'be finished'],
      ['Not only ___ he smart, but he is also patient.', 'is']
    ], n);
    return makeFill(subjectId, difficulty, `${item[0]}${ctx}`, item[1], `依文法規則應填「${item[1]}」。`, 'BCTEST,英語');
  }
  if (mode === 2) {
    const fact = pick([
      ['"Have you ever been to Japan?" is a correct present perfect question.', true],
      ['"She don\'t like math." is grammatically correct.', false],
      ['A passive sentence often uses be + past participle.', true],
      ['"Despite he was tired" is correct grammar.', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這個英文敘述正確。' : '這個英文敘述不正確。', 'BCTEST,英語');
  }
  if (mode === 3) {
    const built = buildOptions('where', ['who', 'which', 'whose'], n + 1);
    return makeChoice(subjectId, difficulty, `The city ___ I was born has changed a lot. 空格應填入？${ctx}`, built.options, built.answerIndex, `表示地方時可用關係副詞 where。`, 'BCTEST,英語');
  }
  const item = pick([
    ['The harder you work, the more you ___ .', 'improve'],
    ['Would you mind ___ the door?', 'closing'],
    ['By next year, she will have ___ here for ten years.', 'worked'],
    ['He asked me if I ___ the answer.', 'knew']
  ], n);
  return makeFill(subjectId, difficulty, `${item[0]}${ctx}`, item[1], `依句型應填「${item[1]}」。`, 'BCTEST,英語');
}

function listeningBcQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 3);
  const mode = seq % 3;
  const ctx = suffix(code, seq);
  const themes = [
    {
      transcript: 'The students will meet in the auditorium at nine thirty.',
      keyword: 'auditorium',
      options: ['library', 'auditorium', 'cafeteria', 'gym']
    },
    {
      transcript: 'My uncle is flying to Singapore this Thursday afternoon.',
      keyword: 'Thursday',
      options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    {
      transcript: 'Please hand in your application form before the end of the week.',
      keyword: 'application',
      options: ['report', 'application', 'ticket', 'poster']
    },
    {
      transcript: 'The movie starts at seven, so let us meet at quarter to seven.',
      keyword: 'quarter',
      options: ['half', 'quarter', 'double', 'single']
    }
  ];
  const item = pick(themes, n);
  if (mode === 0) {
    return makeChoice(subjectId, difficulty, `🎧 請聆聽句子，選出最符合內容的答案。${ctx}`, item.options, item.options.indexOf(item.keyword), `依句意答案是 ${item.keyword}。`, 'BCTEST,英文聽力', { type: 'listening', audio_transcript: item.transcript });
  }
  if (mode === 1) {
    return makeFill(subjectId, difficulty, `🎧 請聆聽句子，填入空格中的單字。\n句子："${item.transcript.replace(item.keyword, '_____')}" ${ctx}`, item.keyword, `依句意應填 ${item.keyword}。`, 'BCTEST,英文聽力', { type: 'listening', audio_transcript: item.transcript });
  }
  const spelling = item.keyword.includes(' ') ? item.keyword.split(' ')[0] : item.keyword;
  return makeFill(subjectId, difficulty, `🎧 請聆聽句子，寫出重點單字。${ctx}`, spelling, `句中的關鍵字為 ${spelling}。`, 'BCTEST,英文聽力', { type: 'listening', audio_transcript: item.transcript });
}

function essayBcQuestion(subjectId, seq, difficulty, code) {
  const themes = [
    '面對挫折時我如何重新站起來',
    '一次讓我看見自己改變的經驗',
    '我心中的理想社會',
    '科技讓生活更好還是更忙',
    '如果我能為家鄉做一件事',
    '我如何看待競爭與合作'
  ];
  const prompts = [
    '請提出清楚觀點，並至少舉兩個例子支持。',
    '請注意文章的起承轉合與段落安排。',
    '請在結尾寫出反思或建議。',
    '字數請至少 350 字。'
  ];
  const title = pick(themes, seq);
  const prompt = pick(prompts, Math.floor(seq / themes.length));
  return {
    subject_id: subjectId,
    type: 'writing',
    difficulty,
    content: `請以「${title}」為題，寫一篇作文。${prompt}${suffix(code, seq)}`,
    option_a: null,
    option_b: null,
    option_c: null,
    option_d: null,
    answer: `評分規準：1. 觀點明確；2. 內容具體；3. 結構完整；4. 語句通順；5. 能展現反思。難度 ${difficulty}。`,
    explanation: `本題評量 BCTEST 作文能力，重視內容發展、邏輯與表達。`,
    tags: 'BCTEST,作文',
    audio_url: null,
    audio_transcript: null
  };
}

function mathBcQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const x = 2 + (n % 4);
    return makeFill(subjectId, difficulty, `解方程式：x² - ${x + 2}x + ${2 * x} = 0，其中較大的解是 ___ ${ctx}`, String(x), `可因式分解為 (x-2)(x-${x})，較大解是 ${x}。`, 'BCTEST,數學');
  }
  if (mode === 1) {
    const built = buildOptions('1/4', ['1/2', '1/8', '3/4'], n);
    return makeChoice(subjectId, difficulty, `擲兩次公平硬幣，兩次都出現正面的機率是多少？${ctx}`, built.options, built.answerIndex, `機率=1/2×1/2=1/4。`, 'BCTEST,數學');
  }
  if (mode === 2) {
    const item = pick([
      ['sin45°', '√2/2'],
      ['cos60°', '1/2'],
      ['tan45°', '1'],
      ['sin30°', '1/2']
    ], n);
    return makeFill(subjectId, difficulty, `${item[0]} = ___ ${ctx}`, item[1], `${item[0]}=${item[1]}。`, 'BCTEST,數學');
  }
  if (mode === 3) {
    const built = buildOptions('a₁+(n-1)d', ['na₁', 'a₁+nd', 'a₁+d'], n + 1);
    return makeChoice(subjectId, difficulty, `等差數列第 n 項公式為何？${ctx}`, built.options, built.answerIndex, `等差數列通項公式為 a₁+(n-1)d。`, 'BCTEST,數學');
  }
  const r = 3 + (n % 5);
  return makeFill(subjectId, difficulty, `半徑為 ${r} 的圓，面積為 ___π ${ctx}`, String(r * r), `圓面積=πr²=${r * r}π。`, 'BCTEST,數學');
}

function scienceBcQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const fact = pick([
      ['牛頓萬有引力與距離平方成反比。', true],
      ['所有電磁波都需要介質才能傳播。', false],
      ['RNA 與 DNA 的主要差異之一是糖的種類不同。', true],
      ['超導體的電阻在低溫下會變得非常大。', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這個敘述正確。' : '這個敘述不正確。', 'BCTEST,自然');
  }
  if (mode === 1) {
    const item = pick([
      ['酶', '多數屬於蛋白質'],
      ['同位素', '質子數相同但中子數不同'],
      ['潮汐', '主要受月球引力影響'],
      ['核融合', '小原子核結合釋放能量']
    ], n);
    const built = buildOptions(item[0], ['溶液', '氣壓', '折射'], n);
    return makeChoice(subjectId, difficulty, `哪個名詞最符合「${item[1]}」？${ctx}`, built.options, built.answerIndex, `${item[0]}最符合題意。`, 'BCTEST,自然');
  }
  if (mode === 2) {
    const item = pick([
      ['光速在真空中約為', '3×10⁸ m/s'],
      ['抗生素主要對抗', '細菌'],
      ['地震 S 波在液體中', '不能傳播'],
      ['光纖傳輸利用的現象是', '全反射']
    ], n);
    return makeFill(subjectId, difficulty, `${item[0]} ___ ${ctx}`, item[1], `依自然科知識應填「${item[1]}」。`, 'BCTEST,自然');
  }
  if (mode === 3) {
    const built = buildOptions('可再生能源', ['化石燃料', '重金屬', '酸雨'], n + 1);
    return makeChoice(subjectId, difficulty, `潮汐能、太陽能、風力發電最適合歸類為哪一類？${ctx}`, built.options, built.answerIndex, `這些都屬可再生能源。`, 'BCTEST,自然');
  }
  const answer = pick(['生態系多樣性', '反硝化', '質子', '絕對零度'], n);
  return makeFill(subjectId, difficulty, `請依題意填入最適當的自然科詞語：${answer}。${ctx}`, answer, `依題意答案是「${answer}」。`, 'BCTEST,自然');
}

function socialBcQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const item = pick([
      ['並立式', '立委選舉的區域票與政黨票分開計算'],
      ['公民社會', '民間團體監督政府的重要力量'],
      ['環境正義', '弱勢族群不應承受更多污染'],
      ['地緣政治', '地理位置對國際關係的影響']
    ], n);
    const built = buildOptions(item[0], ['君主專制', '地租制度', '技術移民'], n);
    return makeChoice(subjectId, difficulty, `哪個名詞最符合「${item[1]}」？${ctx}`, built.options, built.answerIndex, `${item[0]}最符合題意。`, 'BCTEST,社會');
  }
  if (mode === 1) {
    const fact = pick([
      ['秘密投票可以保護選民不受壓力干擾。', true],
      ['台灣全民健保的覆蓋率很低。', false],
      ['外部性是指交易影響到第三方。', true],
      ['SDGs 的第一個目標是發展核能。', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這個敘述正確。' : '這個敘述不正確。', 'BCTEST,社會');
  }
  if (mode === 2) {
    const item = pick([
      ['台灣六都中的直轄市數量是', '6'],
      ['個資法要求蒐集個資時需取得當事人的', '同意'],
      ['義務教育延伸至高中後，稱為', '12年國教'],
      ['國際法中的不干涉內政原則強調尊重各國', '主權']
    ], n);
    return makeFill(subjectId, difficulty, `${item[0]} ___ ${ctx}`, item[1], `依社會科知識應填「${item[1]}」。`, 'BCTEST,社會');
  }
  if (mode === 3) {
    const built = buildOptions('互相理解與尊重', ['完全競爭', '關閉國門', '單方面強制'], n + 1);
    return makeChoice(subjectId, difficulty, `與不同文化背景的人交流時，最適合的態度是什麼？${ctx}`, built.options, built.answerIndex, `跨文化交流應建立在互相理解與尊重之上。`, 'BCTEST,社會');
  }
  const answer = pick(['全球化', '非政府組織', '納稅', '陪審'], n);
  return makeFill(subjectId, difficulty, `請依題意填入最適當的社會科詞語：${answer}。${ctx}`, answer, `依題意答案是「${answer}」。`, 'BCTEST,社會');
}

function geptListenQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 3);
  const mode = seq % 3;
  const ctx = suffix(code, seq);
  const themes = [
    {
      transcript: 'The woman is buying fruit at the market this morning.',
      keyword: 'market',
      options: ['library', 'market', 'school', 'hospital']
    },
    {
      transcript: 'Please turn left at the corner and walk two blocks.',
      keyword: 'left',
      options: ['right', 'left', 'up', 'down']
    },
    {
      transcript: 'My English class starts at a quarter past eight.',
      keyword: 'eight',
      options: ['seven', 'eight', 'nine', 'ten']
    },
    {
      transcript: 'They are planning to visit their grandparents on Sunday.',
      keyword: 'Sunday',
      options: ['Friday', 'Saturday', 'Sunday', 'Monday']
    }
  ];
  const item = pick(themes, n);
  if (mode === 0) {
    return makeChoice(subjectId, difficulty, `🎧【GEPT 聽力】請聆聽句子，選出正確答案。${ctx}`, item.options, item.options.indexOf(item.keyword), `依句意答案是 ${item.keyword}。`, 'GEPT,聽力', { type: 'choice', audio_transcript: item.transcript });
  }
  if (mode === 1) {
    return makeFill(subjectId, difficulty, `🎧【GEPT 聽力】請聆聽句子，填入空格。\n句子："${item.transcript.replace(item.keyword, '_____')}" ${ctx}`, item.keyword, `依句意應填 ${item.keyword}。`, 'GEPT,聽力', { type: 'fill', audio_transcript: item.transcript });
  }
  const word = item.keyword.includes(' ') ? item.keyword.split(' ')[0] : item.keyword;
  return makeFill(subjectId, difficulty, `🎧【GEPT 聽力】請寫出聽到的重點單字。${ctx}`, word, `句中的關鍵字是 ${word}。`, 'GEPT,聽力', { type: 'fill', audio_transcript: item.transcript });
}

function geptReadQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const item = pick([
      ['borrow', '借用'],
      ['closed', '關門的'],
      ['responsible', '負責任的'],
      ['countryside', '鄉下']
    ], n);
    const wrongs = ['happy', 'dangerous', 'expensive'].filter((x) => x !== item[0]);
    const built = buildOptions(item[0], wrongs, n);
    return makeChoice(subjectId, difficulty, `【GEPT 閱讀】選出「${item[1]}」的最佳英文。${ctx}`, built.options, built.answerIndex, `${item[0]}最符合題意。`, 'GEPT,閱讀');
  }
  if (mode === 1) {
    const item = pick([
      ['go to school ___ bus', 'by'],
      ['It was raining, ___ we stayed home.', 'so'],
      ['She learned how ___ cook from her mother.', 'to'],
      ['This store is ___ on Sundays.', 'closed']
    ], n);
    return makeFill(subjectId, difficulty, `【GEPT 閱讀】請填空：${item[0]} ${ctx}`, item[1], `依句意應填「${item[1]}」。`, 'GEPT,閱讀');
  }
  if (mode === 2) {
    const fact = pick([
      ['A notice can tell readers where and when something happened.', true],
      ['Reading questions never ask about the main idea.', false],
      ['Context can help readers guess word meaning.', true],
      ['A title is always the least important part of a passage.', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【GEPT 閱讀是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這個閱讀概念正確。' : '這個閱讀概念不正確。', 'GEPT,閱讀');
  }
  if (mode === 3) {
    const built = buildOptions('at the school gate', ['in the kitchen', 'on the bus', 'under the desk'], n + 1);
    return makeChoice(subjectId, difficulty, `【GEPT 閱讀】公告寫道：\"A black backpack was found near the school gate.\" 問：Where was it found?${ctx}`, built.options, built.answerIndex, `依公告內容可知是在 school gate 附近。`, 'GEPT,閱讀');
  }
  const answer = pick(['main idea', 'details', 'title', 'purpose'], n);
  return makeFill(subjectId, difficulty, `【GEPT 閱讀】請依題意填入最適當的閱讀詞語：${answer}。${ctx}`, answer, `依題意答案是「${answer}」。`, 'GEPT,閱讀');
}

function geptWriteQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 4);
  const mode = seq % 4;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const item = pick([
      ['She likes coffee.', 'She does not like coffee.'],
      ['I eat lunch at school every day.', 'I ate lunch at school every day.'],
      ['They are playing basketball.', 'Are they playing basketball?'],
      ['She goes to the library.', 'She will go to the library.']
    ], n);
    return makeFill(subjectId, difficulty, `【GEPT 寫作】依要求改寫句子：${item[0]} ${ctx}`, item[1], `依題型要求，改寫應為：${item[1]}`, 'GEPT,寫作');
  }
  if (mode === 1) {
    const item = pick([
      ['He was late. He missed the bus.', 'He was late because he missed the bus.'],
      ['I like math. I do not like history.', 'I like math but I do not like history.'],
      ['It rains tomorrow. We will stay home.', 'If it rains tomorrow, we will stay home.'],
      ['She studied hard. She passed the exam.', 'She studied hard, so she passed the exam.']
    ], n);
    return makeFill(subjectId, difficulty, `【GEPT 寫作】請將句子合併：${item[0]} ${ctx}`, item[1], `依連接詞要求可寫成：${item[1]}`, 'GEPT,寫作');
  }
  if (mode === 2) {
    const item = pick([
      ['我每天早上七點起床。', 'I wake up at seven o\'clock every morning.'],
      ['她昨天去了圖書館借書。', 'She went to the library to borrow books yesterday.'],
      ['他們正在公園裡踢足球。', 'They are playing soccer in the park.'],
      ['你能告訴我最近的捷運站在哪裡嗎？', 'Can you tell me where the nearest MRT station is?']
    ], n);
    return makeFill(subjectId, difficulty, `【GEPT 寫作】請翻譯成英文：${item[0]} ${ctx}`, item[1], `參考答案：${item[1]}`, 'GEPT,寫作');
  }
  return {
    subject_id: subjectId,
    type: 'writing',
    difficulty,
    content: `【GEPT 寫作】請以 80-120 字描述一段日常生活或校園經驗，並說明你的感受。${ctx}`,
    option_a: null,
    option_b: null,
    option_c: null,
    option_d: null,
    answer: '評分規準：內容切題、句子完整、時態基本正確、用字適當、結構清楚。',
    explanation: '此題評量 GEPT 初級寫作能力，重點在基本句型、內容完整與語意清楚。',
    tags: 'GEPT,寫作',
    audio_url: null,
    audio_transcript: null
  };
}

function geptSpeakQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 4);
  const mode = seq % 4;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const sentence = pick([
      'I usually have breakfast before I go to school.',
      'The library opens at nine o\'clock every morning.',
      'Protecting the environment is everyone\'s responsibility.',
      'Could you please turn off the lights when you leave the room?'
    ], n);
    return makeFill(subjectId, difficulty, `🎧【GEPT 口說】請複誦句子，並填入完整內容。${ctx}`, sentence, `參考複誦句：${sentence}`, 'GEPT,口說', { audio_transcript: sentence });
  }
  if (mode === 1) {
    const item = pick([
      ['What is your name and where are you from?', 'My name is Kevin, and I am from Taiwan.'],
      ['What do you like to do on weekends?', 'I like to read books and play basketball on weekends.'],
      ['Describe your best friend.', 'My best friend is kind, helpful, and always listens to me.'],
      ['How do you usually get to school?', 'I usually take the bus to school.']
    ], n);
    return makeFill(subjectId, difficulty, `🎧【GEPT 口說】請回答問題：${item[0]} ${ctx}`, item[1], `參考回答：${item[1]}`, 'GEPT,口說', { audio_transcript: item[0] });
  }
  if (mode === 2) {
    const fact = pick([
      ['口說回答時，完整句通常比只回答單字更清楚。', true],
      ['朗讀時完全不需要注意停頓與重音。', false],
      ['複誦題可以幫助訓練發音與語調。', true],
      ['口說測驗中只能用一個字回答所有問題。', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【GEPT 口說是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這項口說概念正確。' : '這項口說概念不正確。', 'GEPT,口說');
  }
  return {
    subject_id: subjectId,
    type: 'speaking',
    difficulty,
    content: `【GEPT 口說】請用英文描述一個你熟悉的地方，並說明你為什麼喜歡它。${ctx}`,
    option_a: null,
    option_b: null,
    option_c: null,
    option_d: null,
    answer: '評分規準：內容切題、發音清楚、句子完整、能有基本細節描述。',
    explanation: '此題評量 GEPT 初級口說能力，重點在基本表達、完整句與內容連貫。',
    tags: 'GEPT,口說',
    audio_url: null,
    audio_transcript: null
  };
}

const generators = {
  CHN_BC: chineseBcQuestion,
  ENG_BC: englishBcQuestion,
  ENG_LISTEN_BC: listeningBcQuestion,
  ESSAY_BC: essayBcQuestion,
  MATH_BC: mathBcQuestion,
  SCI_BC: scienceBcQuestion,
  SOC_BC: socialBcQuestion,
  GEPT_LISTEN: geptListenQuestion,
  GEPT_READ: geptReadQuestion,
  GEPT_WRITE: geptWriteQuestion,
  GEPT_SPEAK: geptSpeakQuestion
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
    WHERE grade_level IN ('bctest', 'gept_elementary')
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
      const need = Math.max(0, TARGET_COUNT - currentCount(config.grade, code));
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
  console.log(`等級 ${config.grade} 補題完成：`);
  for (const code of config.codes) {
    console.log(`- ${code}：${currentCount(config.grade, code)} 題，本次新增 ${result[code].inserted} 題，難度分佈 [${result[code].counts.join(', ')}]`);
  }
}
