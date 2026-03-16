const db = require('./database');

const TARGET_PER_SUBJECT = 500;
const GRADE_LEVEL = 'elementary_6';
const SOURCE = '國小六年級補題腳本（補足至每科500題）';

const SUBJECT_CODES = ['CHN', 'ENG', 'SOC', 'NAT', 'MATH_E', 'ENG_LISTEN_6'];

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

const subjectRows = db.prepare(`
  SELECT id, code, name
  FROM subjects
  WHERE grade_level = ?
    AND code IN (${SUBJECT_CODES.map(() => '?').join(',')})
  ORDER BY id
`).all(GRADE_LEVEL, ...SUBJECT_CODES);

const subjectMap = new Map(subjectRows.map((row) => [row.code, row]));

for (const code of SUBJECT_CODES) {
  if (!subjectMap.has(code)) {
    throw new Error(`找不到科目：${code}`);
  }
}

const currentCounts = new Map(
  db.prepare(`
    SELECT s.code, COUNT(q.id) AS cnt
    FROM subjects s
    LEFT JOIN questions q ON q.subject_id = s.id AND q.grade_level = ?
    WHERE s.grade_level = ?
      AND s.code IN (${SUBJECT_CODES.map(() => '?').join(',')})
    GROUP BY s.id, s.code
  `).all(GRADE_LEVEL, GRADE_LEVEL, ...SUBJECT_CODES).map((row) => [row.code, row.cnt])
);

function makeChoice(subjectId, difficulty, content, options, answer, explanation, tags, extra = {}) {
  return {
    subject_id: subjectId,
    type: extra.type || 'choice',
    difficulty,
    content,
    option_a: options[0] || null,
    option_b: options[1] || null,
    option_c: options[2] || null,
    option_d: options[3] || null,
    answer,
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

function choiceLetter(index) {
  return ['A', 'B', 'C', 'D'][index];
}

function chineseQuestion(subjectId, n) {
  const idioms = [
    ['專心致志', '形容做事非常專心。'],
    ['持之以恆', '形容做事能長久堅持。'],
    ['井井有條', '形容做事有次序、不雜亂。'],
    ['實事求是', '形容按照事實來思考與處理。'],
    ['見賢思齊', '看到優點就主動學習。'],
    ['全力以赴', '形容盡全力去完成事情。']
  ];
  const antonyms = [
    ['光明', '黑暗'],
    ['勇敢', '膽怯'],
    ['整潔', '凌亂'],
    ['誠實', '虛假'],
    ['勤勞', '懶惰'],
    ['熱鬧', '冷清']
  ];
  const rhetoric = [
    ['春風像媽媽的手，輕輕撫摸著大地。', '比喻'],
    ['小草偷偷地從土裡探出頭來。', '擬人'],
    ['書，是知識的寶庫；書，是成長的階梯。', '排比'],
    ['教室裡安靜得連一根針掉下來都聽得見。', '誇飾'],
    ['時間像流水，一去不回。', '比喻'],
    ['星星在夜空中眨著眼睛。', '擬人']
  ];
  const connectors = [
    ['因為下大雨，所以比賽延期。', '因果'],
    ['雖然路很遠，但是大家仍然準時到達。', '轉折'],
    ['如果認真複習，就比較容易進步。', '假設'],
    ['不但要會讀書，而且要會思考。', '遞進'],
    ['一邊走路，一邊聊天。', '並列'],
    ['與其抱怨，不如立刻改進。', '選擇']
  ];
  const punctuation = [
    ['老師說：', '「請大家安靜坐好。」'],
    ['妹妹問：', '「明天可以去圖書館嗎？」'],
    ['爸爸提醒我：', '「寫完作業再去玩。」'],
    ['導護老師大喊：', '「過馬路要看紅綠燈！」']
  ];

  switch (n % 6) {
    case 0: {
      const item = idioms[n % idioms.length];
      const distractors = idioms.filter(([word]) => word !== item[0]).slice(0, 3).map(([word]) => word);
      const answerIndex = n % 4;
      const options = distractors.slice();
      options.splice(answerIndex, 0, item[0]);
      return makeChoice(
        subjectId,
        2 + (n % 2),
        `下列哪個成語最適合形容「${item[1].replace('形容', '').replace('。', '')}」？`,
        options,
        choiceLetter(answerIndex),
        `${item[0]}${item[1]}`,
        '國語,成語'
      );
    }
    case 1: {
      const item = antonyms[n % antonyms.length];
      const answer = item[1];
      const wrongs = antonyms.map((pair) => pair[1]).filter((word) => word !== answer).slice(0, 3);
      const answerIndex = (n + 1) % 4;
      const options = wrongs.slice();
      options.splice(answerIndex, 0, answer);
      return makeChoice(
        subjectId,
        1 + (n % 2),
        `「${item[0]}」的反義詞是什麼？`,
        options,
        choiceLetter(answerIndex),
        `「${item[0]}」的反義詞是「${answer}」。`,
        '國語,反義詞'
      );
    }
    case 2: {
      const item = rhetoric[n % rhetoric.length];
      const types = ['比喻', '擬人', '排比', '誇飾'];
      const answerIndex = types.indexOf(item[1]);
      return makeChoice(
        subjectId,
        2,
        `句子「${item[0]}」使用了哪一種修辭？`,
        types,
        choiceLetter(answerIndex),
        `這句話屬於${item[1]}修辭。`,
        '國語,修辭'
      );
    }
    case 3: {
      const item = connectors[n % connectors.length];
      const relationTypes = ['因果', '轉折', '假設', '遞進', '並列', '選擇'];
      const answerIndex = relationTypes.indexOf(item[1]);
      const options = answerIndex < 4 ? relationTypes.slice(0, 4) : [relationTypes[answerIndex], ...relationTypes.filter((_, i) => i !== answerIndex).slice(0, 3)];
      const normalizedAnswerIndex = options.indexOf(item[1]);
      return makeChoice(
        subjectId,
        2,
        `句子「${item[0]}」屬於哪一種語意關係？`,
        options,
        choiceLetter(normalizedAnswerIndex),
        `這句話屬於${item[1]}關係。`,
        '國語,連接詞'
      );
    }
    case 4: {
      const item = punctuation[n % punctuation.length];
      return makeFill(
        subjectId,
        2,
        `替句子補上引號：${item[0]}___`,
        item[1],
        `對話內容要加上引號，因此答案是 ${item[1]}`,
        '國語,標點符號'
      );
    }
    default: {
      const themes = ['閱讀文章先找重點', '遇到困難要主動想辦法', '和同學合作要互相尊重', '寫心得要加上自己的想法'];
      const theme = themes[n % themes.length];
      return makeFill(
        subjectId,
        3,
        `請填入最適合的詞語：老師提醒我們「${theme}，才能真正學會。」這句話主要強調做事要懂得___。`,
        ['整理', '思考', '合作', '反省'][n % 4],
        '依照句意填入最適合的學習態度詞語。',
        '國語,句意理解'
      );
    }
  }
}

function englishQuestion(subjectId, n) {
  const animals = [
    ['cat', 'cats'],
    ['dog', 'dogs'],
    ['bird', 'birds'],
    ['rabbit', 'rabbits'],
    ['tiger', 'tigers'],
    ['monkey', 'monkeys']
  ];
  const verbs = [
    ['read', 'reads', 'reading', 'read a book'],
    ['play', 'plays', 'playing', 'play basketball'],
    ['wash', 'washes', 'washing', 'wash the dishes'],
    ['watch', 'watches', 'watching', 'watch TV'],
    ['clean', 'cleans', 'cleaning', 'clean the room'],
    ['study', 'studies', 'studying', 'study English']
  ];
  const places = ['library', 'museum', 'park', 'school', 'hospital', 'station'];
  const seasons = ['spring', 'summer', 'autumn', 'winter'];

  switch (n % 6) {
    case 0: {
      const item = animals[n % animals.length];
      const answerIndex = n % 4;
      const wrongs = animals.map(([single]) => single).filter((word) => word !== item[0]).slice(0, 3);
      const options = wrongs.slice();
      options.splice(answerIndex, 0, item[0]);
      return makeChoice(
        subjectId,
        1,
        `「${item[0] === 'cat' ? '貓' : item[0] === 'dog' ? '狗' : item[0] === 'bird' ? '鳥' : item[0] === 'rabbit' ? '兔子' : item[0] === 'tiger' ? '老虎' : '猴子'}」的英文是什麼？`,
        options,
        choiceLetter(answerIndex),
        `${item[0]} 是正確英文。`,
        '英語,字彙'
      );
    }
    case 1: {
      const item = verbs[n % verbs.length];
      return makeChoice(
        subjectId,
        2,
        `He ___ every evening after dinner.`,
        [item[0], item[1], item[2], `${item[0]}ed`],
        'B',
        `主詞 He 為第三人稱單數，一般現在式要用 ${item[1]}。`,
        '英語,文法,現在式'
      );
    }
    case 2: {
      const place = places[n % places.length];
      const answerIndex = n % 4;
      const options = ['in', 'on', 'at', 'under'];
      const correct = place === 'park' ? 'in' : 'at';
      return makeChoice(
        subjectId,
        2,
        `We will meet ___ the ${place} after school.`,
        options,
        choiceLetter(options.indexOf(correct)),
        `表示在特定場所常用 ${correct}。`,
        '英語,介系詞'
      );
    }
    case 3: {
      const item = verbs[n % verbs.length];
      return makeFill(
        subjectId,
        2,
        `請填空：They are ___ now.`,
        item[2],
        `現在進行式要用 be 動詞加 V-ing，所以答案是 ${item[2]}。`,
        '英語,現在進行式'
      );
    }
    case 4: {
      const season = seasons[n % seasons.length];
      const sentence = {
        spring: 'Flowers bloom in spring.',
        summer: 'We can swim in summer.',
        autumn: 'Leaves fall in autumn.',
        winter: 'It is cold in winter.'
      }[season];
      const choices = ['spring', 'summer', 'autumn', 'winter'];
      return makeChoice(
        subjectId,
        1,
        `${sentence} Which season is it?`,
        choices,
        choiceLetter(choices.indexOf(season)),
        `關鍵句已指出季節為 ${season}。`,
        '英語,閱讀理解'
      );
    }
    default: {
      const item = verbs[n % verbs.length];
      return makeFill(
        subjectId,
        3,
        `請填入過去式：Yesterday, we ___ together.`,
        item[0] === 'study' ? 'studied' : `${item[0]}ed`,
        '題目要填過去式。若動詞為 study，需改為 studied。',
        '英語,過去式'
      );
    }
  }
}

function socialQuestion(subjectId, n) {
  const cities = [
    ['台北市', '101大樓'],
    ['台南市', '府城'],
    ['新北市', '九份老街'],
    ['嘉義縣', '阿里山'],
    ['花蓮縣', '太魯閣'],
    ['屏東縣', '墾丁']
  ];
  const civicRights = [
    ['守法', '每個人都要遵守法律'],
    ['納稅', '稅收能支持公共建設'],
    ['投票', '表達公民意見的方式'],
    ['尊重他人', '維持良好社會互動'],
    ['愛護環境', '維護公共生活品質'],
    ['參與討論', '能促進民主決策']
  ];
  const geography = [
    ['玉山', '台灣最高峰'],
    ['濁水溪', '台灣最長的河流'],
    ['台灣海峽', '位於台灣與中國大陸之間'],
    ['嘉南平原', '台灣重要農業平原'],
    ['澎湖', '位於台灣海峽上的群島'],
    ['中央山脈', '縱貫台灣本島的重要山脈']
  ];

  switch (n % 6) {
    case 0: {
      const item = cities[n % cities.length];
      const wrongs = cities.map(([city]) => city).filter((city) => city !== item[0]).slice(0, 3);
      const answerIndex = n % 4;
      const options = wrongs.slice();
      options.splice(answerIndex, 0, item[0]);
      return makeChoice(
        subjectId,
        2,
        `下列哪個縣市和「${item[1]}」最相關？`,
        options,
        choiceLetter(answerIndex),
        `${item[1]}位於${item[0]}。`,
        '社會,台灣地理'
      );
    }
    case 1: {
      const item = geography[n % geography.length];
      return makeChoice(
        subjectId,
        2,
        `「${item[0]}」的正確描述是哪一項？`,
        [item[1], '位於非洲', '是外國城市', '屬於海洋國家'],
        'A',
        `${item[0]}${item[1]}。`,
        '社會,地理常識'
      );
    }
    case 2: {
      const item = civicRights[n % civicRights.length];
      return makeChoice(
        subjectId,
        2,
        `下列哪一項最能表現公民責任？`,
        [item[0], '亂丟垃圾', '破壞公物', '插隊搶位'],
        'A',
        `${item[0]}屬於良好的公民行為，因為${item[1]}。`,
        '社會,公民'
      );
    }
    case 3: {
      const years = [
        ['1949', '中華民國政府遷台'],
        ['1947', '二二八事件發生'],
        ['1895', '馬關條約後台灣進入日治時期'],
        ['1945', '第二次世界大戰結束，台灣光復']
      ];
      const item = years[n % years.length];
      return makeFill(
        subjectId,
        3,
        `請填空：${item[1]}的年份是 ___ 年。`,
        item[0],
        `${item[1]}發生於 ${item[0]} 年。`,
        '社會,歷史'
      );
    }
    case 4: {
      const cultures = [
        ['中秋節', '賞月和吃月餅'],
        ['端午節', '划龍舟和吃粽子'],
        ['春節', '貼春聯和拜年'],
        ['元宵節', '賞花燈和吃湯圓']
      ];
      const item = cultures[n % cultures.length];
      return makeChoice(
        subjectId,
        1,
        `下列哪一項是「${item[0]}」常見的習俗？`,
        [item[1], '交換聖誕禮物', '穿萬聖節服裝', '找復活節彩蛋'],
        'A',
        `${item[0]}的常見習俗是${item[1]}。`,
        '社會,文化'
      );
    }
    default: {
      const globalFacts = [
        ['亞洲', '世界人口最多的洲'],
        ['太平洋', '世界最大的海洋'],
        ['南極洲', '沒有固定居民的大洲'],
        ['俄羅斯', '世界面積最大的國家']
      ];
      const item = globalFacts[n % globalFacts.length];
      return makeFill(
        subjectId,
        2,
        `請填空：${item[1]}是 ___。`,
        item[0],
        `${item[1]}是${item[0]}。`,
        '社會,世界地理'
      );
    }
  }
}

function natureQuestion(subjectId, n) {
  const planets = [
    ['太陽', '恆星'],
    ['月亮', '地球的衛星'],
    ['地球', '行星'],
    ['木星', '太陽系最大的行星']
  ];
  const body = [
    ['肺臟', '呼吸'],
    ['心臟', '輸送血液'],
    ['大腦', '控制身體活動'],
    ['骨骼', '支撐身體']
  ];
  const environment = [
    ['隨手關燈', '節能'],
    ['垃圾分類', '回收再利用'],
    ['節約用水', '保護水資源'],
    ['減少使用一次性用品', '降低垃圾量']
  ];

  switch (n % 6) {
    case 0: {
      const item = planets[n % planets.length];
      return makeChoice(
        subjectId,
        1 + (n % 2),
        `下列關於「${item[0]}」的敘述，哪一項正確？`,
        [item[1], '是一種昆蟲', '住在海底', '屬於植物'],
        'A',
        `${item[0]}屬於${item[1]}。`,
        '自然,天文'
      );
    }
    case 1: {
      const temperatures = [0, 10, 25, 37];
      const temp = temperatures[n % temperatures.length];
      const state = temp <= 0 ? '固態' : temp >= 25 ? '液態' : '液態';
      return makeChoice(
        subjectId,
        2,
        `水在約 ${temp}°C 時，最常見的狀態是什麼？`,
        ['固態', '液態', '氣態', '金屬態'],
        temp <= 0 ? 'A' : 'B',
        `${temp}°C 時，水最常見為${state}。`,
        '自然,物質三態'
      );
    }
    case 2: {
      const item = body[n % body.length];
      return makeFill(
        subjectId,
        2,
        `請填空：${item[0]}的主要功能是___。`,
        item[1],
        `${item[0]}的主要功能是${item[1]}。`,
        '自然,人體'
      );
    }
    case 3: {
      const plants = [
        ['根', '吸收水分和固定植物'],
        ['莖', '支撐植物並輸送水分'],
        ['葉', '進行光合作用'],
        ['花', '幫助繁殖']
      ];
      const item = plants[n % plants.length];
      return makeChoice(
        subjectId,
        2,
        `植物的「${item[0]}」主要有什麼作用？`,
        [item[1], '拿來跑步', '只會發光', '用來發出聲音'],
        'A',
        `${item[0]}的功能是${item[1]}。`,
        '自然,植物'
      );
    }
    case 4: {
      const item = environment[n % environment.length];
      return makeChoice(
        subjectId,
        2,
        `下列哪一項做法最符合環境保護？`,
        [item[0], '浪費食物', '一直開著水龍頭', '把電池丟進一般垃圾'],
        'A',
        `${item[0]}可以${item[1]}。`,
        '自然,環保'
      );
    }
    default: {
      const weather = [
        ['颱風來時要留在室內', '安全'],
        ['地震時要趴下、掩護、穩住', '防災'],
        ['下雷雨時不要躲在大樹下', '防雷'],
        ['天氣炎熱時要補充水分', '保健']
      ];
      const item = weather[n % weather.length];
      return makeFill(
        subjectId,
        3,
        `請填空：${item[0]}，這是重要的___觀念。`,
        item[1],
        `這屬於${item[1]}觀念。`,
        '自然,生活科學'
      );
    }
  }
}

function mathQuestion(subjectId, n) {
  switch (n % 8) {
    case 0: {
      const a = 120 + n;
      const b = 30 + (n % 25);
      const correct = a - b;
      const options = [correct - 10, correct, correct + 10, correct + 20].map(String);
      return makeChoice(
        subjectId,
        2,
        `${a} - ${b} = ？`,
        options,
        'B',
        `${a}-${b}=${correct}。`,
        '數學,整數運算'
      );
    }
    case 1: {
      const a = 12 + (n % 9);
      const b = 6 + (n % 5);
      const correct = a * b;
      return makeFill(
        subjectId,
        2,
        `${a} × ${b} = ___`,
        String(correct),
        `${a}×${b}=${correct}。`,
        '數學,乘法'
      );
    }
    case 2: {
      const total = 180 + (n * 3);
      const people = 6 + (n % 6);
      const correct = total / people;
      return makeChoice(
        subjectId,
        2,
        `${total} 顆糖平均分給 ${people} 位同學，每人分到幾顆？`,
        [String(correct - 5), String(correct), String(correct + 5), String(correct + 10)],
        'B',
        `${total}÷${people}=${correct}。`,
        '數學,除法應用'
      );
    }
    case 3: {
      const numerator = 1 + (n % 5);
      const add = 1 + ((n + 2) % 5);
      const denominator = 8;
      const correct = `${numerator + add}/${denominator}`;
      return makeFill(
        subjectId,
        3,
        `${numerator}/${denominator} + ${add}/${denominator} = ___`,
        correct,
        `分母相同，分子相加即可，答案是 ${correct}。`,
        '數學,分數'
      );
    }
    case 4: {
      const decimal = (1.2 + (n % 7) * 0.3).toFixed(1);
      const factor = 10;
      const correct = (Number(decimal) * factor).toFixed(0);
      return makeChoice(
        subjectId,
        2,
        `${decimal} × ${factor} = ？`,
        [String(Number(correct) - 3), correct, String(Number(correct) + 3), String(Number(correct) + 6)],
        'B',
        `${decimal}×${factor}=${correct}。`,
        '數學,小數'
      );
    }
    case 5: {
      const length = 8 + (n % 6);
      const width = 4 + (n % 4);
      const area = length * width;
      return makeFill(
        subjectId,
        2,
        `長方形長 ${length} 公分、寬 ${width} 公分，面積 = ___ 平方公分`,
        String(area),
        `${length}×${width}=${area}。`,
        '數學,面積'
      );
    }
    case 6: {
      const percent = [10, 20, 25, 50][n % 4];
      const total = 80 + (n % 6) * 20;
      const correct = (total * percent) / 100;
      return makeChoice(
        subjectId,
        3,
        `${total} 的 ${percent}% 是多少？`,
        [String(correct / 2), String(correct), String(correct + 10), String(correct + 20)],
        'B',
        `${total}×${percent / 100}=${correct}。`,
        '數學,百分比'
      );
    }
    default: {
      const km = 2 + (n % 5);
      const m = km * 1000;
      return makeFill(
        subjectId,
        1,
        `${km} 公里 = ___ 公尺`,
        String(m),
        `1 公里 = 1000 公尺，所以 ${km} 公里 = ${m} 公尺。`,
        '數學,單位換算'
      );
    }
  }
}

function listeningQuestion(subjectId, n) {
  const routines = [
    ['I brush my teeth before breakfast.', 'brush my teeth', ['take a bath', 'brush my teeth', 'go shopping', 'watch TV'], 'B'],
    ['She reads a book in the library.', 'library', ['kitchen', 'library', 'playground', 'bathroom'], 'B'],
    ['They play basketball after school.', 'basketball', ['baseball', 'basketball', 'soccer', 'tennis'], 'B'],
    ['We drink milk every morning.', 'milk', ['juice', 'milk', 'tea', 'water'], 'B']
  ];
  const item = routines[n % routines.length];

  if (n % 3 === 0) {
    return makeChoice(
      subjectId,
      2,
      '🎧 請聆聽句子，選出正確答案。',
      item[2],
      item[3],
      `根據句子內容，正確答案是 ${item[1]}。`,
      '英文聽力,日常生活',
      {
        type: 'listening',
        audio_transcript: item[0]
      }
    );
  }

  if (n % 3 === 1) {
    return makeFill(
      subjectId,
      2,
      `🎧 請聆聽句子，填入空格中的英文單字。\n句子："${item[0].replace(item[1], '_____')}"`,
      item[1],
      `依照句子內容，空格應填 ${item[1]}。`,
      '英文聽力,填空',
      {
        type: 'listening',
        audio_transcript: item[0]
      }
    );
  }

  const spelling = item[1].includes(' ') ? item[1].split(' ')[0] : item[1];
  return makeFill(
    subjectId,
    3,
    `🎧 請聆聽句子，寫出聽到的重點單字。\n提示：與句子中的活動或地點有關。`,
    spelling,
    `句子中的重點單字是 ${spelling}。`,
    '英文聽力,拼字',
    {
      type: 'listening',
      audio_transcript: item[0]
    }
  );
}

const generators = {
  CHN: chineseQuestion,
  ENG: englishQuestion,
  SOC: socialQuestion,
  NAT: natureQuestion,
  MATH_E: mathQuestion,
  ENG_LISTEN_6: listeningQuestion
};

const runInsert = db.transaction(() => {
  const insertedByCode = {};

  for (const code of SUBJECT_CODES) {
    const subject = subjectMap.get(code);
    const current = currentCounts.get(code) || 0;
    const need = Math.max(0, TARGET_PER_SUBJECT - current);
    insertedByCode[code] = 0;

    for (let i = 0; i < need; i++) {
      const q = generators[code](subject.id, current + i);
      insertQuestion.run(
        q.subject_id,
        q.type,
        q.difficulty,
        q.content,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.answer,
        q.explanation,
        SOURCE,
        q.tags,
        GRADE_LEVEL,
        q.audio_url,
        q.audio_transcript
      );
      insertedByCode[code] += 1;
    }
  }

  return insertedByCode;
});

const insertedByCode = runInsert();
const summary = db.prepare(`
  SELECT s.name, s.code, COUNT(q.id) AS cnt
  FROM subjects s
  LEFT JOIN questions q ON q.subject_id = s.id AND q.grade_level = ?
  WHERE s.grade_level = ?
    AND s.code IN (${SUBJECT_CODES.map(() => '?').join(',')})
  GROUP BY s.id, s.name, s.code
  ORDER BY s.id
`).all(GRADE_LEVEL, GRADE_LEVEL, ...SUBJECT_CODES);

console.log('國小六年級各科補題完成：');
for (const row of summary) {
  console.log(`- ${row.name} (${row.code})：${row.cnt} 題，本次新增 ${insertedByCode[row.code] || 0} 題`);
}
