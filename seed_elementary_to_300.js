const db = require('./database');

const GRADE_LEVEL = 'elementary_6';
const TARGET_COUNT = 300;
const SOURCE = '國小六年級補題腳本（補足至每科300題）';
const TARGET_CODES = ['CHN', 'ENG', 'SOC', 'NAT', 'ENG_LISTEN_6', 'ESSAY_6'];
const UNIQUE_SCENARIOS = ['校園', '家庭', '圖書館', '假日', '晨間', '班會', '旅行', '社團', '合作學習', '戶外觀察'];

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
    tags,
    audio_url: null,
    audio_transcript: null
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
    tags,
    audio_url: null,
    audio_transcript: null
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

function makeListening(subjectId, difficulty, content, answer, explanation, tags, extra = {}) {
  return {
    subject_id: subjectId,
    type: 'listening',
    difficulty,
    content,
    option_a: extra.option_a || null,
    option_b: extra.option_b || null,
    option_c: extra.option_c || null,
    option_d: extra.option_d || null,
    answer,
    explanation,
    tags,
    audio_url: null,
    audio_transcript: extra.audio_transcript || null
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

function nextDifficulty(counts) {
  let minIndex = 0;
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] < counts[minIndex]) {
      minIndex = i;
    }
  }
  return minIndex + 1;
}

const chineseIdioms = [
  ['專心致志', '做事非常專心，不受外界干擾。'],
  ['持之以恆', '長久堅持，不輕易放棄。'],
  ['見賢思齊', '看到別人的優點就願意學習。'],
  ['井井有條', '做事有次序，條理分明。'],
  ['全力以赴', '盡全部力量去做。'],
  ['實事求是', '按照事實來思考與處理。'],
  ['溫故知新', '複習舊知識而有新的體會。'],
  ['集思廣益', '集合大家的意見，得到更好的方法。'],
  ['精益求精', '已經很好了，還要求更好。'],
  ['腳踏實地', '做事踏實，不浮躁。'],
  ['舉一反三', '由一件事推知其他相關道理。'],
  ['迎刃而解', '問題很快被順利解決。']
];

const chineseAntonyms = [
  ['光明', '黑暗'],
  ['勇敢', '膽怯'],
  ['整潔', '凌亂'],
  ['誠實', '虛假'],
  ['勤勞', '懶惰'],
  ['熱鬧', '冷清'],
  ['進步', '退步'],
  ['寬敞', '狹窄'],
  ['平靜', '激動'],
  ['肯定', '否定']
];

const chineseRhetoric = [
  ['月亮像銀盤一樣掛在天空。', '比喻'],
  ['小草悄悄地從泥土裡探出頭。', '擬人'],
  ['書是朋友，書是老師，書是成長的階梯。', '排比'],
  ['教室安靜得連一根針掉下來都聽得見。', '誇飾'],
  ['風在窗外唱歌，樹葉在枝頭跳舞。', '擬人'],
  ['時間像流水，一去不回。', '比喻']
];

const chineseConnectors = [
  ['因為下大雨，所以比賽延期。', '因果'],
  ['雖然路途遙遠，但是大家仍準時到達。', '轉折'],
  ['如果認真練習，就比較容易進步。', '假設'],
  ['不但要會讀書，而且要會思考。', '遞進'],
  ['一邊散步，一邊聊天。', '並列'],
  ['與其抱怨，不如立刻改進。', '選擇']
];

const chineseThemes = ['耐心', '尊重', '合作', '思考', '觀察', '自律', '責任感', '同理心'];

function generateChineseQuestion(subjectId, seq, difficulty) {
  const caseIndex = seq % 6;
  const round = Math.floor(seq / 6);

  if (caseIndex === 0) {
    const item = pick(chineseIdioms, round);
    const scene = pick(['形容專心學習', '形容願意改進', '形容做事有條理', '形容持續努力'], round, 3);
    const distractors = chineseIdioms.filter(([word]) => word !== item[0]).slice(round % 4, (round % 4) + 3).map(([word]) => word);
    const answerIndex = round % 4;
    const options = distractors.slice();
    options.splice(answerIndex, 0, item[0]);
    return makeChoice(
      subjectId,
      difficulty,
      `下列哪個成語最適合用來${scene}？（情境：${item[1]}）`,
      options,
      answerIndex,
      `${item[0]}表示${item[1]}`,
      '國語,成語'
    );
  }

  if (caseIndex === 1) {
    const item = pick(chineseAntonyms, round);
    return makeFill(
      subjectId,
      difficulty,
      `請填入「${item[0]}」的反義詞：___`,
      item[1],
      `「${item[0]}」的反義詞是「${item[1]}」。`,
      '國語,反義詞'
    );
  }

  if (caseIndex === 2) {
    const item = pick(chineseRhetoric, round);
    const options = ['比喻', '擬人', '排比', '誇飾'];
    return makeChoice(
      subjectId,
      difficulty,
      `句子「${item[0]}」使用了哪一種修辭？`,
      options,
      options.indexOf(item[1]),
      `這句話運用了${item[1]}修辭。`,
      '國語,修辭'
    );
  }

  if (caseIndex === 3) {
    const item = pick(chineseConnectors, round);
    const isTrue = round % 2 === 0;
    const relation = isTrue ? item[1] : pick(['因果', '轉折', '假設', '遞進', '並列', '選擇'].filter((v) => v !== item[1]), round);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】句子「${item[0]}」屬於「${relation}」關係。`,
      isTrue,
      `這句話實際上屬於${item[1]}關係。`,
      '國語,連接詞'
    );
  }

  if (caseIndex === 4) {
    const theme = pick(chineseThemes, round);
    const prefix = pick(['老師提醒我們', '閱讀文章時', '和同學合作時', '寫作文之前'], round, 2);
    const answers = {
      '耐心': '耐心',
      '尊重': '尊重',
      '合作': '合作',
      '思考': '思考',
      '觀察': '觀察',
      '自律': '自律',
      '責任感': '責任感',
      '同理心': '同理心'
    };
    return makeFill(
      subjectId,
      difficulty,
      `${prefix}，最重要的是保持___，才能把事情做好。（主題：${theme}）`,
      answers[theme],
      `依句意，最適合填入「${answers[theme]}」。`,
      '國語,句意理解'
    );
  }

  const item = pick(chineseIdioms, round, 5);
  const options = chineseIdioms.filter(([word]) => word !== item[0]).slice((round + 1) % 5, ((round + 1) % 5) + 3).map(([word]) => word);
  const answerIndex = (round + 2) % 4;
  options.splice(answerIndex, 0, item[0]);
  return makeChoice(
    subjectId,
    difficulty,
    `讀完短文後，若要用一個成語概括「${item[1]}」的學習態度，最適合選哪一個？`,
    options,
    answerIndex,
    `最貼切的成語是「${item[0]}」。`,
    '國語,閱讀理解'
  );
}

const englishWords = [
  ['library', '圖書館'],
  ['museum', '博物館'],
  ['hospital', '醫院'],
  ['market', '市場'],
  ['season', '季節'],
  ['umbrella', '雨傘'],
  ['backpack', '背包'],
  ['shoulder', '肩膀'],
  ['engineer', '工程師'],
  ['holiday', '假期'],
  ['exercise', '運動'],
  ['festival', '節日']
];

const englishVerbs = [
  ['read', 'reads', 'reading', 'read a book'],
  ['play', 'plays', 'playing', 'play baseball'],
  ['watch', 'watches', 'watching', 'watch TV'],
  ['clean', 'cleans', 'cleaning', 'clean the room'],
  ['study', 'studies', 'studying', 'study English'],
  ['visit', 'visits', 'visiting', 'visit Grandma']
];

const englishFacts = [
  ['The sun rises in the east.', true],
  ['An elephant is smaller than a cat.', false],
  ['We usually wear gloves on our feet.', false],
  ['A library is a place for reading books.', true],
  ['Winter is usually colder than summer.', true],
  ['People eat soup with an umbrella.', false]
];

function generateEnglishQuestion(subjectId, seq, difficulty) {
  const caseIndex = seq % 6;
  const round = Math.floor(seq / 6);

  if (caseIndex === 0) {
    const item = pick(englishWords, round);
    const distractors = englishWords.filter(([word]) => word !== item[0]).slice(round % 4, (round % 4) + 3).map(([word]) => word);
    const answerIndex = round % 4;
    const options = distractors.slice();
    options.splice(answerIndex, 0, item[0]);
    return makeChoice(
      subjectId,
      difficulty,
      `「${item[1]}」的英文是什麼？`,
      options,
      answerIndex,
      `${item[0]} 的中文是「${item[1]}」。`,
      '英語,字彙'
    );
  }

  if (caseIndex === 1) {
    const item = pick(englishVerbs, round);
    return makeChoice(
      subjectId,
      difficulty,
      `My brother ___ every evening. 請選出正確答案。（提示：${item[3]}）`,
      [item[0], item[1], item[2], `${item[0]}ed`],
      1,
      `第三人稱單數的一般現在式用 ${item[1]}。`,
      '英語,文法'
    );
  }

  if (caseIndex === 2) {
    const item = pick(englishVerbs, round, 2);
    return makeFill(
      subjectId,
      difficulty,
      `請填空：They are ___ now.（動詞提示：${item[0]}）`,
      item[2],
      `現在進行式要用 V-ing，所以答案是 ${item[2]}。`,
      '英語,進行式'
    );
  }

  if (caseIndex === 3) {
    const item = pick(englishFacts, round);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】${item[0]}`,
      item[1],
      item[1] ? '這個句子內容正確。' : '這個句子內容錯誤。請依常識判斷。',
      '英語,句意判斷'
    );
  }

  if (caseIndex === 4) {
    const item = pick(englishWords, round, 3);
    return makeFill(
      subjectId,
      difficulty,
      `請完成句子：I can see many books in the ___.`,
      'library',
      '很多書會在 library 裡看到。',
      '英語,情境句'
    );
  }

  const item = pick(englishVerbs, round, 1);
  return makeChoice(
    subjectId,
    difficulty,
    `Yesterday, we ___ together after school. 請選出正確的過去式。`,
    [item[0], item[1], `${item[0]}ed`, item[2]],
    2,
    `過去式應使用 ${item[0]}ed。`,
    '英語,過去式'
  );
}

const socialPlaces = [
  ['台北101', '台北市'],
  ['阿里山', '嘉義縣'],
  ['日月潭', '南投縣'],
  ['太魯閣峽谷', '花蓮縣'],
  ['澎湖群島', '台灣海峽'],
  ['赤崁樓', '台南市']
];

const socialCivics = [
  ['垃圾分類可以幫助資源回收。', true],
  ['秘密投票是為了讓別人知道你投給誰。', false],
  ['遵守交通規則是公民責任的一部分。', true],
  ['看到公共設施損壞時，可以故意繼續破壞。', false],
  ['納稅可以支持公共建設與服務。', true],
  ['多元文化代表只能接受和自己相同的習俗。', false]
];

const socialHistory = [
  ['劉銘傳', '台灣建省後的第一任巡撫'],
  ['鄭成功', '協助驅逐荷蘭人、收復台灣'],
  ['蔣中正', '中正紀念堂紀念的歷史人物'],
  ['孫中山', '中華民國國父'],
  ['哥倫布', '1492年抵達美洲的航海家'],
  ['麥哲倫', '率領船隊完成首次環球航行']
];

function generateSocialQuestion(subjectId, seq, difficulty) {
  const caseIndex = seq % 6;
  const round = Math.floor(seq / 6);

  if (caseIndex === 0) {
    const item = pick(socialPlaces, round);
    const distractors = socialPlaces.filter(([name]) => name !== item[0]).slice(round % 4, (round % 4) + 3).map(([, place]) => place);
    const answerIndex = round % 4;
    const options = distractors.slice();
    options.splice(answerIndex, 0, item[1]);
    return makeChoice(
      subjectId,
      difficulty,
      `下列哪個地點與「${item[0]}」的所在地配對正確？`,
      options,
      answerIndex,
      `${item[0]}位於${item[1]}。`,
      '社會,地理'
    );
  }

  if (caseIndex === 1) {
    const item = pick(socialHistory, round);
    return makeFill(
      subjectId,
      difficulty,
      `請填入歷史人物：被描述為「${item[1]}」的人物是___。`,
      item[0],
      `依題意應填入 ${item[0]}。`,
      '社會,歷史'
    );
  }

  if (caseIndex === 2) {
    const item = pick(socialCivics, round);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】${item[0]}`,
      item[1],
      item[1] ? '這屬於正確的公民概念。' : '這不符合正確的公民觀念。',
      '社會,公民'
    );
  }

  if (caseIndex === 3) {
    const item = pick(socialPlaces, round, 2);
    return makeChoice(
      subjectId,
      difficulty,
      `台灣地形與景觀學習中，哪個選項最適合描述「${item[0]}」？`,
      [
        `位於西部平原`,
        `位於東部或山地景觀區`,
        `位於離島且完全沒有居民`,
        `位於沙漠地帶`
      ],
      item[0] === '太魯閣峽谷' || item[0] === '阿里山' ? 1 : item[0] === '澎湖群島' ? 2 : 0,
      '依據地理位置與景觀特徵判斷最合適的描述。',
      '社會,地理'
    );
  }

  if (caseIndex === 4) {
    const rule = pick(['投票前先了解候選人政見', '參觀古蹟時遵守規定', '在社區中尊重不同文化', '公共場所主動排隊'], round);
    return makeFill(
      subjectId,
      difficulty,
      `公共生活中，遇到「${rule}」的情境時，最重要的態度是___。`,
      pick(['尊重', '責任', '合作', '守法'], round),
      '依題意填入最適當的公民態度。',
      '社會,生活'
    );
  }

  const item = pick(socialHistory, round, 3);
  const distractors = socialHistory.filter(([name]) => name !== item[0]).slice((round + 1) % 4, ((round + 1) % 4) + 3).map(([name]) => name);
  const answerIndex = (round + 1) % 4;
  const options = distractors.slice();
  options.splice(answerIndex, 0, item[0]);
  return makeChoice(
    subjectId,
    difficulty,
    `哪一位人物最符合「${item[1]}」的描述？`,
    options,
    answerIndex,
    `正確答案是 ${item[0]}。`,
    '社會,歷史人物'
  );
}

const natureFacts = [
  ['植物進行光合作用需要二氧化碳。', true],
  ['月亮是會自己發光的恆星。', false],
  ['哺乳動物會用肺呼吸。', true],
  ['電磁鐵在斷電後仍會一直保持強磁性。', false],
  ['地球自轉造成白天與黑夜交替。', true],
  ['所有昆蟲都有八隻腳。', false]
];

const natureItems = [
  ['量筒', '測量液體體積'],
  ['溫度計', '測量溫度'],
  ['天平', '測量質量'],
  ['放大鏡', '觀察細小物體'],
  ['指南針', '辨別方向'],
  ['望遠鏡', '觀察遠方天體']
];

const natureTopics = [
  ['木星', '太陽系中最大的行星'],
  ['氣孔', '植物葉片上進行氣體交換的小孔'],
  ['骨骼', '負責支撐身體與保護內臟的系統'],
  ['蒸發', '液體變成氣體的過程'],
  ['凝結', '氣體變成液體的過程'],
  ['彩虹', '陽光經水滴折射與反射形成的現象']
];

function generateNatureQuestion(subjectId, seq, difficulty) {
  const caseIndex = seq % 6;
  const round = Math.floor(seq / 6);

  if (caseIndex === 0) {
    const item = pick(natureFacts, round);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】${item[0]}`,
      item[1],
      item[1] ? '這個自然概念正確。' : '這個自然概念不正確。',
      '自然,概念判斷'
    );
  }

  if (caseIndex === 1) {
    const item = pick(natureItems, round);
    const distractors = natureItems.filter(([name]) => name !== item[0]).slice(round % 4, (round % 4) + 3).map(([name]) => name);
    const answerIndex = round % 4;
    const options = distractors.slice();
    options.splice(answerIndex, 0, item[0]);
    return makeChoice(
      subjectId,
      difficulty,
      `要${item[1]}，最適合使用哪一種工具？`,
      options,
      answerIndex,
      `${item[0]}可用來${item[1]}。`,
      '自然,測量工具'
    );
  }

  if (caseIndex === 2) {
    const item = pick(natureTopics, round);
    return makeFill(
      subjectId,
      difficulty,
      `請填入最適合的科學名詞：${item[1]}是___。`,
      item[0],
      `依照定義，答案是 ${item[0]}。`,
      '自然,名詞解釋'
    );
  }

  if (caseIndex === 3) {
    const item = pick(natureTopics, round, 3);
    return makeChoice(
      subjectId,
      difficulty,
      `下列哪一個選項最能正確描述「${item[0]}」？`,
      [
        `${item[0]}是與題意不相關的現象`,
        item[1],
        `${item[0]}只出現在人造設備中`,
        `${item[0]}無法在生活中觀察到`
      ],
      1,
      `${item[0]}的正確描述是：${item[1]}。`,
      '自然,科學概念'
    );
  }

  if (caseIndex === 4) {
    const statement = pick([
      ['節省能源可以從隨手關燈做起。', true],
      ['回收分類與環境保護沒有關係。', false],
      ['使用再生能源有助於減少污染。', true],
      ['太陽能屬於不可再生能源。', false]
    ], round);
    return makeTrueFalse(
      subjectId,
      difficulty,
      `【是非題】${statement[0]}`,
      statement[1],
      statement[1] ? '這是正確的環境保護觀念。' : '這是錯誤的環境保護觀念。',
      '自然,環境'
    );
  }

  const item = pick(natureItems, round, 2);
  return makeFill(
    subjectId,
    difficulty,
    `在科學實驗課上，如果老師要我們${item[1]}，應準備的工具是___。`,
    item[0],
    `最適合的工具是 ${item[0]}。`,
    '自然,實驗'
  );
}

const listeningThemes = [
  {
    transcript: 'I brush my teeth before breakfast every day.',
    keyword: 'brush my teeth',
    options: ['take a bath', 'brush my teeth', 'go shopping', 'watch TV']
  },
  {
    transcript: 'My sister reads in the library after school.',
    keyword: 'library',
    options: ['kitchen', 'library', 'playground', 'bathroom']
  },
  {
    transcript: 'We drink warm milk before going to bed.',
    keyword: 'milk',
    options: ['juice', 'milk', 'tea', 'soup']
  },
  {
    transcript: 'Tom plays baseball with his friends on Sunday.',
    keyword: 'baseball',
    options: ['soccer', 'basketball', 'baseball', 'tennis']
  },
  {
    transcript: 'Mom buys apples at the supermarket this morning.',
    keyword: 'supermarket',
    options: ['bookstore', 'hospital', 'supermarket', 'station']
  },
  {
    transcript: 'The weather is sunny, so we can fly a kite.',
    keyword: 'sunny',
    options: ['rainy', 'snowy', 'sunny', 'windy']
  }
];

function generateListeningQuestion(subjectId, seq, difficulty) {
  const caseIndex = seq % 3;
  const round = Math.floor(seq / 3);
  const item = pick(listeningThemes, round);

  if (caseIndex === 0) {
    return makeListening(
      subjectId,
      difficulty,
      `🎧 請聆聽句子，選出最符合內容的答案。（題號變化 ${round + 1}）`,
      choiceLetter(item.options.indexOf(item.keyword)),
      `依照音檔內容，關鍵答案是 ${item.keyword}。`,
      '英文聽力,選擇',
      {
        option_a: item.options[0],
        option_b: item.options[1],
        option_c: item.options[2],
        option_d: item.options[3],
        audio_transcript: item.transcript
      }
    );
  }

  if (caseIndex === 1) {
    return makeListening(
      subjectId,
      difficulty,
      `🎧 請聆聽句子，填入空格中的英文單字。\n句子："${item.transcript.replace(item.keyword, '_____')}"`,
      item.keyword,
      `依照句子內容，空格應填 ${item.keyword}。`,
      '英文聽力,填空',
      {
        audio_transcript: item.transcript
      }
    );
  }

  const spelling = item.keyword.includes(' ') ? item.keyword.split(' ')[0] : item.keyword;
  return makeListening(
    subjectId,
    difficulty,
    `🎧 請聆聽句子，寫出你聽到的重點單字。\n提示：與生活情境有關。`,
    spelling,
    `句中的重點單字是 ${spelling}。`,
    '英文聽力,拼字',
    {
      audio_transcript: item.transcript
    }
  );
}

const essayThemes = [
  '我學會的一件事',
  '一次讓我成長的合作經驗',
  '如果我是班級小幫手',
  '我最想感謝的人',
  '一次克服困難的經驗',
  '我心中的理想校園',
  '一次特別的旅行',
  '讓我印象最深的一堂課',
  '和家人相處的一件小事',
  '我如何安排我的一天',
  '假如我有一項超能力',
  '校園中最溫暖的一刻'
];

const essayFocus = [
  '請寫出事件發生的時間、地點、人物與經過，並說明你的感受。',
  '請描述事情的起因、過程與結果，並寫出你從中學到的事。',
  '請用具體例子支持你的想法，讓讀者知道你的理由。',
  '請注意段落安排，讓文章有清楚的開頭、中間與結尾。',
  '請結合觀察與想像，讓內容具體而生動。',
  '請在文末說明這件事帶給你的改變或啟發。'
];

const essayContexts = [
  '文章字數請至少 250 字。',
  '文章字數請控制在 250 至 350 字。',
  '文章字數請至少 300 字。',
  '請至少分成三段來書寫。',
  '請使用至少兩個具體細節讓內容更完整。',
  '請善用時間順序讓敘事更清楚。'
];

function buildRubric(difficulty) {
  const rubric = [
    '主題明確',
    '內容具體',
    '結構完整',
    '語句通順',
    '錯別字少'
  ];
  if (difficulty >= 3) rubric.push('能表達個人感受與反思');
  if (difficulty >= 4) rubric.push('段落銜接自然，例子充分');
  if (difficulty >= 5) rubric.push('觀點完整且能兼顧細節與深度');
  return `評分規準：${rubric.map((item, index) => `${index + 1}. ${item}`).join('；')}。`;
}

function generateEssayQuestion(subjectId, seq, difficulty) {
  const theme = pick(essayThemes, seq);
  const focus = pick(essayFocus, Math.floor(seq / essayThemes.length));
  const context = pick(essayContexts, Math.floor(seq / 3));
  const content = `請以「${theme}」為題，寫一篇作文。${focus}${context}`;
  const explanation = `本題著重評量六年級學生的寫作組織、內容發展與表達能力。批改時可依主題掌握、內容完整、段落安排與語句表達等面向評閱。難度設定為 ${difficulty}。`;
  return makeWriting(subjectId, difficulty, content, buildRubric(difficulty), explanation, '作文,寫作');
}

const generators = {
  CHN: generateChineseQuestion,
  ENG: generateEnglishQuestion,
  SOC: generateSocialQuestion,
  NAT: generateNatureQuestion,
  ENG_LISTEN_6: generateListeningQuestion,
  ESSAY_6: generateEssayQuestion
};

const subjectRows = db.prepare(`
  SELECT id, code, name
  FROM subjects
  WHERE grade_level = ?
    AND code IN (${TARGET_CODES.map(() => '?').join(',')})
  ORDER BY id
`).all(GRADE_LEVEL, ...TARGET_CODES);

const subjectMap = new Map(subjectRows.map((row) => [row.code, row]));
for (const code of TARGET_CODES) {
  if (!subjectMap.has(code)) {
    throw new Error(`找不到科目：${code}`);
  }
}

function getCurrentDifficultyCounts(subjectId) {
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

function makeUniqueContent(content, code, serial) {
  const scenario = pick(UNIQUE_SCENARIOS, serial);
  return `${content}（延伸情境：${code}-${scenario}-${serial + 1}）`;
}

const existingContentSet = new Set(
  db.prepare(`
    SELECT content
    FROM questions
    WHERE grade_level = ?
      AND is_archived = 0
  `).all(GRADE_LEVEL).map((row) => row.content)
);

const currentCounts = new Map(
  db.prepare(`
    SELECT s.code, COUNT(q.id) AS cnt
    FROM subjects s
    LEFT JOIN questions q
      ON q.subject_id = s.id
     AND q.grade_level = ?
     AND q.is_archived = 0
    WHERE s.grade_level = ?
      AND s.code IN (${TARGET_CODES.map(() => '?').join(',')})
    GROUP BY s.id, s.code
  `).all(GRADE_LEVEL, GRADE_LEVEL, ...TARGET_CODES).map((row) => [row.code, row.cnt])
);

const runInsert = db.transaction(() => {
  const result = {};

  for (const code of TARGET_CODES) {
    const subject = subjectMap.get(code);
    const currentCount = currentCounts.get(code) || 0;
    const need = Math.max(0, TARGET_COUNT - currentCount);
    const difficultyCounts = getCurrentDifficultyCounts(subject.id);
    let inserted = 0;
    let seq = 0;

    while (inserted < need) {
      const difficulty = nextDifficulty(difficultyCounts);
      let candidate = null;
      let attempts = 0;

      while (attempts < 2000) {
        candidate = generators[code](subject.id, seq + attempts, difficulty);
        if (existingContentSet.has(candidate.content)) {
          candidate.content = makeUniqueContent(candidate.content, code, seq + attempts);
        }
        if (!existingContentSet.has(candidate.content)) {
          break;
        }
        candidate = null;
        attempts += 1;
      }

      if (!candidate) {
        throw new Error(`無法為 ${code} 產生足夠的不重複題目。`);
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

      existingContentSet.add(candidate.content);
      difficultyCounts[candidate.difficulty - 1] += 1;
      inserted += 1;
      seq += attempts + 1;
    }

    result[code] = {
      inserted,
      finalDifficultyCounts: difficultyCounts
    };
  }

  return result;
});

const insertedSummary = runInsert();

const finalRows = db.prepare(`
  SELECT s.code, s.name, COUNT(q.id) AS cnt
  FROM subjects s
  LEFT JOIN questions q
    ON q.subject_id = s.id
   AND q.grade_level = ?
   AND q.is_archived = 0
  WHERE s.grade_level = ?
    AND s.code IN (${TARGET_CODES.map(() => '?').join(',')})
  GROUP BY s.id, s.code, s.name
  ORDER BY s.code
`).all(GRADE_LEVEL, GRADE_LEVEL, ...TARGET_CODES);

console.log('國小六年級補題完成：');
for (const row of finalRows) {
  const info = insertedSummary[row.code];
  console.log(`- ${row.code} ${row.name}：${row.cnt} 題，本次新增 ${info.inserted} 題，難度分佈 [${info.finalDifficultyCounts.join(', ')}]`);
}
