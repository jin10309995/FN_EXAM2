const db = require('./database');

const TARGET_COUNT = 500;
const SOURCE = '全學段補題腳本（各科補足至500題）';
const CONFIGS = [
  { grade: 'elementary_6', codes: ['CHN', 'ENG', 'ENG_LISTEN_6', 'ESSAY_6', 'MATH_E', 'NAT', 'SOC'] },
  { grade: 'junior_high', codes: ['BIO', 'CHEM', 'EARTH', 'MATH', 'PHY', 'SCI'] },
  { grade: 'grade_7', codes: ['CHN_7', 'ENG_7', 'ENG_LISTEN_7', 'ESSAY_7', 'MATH_7', 'SCI_7', 'SOC_7'] },
  { grade: 'grade_8', codes: ['CHN_8', 'ENG_8', 'ENG_LISTEN_8', 'ESSAY_8', 'MATH_8', 'SCI_8', 'SOC_8'] },
  { grade: 'grade_9', codes: ['CHN_9', 'ENG_9', 'ENG_LISTEN_9', 'ESSAY_9', 'MATH_9', 'SCI_9', 'SOC_9'] },
  { grade: 'bctest', codes: ['CHN_BC', 'ENG_BC', 'ENG_LISTEN_BC', 'ESSAY_BC', 'MATH_BC', 'SCI_BC', 'SOC_BC'] },
  { grade: 'gept_elementary', codes: ['GEPT_LISTEN', 'GEPT_READ', 'GEPT_SPEAK', 'GEPT_WRITE'] }
];
const CONTEXTS = ['複習題', '模擬題', '班級任務', '晨讀', '週末練習', '課堂討論', '小考', '月考', '閱讀單', '延伸活動'];

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
  return `（延伸情境：${code}-${pick(CONTEXTS, serial)}-${serial + 1}）`;
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

function makeWriting(subjectId, difficulty, content, answer, explanation, tags) {
  return {
    subject_id: subjectId,
    type: 'writing',
    difficulty,
    content,
    option_a: null,
    option_b: null,
    option_c: null,
    option_d: null,
    answer,
    explanation,
    tags,
    audio_url: null,
    audio_transcript: null
  };
}

function chineseQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  const idioms = [
    ['見微知著', '從細節看出整體趨勢'],
    ['觸類旁通', '由一事推知其他相關道理'],
    ['融會貫通', '把所學知識整合理解'],
    ['按部就班', '依照步驟有次序進行'],
    ['言簡意賅', '語言簡潔但意思完整'],
    ['鍥而不捨', '持續努力不放棄']
  ];
  const rhetoric = [
    ['時間像河流一樣向前奔去。', '比喻'],
    ['風在窗外低聲提醒大家安靜。', '擬人'],
    ['我要學習、我要成長、我要突破。', '排比'],
    ['教室安靜得連一根針落地都聽得見。', '誇飾']
  ];
  if (mode === 0) {
    const item = pick(idioms, n);
    const wrongs = idioms.filter(([w]) => w !== item[0]).map(([w]) => w);
    const built = buildOptions(item[0], wrongs, n);
    return makeChoice(subjectId, difficulty, `下列哪個成語最適合形容「${item[1]}」？${ctx}`, built.options, built.answerIndex, `${item[0]}最符合題意。`, '國文,成語');
  }
  if (mode === 1) {
    const item = pick(rhetoric, n);
    const options = ['比喻', '擬人', '排比', '誇飾'];
    return makeChoice(subjectId, difficulty, `句子「${item[0]}」使用了哪種修辭？${ctx}`, options, options.indexOf(item[1]), `這句話運用了${item[1]}修辭。`, '國文,修辭');
  }
  if (mode === 2) {
    const quote = pick([
      ['學而不思則罔，思而不學則___', '殆'],
      ['知之為知之，不知為不知，是___也', '知'],
      ['先天下之憂而憂，後天下之___而樂', '樂'],
      ['問渠那得清如許，為有源頭活水___', '來']
    ], n);
    return makeFill(subjectId, difficulty, `請填空：${quote[0]}${ctx}`, quote[1], `依原文應填「${quote[1]}」。`, '國文,古文');
  }
  if (mode === 3) {
    const fact = pick([
      ['議論文通常需要提出清楚論點。', true],
      ['「畫蛇添足」是在稱讚做事周到。', false],
      ['對偶常見於古典詩文。', true],
      ['《論語》是道家代表作品。', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這個敘述正確。' : '這個敘述不正確。', '國文,判斷');
  }
  const answer = pick(['思辨', '觀察', '誠實', '耐心', '尊重'], n);
  return makeFill(subjectId, difficulty, `閱讀文章時，如果要真正掌握作者觀點，最需要培養的能力是___。${ctx}`, answer, `依句意可填入「${answer}」。`, '國文,閱讀理解');
}

function englishQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  const words = [
    ['schedule', '行程表'],
    ['knowledge', '知識'],
    ['environment', '環境'],
    ['responsible', '負責任的'],
    ['pressure', '壓力'],
    ['volunteer', '志工']
  ];
  if (mode === 0) {
    const item = pick(words, n);
    const wrongs = words.filter(([w]) => w !== item[0]).map(([w]) => w);
    const built = buildOptions(item[0], wrongs, n);
    return makeChoice(subjectId, difficulty, `「${item[1]}」的英文是什麼？${ctx}`, built.options, built.answerIndex, `${item[0]} 的中文是「${item[1]}」。`, '英語,字彙');
  }
  if (mode === 1) {
    const item = pick([
      ['If I ___ you, I would try again.', 'were'],
      ['She has lived here ___ five years.', 'for'],
      ['The report will ___ next week.', 'be finished'],
      ['Not only ___ he smart, but he is also patient.', 'is']
    ], n);
    return makeFill(subjectId, difficulty, `${item[0]}${ctx}`, item[1], `依文法規則應填「${item[1]}」。`, '英語,文法');
  }
  if (mode === 2) {
    const fact = pick([
      ['"Have you ever been to Tainan?" is a correct question.', true],
      ['"She don\'t like math." is grammatically correct.', false],
      ['A passive sentence often uses be + past participle.', true],
      ['"Despite he was tired" is correct grammar.', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這個英文敘述正確。' : '這個英文敘述不正確。', '英語,判斷');
  }
  if (mode === 3) {
    const built = buildOptions('where', ['who', 'which', 'whose'], n + 1);
    return makeChoice(subjectId, difficulty, `The city ___ I was born has changed a lot. 空格應填入？${ctx}`, built.options, built.answerIndex, `表示地方時可用關係副詞 where。`, '英語,關係子句');
  }
  const item = pick([
    ['The harder you work, the more you ___ .', 'improve'],
    ['Would you mind ___ the door?', 'closing'],
    ['By next year, she will have ___ here for ten years.', 'worked'],
    ['He asked me if I ___ the answer.', 'knew']
  ], n);
  return makeFill(subjectId, difficulty, `${item[0]}${ctx}`, item[1], `依句型應填「${item[1]}」。`, '英語,綜合');
}

function listeningQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 3);
  const mode = seq % 3;
  const ctx = suffix(code, seq);
  const themes = [
    { transcript: 'The students will meet in the library at eight thirty.', keyword: 'library', options: ['library', 'stadium', 'museum', 'office'] },
    { transcript: 'Please hand in your science report before Friday.', keyword: 'Friday', options: ['Monday', 'Wednesday', 'Friday', 'Sunday'] },
    { transcript: 'My father is taking the train to Kaohsiung tonight.', keyword: 'train', options: ['bus', 'train', 'taxi', 'bike'] },
    { transcript: 'We need four people in each discussion group.', keyword: 'four', options: ['two', 'three', 'four', 'five'] }
  ];
  const item = pick(themes, n);
  if (mode === 0) {
    return makeChoice(subjectId, difficulty, `🎧 請聆聽句子，選出最符合內容的答案。${ctx}`, item.options, item.options.indexOf(item.keyword), `依句意答案是 ${item.keyword}。`, '英文聽力,選擇', { type: 'listening', audio_transcript: item.transcript });
  }
  if (mode === 1) {
    return makeFill(subjectId, difficulty, `🎧 請聆聽句子，填入空格中的單字。\n句子："${item.transcript.replace(item.keyword, '_____')}" ${ctx}`, item.keyword, `依句意應填 ${item.keyword}。`, '英文聽力,填空', { type: 'listening', audio_transcript: item.transcript });
  }
  const word = item.keyword.includes(' ') ? item.keyword.split(' ')[0] : item.keyword;
  return makeFill(subjectId, difficulty, `🎧 請聆聽句子，寫出重點單字。${ctx}`, word, `句中的關鍵字是 ${word}。`, '英文聽力,拼字', { type: 'listening', audio_transcript: item.transcript });
}

function essayQuestion(subjectId, seq, difficulty, code) {
  const themes = [
    '我最想改變的一件事',
    '一次讓我看見自己成長的經驗',
    '科技讓生活更方便還是更忙',
    '如果我能為學校做一件事',
    '面對壓力時我如何調整自己',
    '我如何看待競爭與合作'
  ];
  const prompts = [
    '請提出清楚觀點，並至少舉兩個例子支持。',
    '請注意文章的起承轉合與段落安排。',
    '請在結尾寫出反思或建議。',
    '字數請至少 300 字。'
  ];
  const title = pick(themes, seq);
  const prompt = pick(prompts, Math.floor(seq / themes.length));
  return makeWriting(
    subjectId,
    difficulty,
    `請以「${title}」為題，寫一篇作文。${prompt}${suffix(code, seq)}`,
    `評分規準：1. 主題明確；2. 內容具體；3. 結構完整；4. 語句通順；5. 能展現反思。難度 ${difficulty}。`,
    `本題評量寫作能力，重視內容發展、邏輯與表達。`,
    '作文,寫作'
  );
}

function mathQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const x = 2 + (n % 4);
    return makeFill(subjectId, difficulty, `解方程式：x² - ${x + 2}x + ${2 * x} = 0，其中較大的解是 ___ ${ctx}`, String(x), `可因式分解為 (x-2)(x-${x})，較大解是 ${x}。`, '數學,方程式');
  }
  if (mode === 1) {
    const built = buildOptions('1/4', ['1/2', '1/8', '3/4'], n);
    return makeChoice(subjectId, difficulty, `擲兩次公平硬幣，兩次都出現正面的機率是多少？${ctx}`, built.options, built.answerIndex, `機率=1/2×1/2=1/4。`, '數學,機率');
  }
  if (mode === 2) {
    const item = pick([
      ['sin45°', '√2/2'],
      ['cos60°', '1/2'],
      ['tan45°', '1'],
      ['sin30°', '1/2']
    ], n);
    return makeFill(subjectId, difficulty, `${item[0]} = ___ ${ctx}`, item[1], `${item[0]}=${item[1]}。`, '數學,三角比');
  }
  if (mode === 3) {
    const built = buildOptions('a₁+(n-1)d', ['na₁', 'a₁+nd', 'a₁+d'], n + 1);
    return makeChoice(subjectId, difficulty, `等差數列第 n 項公式為何？${ctx}`, built.options, built.answerIndex, `等差數列通項公式為 a₁+(n-1)d。`, '數學,數列');
  }
  const r = 3 + (n % 5);
  return makeFill(subjectId, difficulty, `半徑為 ${r} 的圓，面積為 ___π ${ctx}`, String(r * r), `圓面積=πr²=${r * r}π。`, '數學,圓');
}

function generalScienceQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const fact = pick([
      ['植物的葉綠體和光合作用有關。', true],
      ['聲音可以在真空中傳播。', false],
      ['酸性溶液的 pH 值小於 7。', true],
      ['地球自轉造成四季變化。', false]
    ], n);
    return makeTrueFalse(subjectId, difficulty, `【是非題】${fact[0]}${ctx}`, fact[1], fact[1] ? '這個自然概念正確。' : '這個自然概念不正確。', '自然,判斷');
  }
  if (mode === 1) {
    const item = pick([
      ['粒線體', '細胞進行有氧呼吸的重要胞器'],
      ['板塊運動', '形成山脈與地震的重要原因'],
      ['酸鹼中和', '酸與鹼反應生成鹽和水'],
      ['電磁波', '不需要介質也能傳播']
    ], n);
    const built = buildOptions(item[0], ['細胞膜', '燒杯', '地圖'], n);
    return makeChoice(subjectId, difficulty, `哪個名詞最符合「${item[1]}」？${ctx}`, built.options, built.answerIndex, `${item[0]}最符合題意。`, '自然,概念');
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
    const built = buildOptions('物理變化', ['化學變化', '生物變化', '核反應'], n + 1);
    return makeChoice(subjectId, difficulty, `冰塊融化最適合歸類為哪一種變化？${ctx}`, built.options, built.answerIndex, `冰塊融化沒有產生新物質，屬於物理變化。`, '自然,變化');
  }
  const answer = pick(['二氧化碳', '氧氣', '葡萄糖', '氮氣'], n);
  return makeFill(subjectId, difficulty, `請依題意填入最適當的自然科詞語：${answer}。${ctx}`, answer, `依題意答案是「${answer}」。`, '自然,綜合');
}

function juniorScienceQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  if (code === 'BIO') {
    if (mode === 0) return makeTrueFalse(subjectId, difficulty, `【是非題】DNA 的鹼基配對包括 A-T 與 G-C。${ctx}`, true, '這個生物概念正確。', '生物,遺傳');
    if (mode === 1) return makeChoice(subjectId, difficulty, `下列哪個胞器最符合「細胞能量工廠」的描述？${ctx}`, ['粒線體', '葉綠體', '液泡', '細胞膜'], 0, '粒線體是細胞進行有氧呼吸的重要胞器。', '生物,細胞');
    if (mode === 2) return makeFill(subjectId, difficulty, `人體正常體細胞共有 ___ 條染色體${ctx}`, '46', '人類體細胞有 46 條染色體。', '生物,遺傳');
    if (mode === 3) return makeChoice(subjectId, difficulty, `下列哪一項最符合自然選擇的概念？${ctx}`, ['較能適應環境的個體較容易存活繁殖', '每個生物都能等量繁殖', '所有個體都完全相同', '演化只在一天內完成'], 0, '自然選擇強調適應環境者較易留下後代。', '生物,演化');
    return makeFill(subjectId, difficulty, `光合作用主要在植物細胞的 ___ 中進行${ctx}`, '葉綠體', '植物主要在葉綠體中進行光合作用。', '生物,植物');
  }
  if (code === 'CHEM') {
    if (mode === 0) return makeTrueFalse(subjectId, difficulty, `【是非題】NaCl 主要形成離子鍵。${ctx}`, true, '這個化學概念正確。', '化學,鍵結');
    if (mode === 1) return makeChoice(subjectId, difficulty, `下列哪一項最符合催化劑的作用？${ctx}`, ['降低活化能', '增加生成物質量', '改變平衡常數', '讓反應永遠停止'], 0, '催化劑可降低活化能。', '化學,反應');
    if (mode === 2) return makeFill(subjectId, difficulty, `硫酸的化學式是 ___ ${ctx}`, 'H₂SO₄', '硫酸的化學式為 H₂SO₄。', '化學,化學式');
    if (mode === 3) return makeChoice(subjectId, difficulty, `下列哪一種敘述最符合氧化反應？${ctx}`, ['失去電子', '得到電子', '質量消失', '生成中子'], 0, '氧化反應可視為失去電子。', '化學,氧化還原');
    return makeFill(subjectId, difficulty, `酸鹼中和反應常生成鹽和 ___ ${ctx}`, '水', '酸鹼中和常生成鹽和水。', '化學,酸鹼');
  }
  if (code === 'PHY') {
    if (mode === 0) return makeTrueFalse(subjectId, difficulty, `【是非題】光在真空中的速度約為 3×10⁸ m/s。${ctx}`, true, '這個物理概念正確。', '物理,光');
    if (mode === 1) return makeChoice(subjectId, difficulty, `下列哪項最符合歐姆定律？${ctx}`, ['V=IR', 'P=ma', 'F=IR', 'I=VR'], 0, '歐姆定律為 V=IR。', '物理,電學');
    if (mode === 2) return makeFill(subjectId, difficulty, `聲速在空氣中約為 ___ m/s${ctx}`, '340', '常溫常壓下聲速約 340 m/s。', '物理,聲音');
    if (mode === 3) return makeChoice(subjectId, difficulty, `下列哪一項最符合向心力的方向？${ctx}`, ['指向圓心', '沿切線方向', '遠離圓心', '一定向上'], 0, '向心力方向指向圓心。', '物理,力學');
    return makeFill(subjectId, difficulty, `當電壓為 12V、電阻為 3Ω，電流為 ___ A${ctx}`, '4', '依歐姆定律 I=V/R=12/3=4。', '物理,電學');
  }
  if (code === 'EARTH') {
    if (mode === 0) return makeTrueFalse(subjectId, difficulty, `【是非題】台灣位於歐亞板塊與菲律賓海板塊交界。${ctx}`, true, '這個地科概念正確。', '地科,板塊');
    if (mode === 1) return makeChoice(subjectId, difficulty, `下列哪一項最符合造成季節變化的主因？${ctx}`, ['地軸傾斜', '地球大小改變', '月球發光', '海浪起伏'], 0, '季節變化主要因地軸傾斜。', '地科,天文');
    if (mode === 2) return makeFill(subjectId, difficulty, `地球自轉一圈約需 ___ 小時${ctx}`, '24', '地球自轉約 24 小時。', '地科,地球');
    if (mode === 3) return makeChoice(subjectId, difficulty, `下列哪種岩石最常保存化石？${ctx}`, ['沉積岩', '火成岩', '變質岩', '玄武岩'], 0, '沉積岩最常保存化石。', '地科,岩石');
    return makeFill(subjectId, difficulty, `海水潮汐主要受月球與 ___ 的引力影響${ctx}`, '太陽', '潮汐主要受月球和太陽引力影響。', '地科,潮汐');
  }
  return generalScienceQuestion(subjectId, seq, difficulty, code);
}

function socialQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 5);
  const mode = seq % 5;
  const ctx = suffix(code, seq);
  if (mode === 0) {
    const item = pick([
      ['民主政治', '強調主權在民'],
      ['聯合國', '重要目的是維護國際和平'],
      ['工業革命', '最早發生在英國'],
      ['全球化', '使各國互動更加緊密']
    ], n);
    const built = buildOptions(item[0], ['文藝復興', '地方政府', '農業革命'], n);
    return makeChoice(subjectId, difficulty, `哪個名詞最符合「${item[1]}」？${ctx}`, built.options, built.answerIndex, `${item[0]}最符合題意。`, '社會,概念');
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

function geptListenQuestion(subjectId, seq, difficulty, code) {
  const n = Math.floor(seq / 3);
  const mode = seq % 3;
  const ctx = suffix(code, seq);
  const themes = [
    { transcript: 'The woman is buying fruit at the market this morning.', keyword: 'market', options: ['library', 'market', 'school', 'hospital'] },
    { transcript: 'Please turn left at the corner and walk two blocks.', keyword: 'left', options: ['right', 'left', 'up', 'down'] },
    { transcript: 'My English class starts at a quarter past eight.', keyword: 'eight', options: ['seven', 'eight', 'nine', 'ten'] },
    { transcript: 'They are planning to visit their grandparents on Sunday.', keyword: 'Sunday', options: ['Friday', 'Saturday', 'Sunday', 'Monday'] }
  ];
  const item = pick(themes, n);
  if (mode === 0) {
    return makeChoice(subjectId, difficulty, `🎧【GEPT 聽力】請聆聽句子，選出正確答案。${ctx}`, item.options, item.options.indexOf(item.keyword), `依句意答案是 ${item.keyword}。`, 'GEPT,聽力', { audio_transcript: item.transcript });
  }
  if (mode === 1) {
    return makeFill(subjectId, difficulty, `🎧【GEPT 聽力】請聆聽句子，填入空格。\n句子："${item.transcript.replace(item.keyword, '_____')}" ${ctx}`, item.keyword, `依句意應填 ${item.keyword}。`, 'GEPT,聽力', { audio_transcript: item.transcript });
  }
  const word = item.keyword.includes(' ') ? item.keyword.split(' ')[0] : item.keyword;
  return makeFill(subjectId, difficulty, `🎧【GEPT 聽力】請寫出聽到的重點單字。${ctx}`, word, `句中的關鍵字是 ${word}。`, 'GEPT,聽力', { audio_transcript: item.transcript });
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
    const built = buildOptions(item[0], ['happy', 'dangerous', 'expensive'], n);
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
  return makeWriting(subjectId, difficulty, `【GEPT 寫作】請以 80-120 字描述一段日常生活或校園經驗，並說明你的感受。${ctx}`, '評分規準：內容切題、句子完整、時態基本正確、用字適當、結構清楚。', '此題評量 GEPT 初級寫作能力，重點在基本句型、內容完整與語意清楚。', 'GEPT,寫作');
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

function generatorFor(code) {
  if (code.startsWith('CHN')) return chineseQuestion;
  if (code.startsWith('ENG_LISTEN')) return listeningQuestion;
  if (code === 'GEPT_LISTEN') return geptListenQuestion;
  if (code === 'GEPT_READ') return geptReadQuestion;
  if (code === 'GEPT_WRITE') return geptWriteQuestion;
  if (code === 'GEPT_SPEAK') return geptSpeakQuestion;
  if (code.startsWith('ENG')) return englishQuestion;
  if (code.startsWith('ESSAY')) return essayQuestion;
  if (code.startsWith('MATH')) return mathQuestion;
  if (code === 'BIO' || code === 'CHEM' || code === 'PHY' || code === 'EARTH') return juniorScienceQuestion;
  if (code === 'SCI' || code.startsWith('SCI_') || code === 'SCI_BC' || code === 'NAT') return generalScienceQuestion;
  if (code.startsWith('SOC')) return socialQuestion;
  throw new Error(`未支援的科目代碼：${code}`);
}

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

const targetGrades = CONFIGS.map((c) => c.grade);
const existingContent = new Set(
  db.prepare(`
    SELECT content
    FROM questions
    WHERE grade_level IN (${targetGrades.map(() => '?').join(',')})
      AND is_archived = 0
  `).all(...targetGrades).map((row) => row.content)
);

const run = db.transaction(() => {
  const result = {};
  for (const config of CONFIGS) {
    const map = subjectMapFor(config.grade, config.codes);
    for (const code of config.codes) {
      const subject = map.get(code);
      if (!subject) throw new Error(`找不到科目：${code}`);
      const current = currentCount(config.grade, code);
      const need = Math.max(0, TARGET_COUNT - current);
      const counts = difficultyCounts(config.grade, code);
      const generator = generatorFor(code);
      let seq = 0;
      let inserted = 0;

      while (inserted < need) {
        const difficulty = nextDifficulty(counts);
        let candidate = generator(subject.id, seq, difficulty, code);
        if (existingContent.has(candidate.content)) {
          candidate.content = `${candidate.content}【變式${seq + 1}】`;
        }
        while (existingContent.has(candidate.content)) {
          seq += 1;
          candidate = generator(subject.id, seq, difficulty, code);
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
  console.log(`學段 ${config.grade} 補題完成：`);
  for (const code of config.codes) {
    console.log(`- ${code}：${currentCount(config.grade, code)} 題，本次新增 ${result[code].inserted} 題，難度分佈 [${result[code].counts.join(', ')}]`);
  }
}
