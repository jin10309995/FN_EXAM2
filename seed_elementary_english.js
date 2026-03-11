'use strict';
const db = require('./database');

const engSubject = db.prepare(`SELECT id FROM subjects WHERE code = 'ENG' AND grade_level = 'elementary_6'`).get();
if (!engSubject) {
  console.error('找不到 ENG (elementary_6) 科目，請先啟動伺服器完成初始化');
  process.exit(1);
}
const subjectId = engSubject.id;

// 清除既有的種子題目（避免重複植入）
const deleted = db.prepare(`DELETE FROM questions WHERE subject_id = ? AND source = '英語聽力種子題目'`).run(subjectId);
if (deleted.changes > 0) console.log(`🗑️  已清除舊題目 ${deleted.changes} 筆`);

const questions = [
  // ── 選擇題（listening type + choice options）──
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽音訊，選出正確的顏色單字。',
    option_a: 'Blue', option_b: 'Green', option_c: 'Red', option_d: 'Yellow',
    answer: 'C',
    explanation: 'Red 是「紅色」。',
    audio_transcript: 'Red',
    tags: '顏色,color'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽音訊，選出對應的數字。',
    option_a: '3', option_b: '5', option_c: '7', option_d: '9',
    answer: 'C',
    explanation: 'Seven 是數字 7。',
    audio_transcript: 'Seven',
    tags: '數字,number'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽音訊，選出正確的動物單字。',
    option_a: 'Cat', option_b: 'Dog', option_c: 'Bird', option_d: 'Fish',
    answer: 'B',
    explanation: 'Dog 是「狗」。',
    audio_transcript: 'Dog',
    tags: '動物,animal'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽音訊，選出對應的星期名稱。',
    option_a: 'Sunday', option_b: 'Tuesday', option_c: 'Monday', option_d: 'Friday',
    answer: 'C',
    explanation: 'Monday 是「星期一」。',
    audio_transcript: 'Monday',
    tags: '星期,day'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽音訊，選出正確的水果單字。',
    option_a: 'Banana', option_b: 'Orange', option_c: 'Grape', option_d: 'Apple',
    answer: 'D',
    explanation: 'Apple 是「蘋果」。',
    audio_transcript: 'Apple',
    tags: '食物,水果,fruit'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的中文意思。',
    option_a: '我很累。', option_b: '我很餓。', option_c: '我很高興。', option_d: '我很渴。',
    answer: 'B',
    explanation: '"I am hungry." 意思是「我很餓。」',
    audio_transcript: 'I am hungry.',
    tags: '句子,情緒,sentence'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出最合適的回應。',
    option_a: 'I am ten.', option_b: 'I am fine, thank you.', option_c: 'My name is Tom.', option_d: 'See you later.',
    answer: 'B',
    explanation: '"How are you?" 問候句的正確回應是 "I am fine, thank you."',
    audio_transcript: 'How are you?',
    tags: '問候,greeting'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽音訊，選出對應的月份名稱。',
    option_a: 'August', option_b: 'November', option_c: 'October', option_d: 'December',
    answer: 'C',
    explanation: 'October 是「十月」。',
    audio_transcript: 'October',
    tags: '月份,month'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的天氣描述。',
    option_a: '今天下雨。', option_b: '今天下雪。', option_c: '今天有霧。', option_d: '今天晴天。',
    answer: 'D',
    explanation: '"It is sunny." 表示「晴天」。',
    audio_transcript: 'It is sunny today.',
    tags: '天氣,weather'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽對話，選出男孩最喜歡的科目。',
    option_a: 'English', option_b: 'Science', option_c: 'Math', option_d: 'History',
    answer: 'C',
    explanation: '"My favorite subject is math." 意思是「我最喜歡的科目是數學」。',
    audio_transcript: 'My favorite subject is math.',
    tags: '學校,school,科目,subject'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，選出正確的上課時間。',
    option_a: '7:30', option_b: '8:00', option_c: '8:30', option_d: '9:00',
    answer: 'C',
    explanation: '"eight thirty" 表示 8:30。',
    audio_transcript: 'The class starts at eight thirty.',
    tags: '時間,time'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽對話，選出購買的物品數量。',
    option_a: '1', option_b: '2', option_c: '3', option_d: '4',
    answer: 'C',
    explanation: '"three bottles of water" 表示三瓶水。',
    audio_transcript: 'I would like three bottles of water, please.',
    tags: '購物,shopping,數量,quantity'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，選出最符合句子的位置描述。',
    option_a: '貓在桌上睡覺。', option_b: '貓在椅子下睡覺。', option_c: '貓在桌子旁邊睡覺。', option_d: '貓在桌子下睡覺。',
    answer: 'D',
    explanation: '"under the table" 表示「在桌子下面」。',
    audio_transcript: 'The cat is sleeping under the table.',
    tags: '介系詞,preposition,位置,location'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽短對話，選出女孩明天要做什麼。',
    option_a: 'She will study.', option_b: 'She will go shopping.', option_c: 'She will go swimming.', option_d: 'She will stay home.',
    answer: 'C',
    explanation: '"I will go swimming." 意思是「我要去游泳」。',
    audio_transcript: 'Boy: What will you do tomorrow?\nGirl: I will go swimming with my family.',
    tags: '對話,dialogue,未來式,future'
  },
  {
    type: 'listening', difficulty: 4,
    content: '🎧 請聆聽短文，選出 Mike 喜歡的運動。',
    option_a: 'Soccer', option_b: 'Baseball', option_c: 'Tennis', option_d: 'Basketball',
    answer: 'D',
    explanation: '"Mike likes to play basketball." 表示 Mike 喜歡打籃球。',
    audio_transcript: 'Mike likes to play basketball after school. He practices every Tuesday and Thursday with his team.',
    tags: '短文,passage,運動,sport'
  },

  // ── 填空題（listening type + fill answer）──
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽音訊，填入聽到的顏色單字（英文）。',
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: 'blue',
    explanation: '聽到的顏色是 blue（藍色）。',
    audio_transcript: 'Blue',
    tags: '顏色,color,填空'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽音訊，填入聽到的動物單字（英文）。',
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: 'rabbit',
    explanation: '聽到的動物是 rabbit（兔子）。',
    audio_transcript: 'Rabbit',
    tags: '動物,animal,填空'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的飲料名稱（英文）。\n句子：" I drink _____ every morning. "',
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: 'milk',
    explanation: '"I drink milk every morning." 每天早上我喝牛奶。',
    audio_transcript: 'I drink milk every morning.',
    tags: '填空,句子,飲食,food'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入一年共有幾個月的英文數字單字。\n句子：" There are _____ months in a year. "',
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: 'twelve',
    explanation: '"twelve months in a year" 一年有十二個月，twelve = 12。',
    audio_transcript: 'There are twelve months in a year.',
    tags: '數字,number,填空'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，填入描述天氣的形容詞（英文）。\n句子：" The weather is _____ today, so bring an umbrella. "',
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: 'rainy',
    explanation: '"rainy" 表示「下雨的」，句子建議帶雨傘，故天氣是 rainy。',
    audio_transcript: 'The weather is rainy today, so bring an umbrella.',
    tags: '天氣,weather,填空,形容詞'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽對話，填入購書的地點名稱（英文）。\n對話：\nA: Where do you buy books?\nB: I buy books at the ___________.',
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: 'bookstore',
    explanation: '"bookstore" 是書店，是購買書籍的地點。',
    audio_transcript: 'A: Where do you buy books?\nB: I buy books at the bookstore.',
    tags: '地點,place,對話,dialogue,填空'
  },

  // ── 拼字題（calculation 形式：寫出拼字）──
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽音訊，寫出聽到的英文單字。\n（提示：這是一種交通工具）',
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: 'bus',
    explanation: 'bus（公車）的拼法：b-u-s。',
    audio_transcript: 'Bus',
    tags: '交通,transport,拼字,spelling'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽音訊，寫出聽到的英文單字。\n（提示：這是一種學校用品）',
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: 'pencil',
    explanation: 'pencil（鉛筆）的拼法：p-e-n-c-i-l。',
    audio_transcript: 'Pencil',
    tags: '學校,school,文具,拼字,spelling'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽音訊，寫出聽到的英文單字。\n（提示：這是一種天氣現象）',
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: 'rainbow',
    explanation: 'rainbow（彩虹）的拼法：r-a-i-n-b-o-w。',
    audio_transcript: 'Rainbow',
    tags: '天氣,weather,拼字,spelling'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽音訊，寫出聽到的英文單字。\n（提示：這是一種情緒/感覺）',
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: 'nervous',
    explanation: 'nervous（緊張的）的拼法：n-e-r-v-o-u-s。',
    audio_transcript: 'Nervous',
    tags: '情緒,emotion,拼字,spelling'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽音訊，寫出聽到的英文單字。\n（提示：這是一種職業）',
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: 'engineer',
    explanation: 'engineer（工程師）的拼法：e-n-g-i-n-e-e-r。',
    audio_transcript: 'Engineer',
    tags: '職業,job,拼字,spelling'
  },
  {
    type: 'listening', difficulty: 4,
    content: '🎧 請聆聽句子，寫出空格中的英文單字。\n句子：" We should protect the ___________ from pollution. "',
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: 'environment',
    explanation: 'environment（環境）的拼法：e-n-v-i-r-o-n-m-e-n-t。',
    audio_transcript: 'We should protect the environment from pollution.',
    tags: '環境,environment,拼字,spelling,高難度'
  },
];

const insert = db.prepare(`
  INSERT INTO questions
    (subject_id, type, difficulty, content, option_a, option_b, option_c, option_d,
     answer, explanation, source, tags, grade_level, audio_url, audio_transcript)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'elementary_6', ?, ?)
`);

const insertAll = db.transaction(() => {
  let count = 0;
  for (const q of questions) {
    insert.run(
      subjectId, q.type, q.difficulty, q.content,
      q.option_a || null, q.option_b || null, q.option_c || null, q.option_d || null,
      q.answer, q.explanation || null,
      '英語聽力種子題目',
      q.tags || null,
      null,                  // audio_url（無音檔，後續可透過後台上傳）
      q.audio_transcript || null
    );
    count++;
  }
  return count;
});

const inserted = insertAll();
console.log(`✅ 成功新增 ${inserted} 題英語聽力題（ENG / elementary_6）`);
console.log(`   其中：`);
console.log(`   - 選擇題（listening + 選項）：15 題`);
console.log(`   - 填空題（listening + 填空）：6 題`);
console.log(`   - 拼字題（listening + 計算）：6 題`);
console.log(`\n   💡 音檔可於管理後台（admin.html）上傳 mp3/wav 並更新 audio_url`);
