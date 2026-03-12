'use strict';
const db = require('./database');

const subjectRow = db.prepare(`SELECT id FROM subjects WHERE code = 'ENG_LISTEN_7' AND grade_level = 'grade_7'`).get();
if (!subjectRow) { console.error('找不到 ENG_LISTEN_7 (grade_7) 科目，請先執行 database.js 初始化'); process.exit(1); }
const subjectId = subjectRow.id;

const questions = [

  // ── 主題一：學校科目與生活 School Subjects & Life ─────────────────────────
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的學校科目。',
    option_a: 'math', option_b: 'music', option_c: 'history', option_d: 'art',
    answer: 'A',
    explanation: '「math」是數學，是學校必修的重要科目。',
    audio_transcript: 'My favorite subject is math. I love numbers.',
    tags: '學校,school,科目,subject'
  },
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的科目。',
    option_a: 'PE', option_b: 'science', option_c: 'English', option_d: 'Chinese',
    answer: 'C',
    explanation: '「English」是英語課，對話中提到學英文字母和單字。',
    audio_transcript: 'We learn new words in English class today.',
    tags: '學校,school,英語,English'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人喜歡的科目。',
    option_a: 'computer class', option_b: 'history', option_c: 'music', option_d: 'biology',
    answer: 'C',
    explanation: '句子說「我喜歡音樂課，因為我喜歡唱歌」，所以是 music。',
    audio_transcript: 'I like music class because I enjoy singing.',
    tags: '學校,school,音樂,music'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的科目名稱（英文）。\n句子："We have _____ class on Tuesday and Thursday."（體育課）',
    answer: 'PE',
    explanation: '「PE」是 Physical Education（體育）的縮寫。',
    audio_transcript: 'We have PE class on Tuesday and Thursday.',
    tags: '學校,school,體育,PE'
  },
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的地點。',
    option_a: 'library', option_b: 'classroom', option_c: 'cafeteria', option_d: 'gym',
    answer: 'A',
    explanation: '「library」是圖書館，借書的地方。',
    audio_transcript: 'I borrow books from the school library every week.',
    tags: '學校,school,圖書館,library'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The _____ rings at eight o\'clock every morning."（鐘聲）',
    answer: 'bell',
    explanation: '「bell」是鈴聲，學校的上課鐘聲。',
    audio_transcript: "The bell rings at eight o'clock every morning.",
    tags: '學校,school,鐘聲,bell'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人做了什麼。',
    option_a: 'read a book', option_b: 'forgot homework', option_c: 'passed a test', option_d: 'made a friend',
    answer: 'C',
    explanation: '句子說「我通過了英文考試，非常高興」，所以是 passed a test。',
    audio_transcript: 'I passed my English test and I am very happy.',
    tags: '學校,school,考試,test'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Our _____ gave us a lot of homework today."（老師）',
    answer: 'teacher',
    explanation: '「teacher」是老師，負責教課和出作業。',
    audio_transcript: 'Our teacher gave us a lot of homework today.',
    tags: '學校,school,老師,teacher'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的物品。',
    option_a: 'pencil', option_b: 'ruler', option_c: 'eraser', option_d: 'scissors',
    answer: 'C',
    explanation: '句子說「我需要橡皮擦來擦掉錯誤的字」，所以是 eraser。',
    audio_transcript: 'I need an eraser to remove the wrong words.',
    tags: '學校,school,文具,stationery'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："We sit in _____ in our classroom."（行）',
    answer: 'rows',
    explanation: '「rows」是「行」，學生通常按行坐在教室裡。',
    audio_transcript: 'We sit in rows in our classroom.',
    tags: '學校,school,教室,classroom'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個學生最不喜歡的科目。',
    option_a: 'English', option_b: 'math', option_c: 'science', option_d: 'history',
    answer: 'D',
    explanation: '句子說「歷史課有太多日期要記憶，我不喜歡」，所以是 history。',
    audio_transcript: 'History class has too many dates to remember. I don\'t like it.',
    tags: '學校,school,歷史,history'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The _____ is in room 203."（實驗室）',
    answer: 'lab',
    explanation: '「lab」是實驗室（laboratory 的縮寫），理化課在此進行實驗。',
    audio_transcript: 'The lab is in room 203.',
    tags: '學校,school,實驗室,lab'
  },

  // ── 主題二：嗜好與休閒 Hobbies & Leisure ─────────────────────────────────
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出這個人的嗜好。',
    option_a: 'swimming', option_b: 'painting', option_c: 'reading', option_d: 'cooking',
    answer: 'B',
    explanation: '句子說「我喜歡畫畫，每天下午我都畫畫」，所以是 painting。',
    audio_transcript: 'I like painting. I draw every afternoon.',
    tags: '嗜好,hobbies,繪畫,painting'
  },
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的活動。',
    option_a: 'play guitar', option_b: 'play piano', option_c: 'play drums', option_d: 'play violin',
    answer: 'B',
    explanation: '句子說「她每天練習鋼琴一小時」，所以是 play piano。',
    audio_transcript: 'She practices the piano for one hour every day.',
    tags: '嗜好,hobbies,音樂,music,鋼琴,piano'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的活動（英文）。\n句子："He goes _____ at the pool every Saturday."（游泳）',
    answer: 'swimming',
    explanation: '「go swimming」是去游泳，在游泳池進行。',
    audio_transcript: 'He goes swimming at the pool every Saturday.',
    tags: '嗜好,hobbies,游泳,swimming'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人週末做了什麼。',
    option_a: 'went hiking', option_b: 'watched a movie', option_c: 'played games', option_d: 'read a novel',
    answer: 'A',
    explanation: '句子說「這個週末我們爬山，走了很多路」，所以是 went hiking。',
    audio_transcript: 'We went hiking this weekend and walked a long way.',
    tags: '嗜好,hobbies,爬山,hiking'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："My brother likes to _____ model airplanes."（組裝）',
    answer: 'build',
    explanation: '「build model airplanes」是組裝模型飛機，是一種受歡迎的嗜好。',
    audio_transcript: 'My brother likes to build model airplanes.',
    tags: '嗜好,hobbies,模型,model'
  },
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的運動。',
    option_a: 'basketball', option_b: 'baseball', option_c: 'tennis', option_d: 'volleyball',
    answer: 'A',
    explanation: '句子說「他打籃球已經三年了，是隊長」，所以是 basketball。',
    audio_transcript: 'He has played basketball for three years and he is the team captain.',
    tags: '嗜好,hobbies,運動,sport,籃球,basketball'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She takes _____ lessons on Wednesdays."（芭蕾）',
    answer: 'ballet',
    explanation: '「ballet lessons」是芭蕾舞課，是受歡迎的課外活動。',
    audio_transcript: 'She takes ballet lessons on Wednesdays.',
    tags: '嗜好,hobbies,芭蕾,ballet'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人最常做的休閒活動。',
    option_a: 'surf the internet', option_b: 'watch TV', option_c: 'play video games', option_d: 'listen to music',
    answer: 'D',
    explanation: '句子說「她最喜歡戴耳機聽音樂，這讓她放鬆」，所以是 listen to music。',
    audio_transcript: 'She loves to listen to music with headphones. It helps her relax.',
    tags: '嗜好,hobbies,音樂,music'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："I enjoy _____ stamps from different countries."（收集）',
    answer: 'collecting',
    explanation: '「collecting stamps」是集郵，是一種傳統的嗜好。',
    audio_transcript: 'I enjoy collecting stamps from different countries.',
    tags: '嗜好,hobbies,集郵,stamps'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個人最近開始的新嗜好。',
    option_a: 'baking', option_b: 'knitting', option_c: 'photography', option_d: 'gardening',
    answer: 'C',
    explanation: '句子說「我最近開始學攝影，我喜歡拍花朵」，所以是 photography。',
    audio_transcript: 'I recently started learning photography. I love taking pictures of flowers.',
    tags: '嗜好,hobbies,攝影,photography'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："He spends his free time _____ chess with his grandfather."（下棋）',
    answer: 'playing',
    explanation: '「play chess」是下西洋棋，「playing chess」是現在進行式。',
    audio_transcript: 'He spends his free time playing chess with his grandfather.',
    tags: '嗜好,hobbies,象棋,chess'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的活動頻率。',
    option_a: 'every day', option_b: 'once a week', option_c: 'twice a month', option_d: 'never',
    answer: 'B',
    explanation: '句子說「她每週去一次瑜珈課」，so「once a week」正確。',
    audio_transcript: 'She goes to yoga class once a week.',
    tags: '嗜好,hobbies,頻率,frequency'
  },

  // ── 主題三：天氣與季節 Weather & Seasons ──────────────────────────────────
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出今天的天氣。',
    option_a: 'sunny', option_b: 'rainy', option_c: 'cloudy', option_d: 'snowy',
    answer: 'B',
    explanation: '句子說「今天在下雨，記得帶傘」，所以是 rainy。',
    audio_transcript: 'It is raining today. Remember to bring an umbrella.',
    tags: '天氣,weather,下雨,rain'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的天氣形容詞（英文）。\n句子："It is very _____ today. I need to wear sunscreen."（炎熱）',
    answer: 'hot',
    explanation: '「hot」是炎熱，需要擦防曬乳的時候通常是大太陽天氣。',
    audio_transcript: 'It is very hot today. I need to wear sunscreen.',
    tags: '天氣,weather,炎熱,hot'
  },
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的季節。',
    option_a: 'spring', option_b: 'summer', option_c: 'fall', option_d: 'winter',
    answer: 'D',
    explanation: '句子說「冬天很冷，我穿了很厚的外套」，所以是 winter。',
    audio_transcript: 'Winter is very cold. I wear a thick coat.',
    tags: '天氣,weather,季節,season,冬天,winter'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的季節名稱（英文）。\n句子："Cherry blossoms bloom in _____ in Taiwan."（春天）',
    answer: 'spring',
    explanation: '「spring」是春天，台灣的櫻花在春天盛開。',
    audio_transcript: 'Cherry blossoms bloom in spring in Taiwan.',
    tags: '天氣,weather,春天,spring'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出今天的氣溫描述。',
    option_a: 'very cold', option_b: 'warm', option_c: 'cool', option_d: 'boiling hot',
    answer: 'C',
    explanation: '句子說「今天涼爽，適合在公園散步」，所以是 cool。',
    audio_transcript: 'The weather is cool today. It is perfect for a walk in the park.',
    tags: '天氣,weather,涼爽,cool'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："A _____ is coming, so we should stay indoors."（颱風）',
    answer: 'typhoon',
    explanation: '「typhoon」是颱風，台灣夏天常有颱風，需要待在室內。',
    audio_transcript: 'A typhoon is coming, so we should stay indoors.',
    tags: '天氣,weather,颱風,typhoon'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出哪個季節最受歡迎。',
    option_a: 'summer', option_b: 'spring', option_c: 'fall', option_d: 'winter',
    answer: 'C',
    explanation: '句子說「秋天天氣最舒服，不太熱也不太冷」，所以是 fall。',
    audio_transcript: 'Fall has the most comfortable weather. It is not too hot or too cold.',
    tags: '天氣,weather,秋天,fall'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："There is heavy _____ in the mountains today."（霧）',
    answer: 'fog',
    explanation: '「fog」是霧，山區常有霧，能見度低。',
    audio_transcript: 'There is heavy fog in the mountains today.',
    tags: '天氣,weather,霧,fog'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽天氣預報，選出明天的天氣預測。',
    option_a: 'sunny in the morning, rain in the afternoon',
    option_b: 'rain all day',
    option_c: 'cloudy with strong winds',
    option_d: 'clear and dry',
    answer: 'A',
    explanation: '天氣預報說「早上晴朗，下午有雨」，所以選 A。',
    audio_transcript: 'Tomorrow will be sunny in the morning, but rain is expected in the afternoon.',
    tags: '天氣,weather,預報,forecast'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："We had a beautiful _____ after the rain yesterday."（彩虹）',
    answer: 'rainbow',
    explanation: '「rainbow」是彩虹，通常在雨後出現。',
    audio_transcript: 'We had a beautiful rainbow after the rain yesterday.',
    tags: '天氣,weather,彩虹,rainbow'
  },

  // ── 主題四：交通與方向 Transportation & Directions ───────────────────────
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出這個人如何上學。',
    option_a: 'by bus', option_b: 'by bicycle', option_c: 'on foot', option_d: 'by car',
    answer: 'C',
    explanation: '句子說「我每天步行去學校，大約走十分鐘」，所以是 on foot。',
    audio_transcript: 'I walk to school every day. It takes about ten minutes.',
    tags: '交通,transportation,步行,walk'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的交通工具（英文）。\n句子："She takes the _____ to go to the city center."（地鐵）',
    answer: 'MRT',
    explanation: '「MRT」是捷運（Mass Rapid Transit），台灣主要城市的大眾運輸。',
    audio_transcript: 'She takes the MRT to go to the city center.',
    tags: '交通,transportation,捷運,MRT'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的方向。',
    option_a: 'turn left', option_b: 'go straight', option_c: 'turn right', option_d: 'go back',
    answer: 'B',
    explanation: '句子說「直走到紅綠燈然後左轉」，第一個動作是直走（go straight）。',
    audio_transcript: 'Go straight to the traffic light and then turn left.',
    tags: '方向,directions,直走,straight'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的地點（英文）。\n句子："The post office is next to the _____ ."（銀行）',
    answer: 'bank',
    explanation: '「bank」是銀行，郵局在銀行旁邊。',
    audio_transcript: 'The post office is next to the bank.',
    tags: '方向,directions,地點,location'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出公車幾號。',
    option_a: '18', option_b: '80', option_c: '8', option_d: '108',
    answer: 'B',
    explanation: '句子說「搭80號公車可以到達火車站」。',
    audio_transcript: 'Take bus number 80 to reach the train station.',
    tags: '交通,transportation,公車,bus'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："You need to _____ the train at Taipei Main Station."（換乘）',
    answer: 'transfer',
    explanation: '「transfer」是換車/轉乘，在台北車站需要換乘列車。',
    audio_transcript: 'You need to transfer the train at Taipei Main Station.',
    tags: '交通,transportation,換車,transfer'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出最快到達目的地的交通方式。',
    option_a: 'taxi', option_b: 'bus', option_c: 'bike', option_d: 'walking',
    answer: 'A',
    explanation: '句子說「搭計程車最快，雖然比較貴」，所以是 taxi。',
    audio_transcript: 'Taking a taxi is the fastest way, although it is more expensive.',
    tags: '交通,transportation,計程車,taxi'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The _____ is very busy at rush hour."（道路）',
    answer: 'road',
    explanation: '「road」是道路，尖峰時刻交通非常擁擠。',
    audio_transcript: 'The road is very busy at rush hour.',
    tags: '交通,transportation,道路,road'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出捷運站的位置。',
    option_a: 'across from the school', option_b: 'behind the park', option_c: 'between two banks', option_d: 'next to the hospital',
    answer: 'D',
    explanation: '句子說「捷運站在醫院旁邊」，所以是 next to the hospital。',
    audio_transcript: 'The MRT station is next to the hospital.',
    tags: '方向,directions,位置,location'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Please fasten your _____ belt on the airplane."（安全）',
    answer: 'seat',
    explanation: '「seat belt」是安全帶，在飛機上必須繫好。',
    audio_transcript: 'Please fasten your seat belt on the airplane.',
    tags: '交通,transportation,飛機,airplane'
  },

  // ── 主題五：購物與金錢 Shopping & Money ────────────────────────────────────
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出商品的價格。',
    option_a: '30 dollars', option_b: '13 dollars', option_c: '300 dollars', option_d: '3 dollars',
    answer: 'A',
    explanation: '句子說「這本書三十元」，所以是 30 dollars。',
    audio_transcript: 'This book costs thirty dollars.',
    tags: '購物,shopping,價格,price'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的數字（英文）。\n句子："I paid _____ dollars for the T-shirt."（五十）',
    answer: 'fifty',
    explanation: '「fifty」是五十，50 dollars 是付的金額。',
    audio_transcript: 'I paid fifty dollars for the T-shirt.',
    tags: '購物,shopping,數字,number'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽對話，選出顧客最後買了什麼。',
    option_a: 'a blue shirt', option_b: 'a red shirt', option_c: 'a blue jacket', option_d: 'a red jacket',
    answer: 'A',
    explanation: '句子說「我買了一件藍色的襯衫，因為它剛好合適」，所以是 a blue shirt。',
    audio_transcript: 'I bought a blue shirt because it fit perfectly.',
    tags: '購物,shopping,衣服,clothes'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："This item is on _____ . It is 20% off."（促銷）',
    answer: 'sale',
    explanation: '「on sale」是在促銷，打折的意思。',
    audio_transcript: 'This item is on sale. It is 20% off.',
    tags: '購物,shopping,促銷,sale'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的找零金額。',
    option_a: '5 dollars', option_b: '10 dollars', option_c: '15 dollars', option_d: '20 dollars',
    answer: 'C',
    explanation: '物品65元，付80元，找零80-65=15元。',
    audio_transcript: 'The item costs sixty-five dollars. I paid eighty dollars. The change is fifteen dollars.',
    tags: '購物,shopping,找零,change'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Do you accept _____ cards here?"（信用卡）',
    answer: 'credit',
    explanation: '「credit card」是信用卡，現代購物常用的付款方式。',
    audio_transcript: 'Do you accept credit cards here?',
    tags: '購物,shopping,信用卡,credit card'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個人為什麼退貨。',
    option_a: 'wrong size', option_b: 'wrong color', option_c: 'broken item', option_d: 'too expensive',
    answer: 'A',
    explanation: '句子說「我想退這件衣服，因為尺寸不對，我需要大一號」，所以是 wrong size。',
    audio_transcript: 'I want to return this shirt. The size is wrong. I need a larger one.',
    tags: '購物,shopping,退貨,return'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："This store has a special _____ on weekends."（折扣）',
    answer: 'discount',
    explanation: '「discount」是折扣，週末特別優惠。',
    audio_transcript: 'This store has a special discount on weekends.',
    tags: '購物,shopping,折扣,discount'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出超市在哪一層樓。',
    option_a: '1F', option_b: 'B1', option_c: '3F', option_d: '2F',
    answer: 'B',
    explanation: '句子說「超市在地下一樓，搭電梯往下一層」，所以是 B1。',
    audio_transcript: 'The supermarket is on basement floor one. Take the elevator down one floor.',
    tags: '購物,shopping,樓層,floor'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The _____ is 10 dollars, not included in the price."（運費）',
    answer: 'shipping',
    explanation: '「shipping fee」是運費，網購時常需要另外付費。',
    audio_transcript: 'The shipping fee is 10 dollars, not included in the price.',
    tags: '購物,shopping,運費,shipping'
  },

  // ── 主題六：飲食與餐廳 Food & Restaurants ─────────────────────────────────
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出這個人最喜歡的食物。',
    option_a: 'pizza', option_b: 'hamburger', option_c: 'spaghetti', option_d: 'sushi',
    answer: 'D',
    explanation: '句子說「我最喜歡壽司，尤其是鮪魚的」，所以是 sushi。',
    audio_transcript: 'My favorite food is sushi, especially tuna sushi.',
    tags: '飲食,food,壽司,sushi'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的飲料（英文）。\n句子："Can I have a cup of _____, please?"（咖啡）',
    answer: 'coffee',
    explanation: '「coffee」是咖啡，常見的點餐用語。',
    audio_transcript: 'Can I have a cup of coffee, please?',
    tags: '飲食,food,咖啡,coffee'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽對話，選出這個人點了什麼主餐。',
    option_a: 'fish and chips', option_b: 'chicken salad', option_c: 'beef steak', option_d: 'vegetable soup',
    answer: 'C',
    explanation: '句子說「我要點牛排，請煮七分熟」，所以是 beef steak。',
    audio_transcript: 'I would like to order a beef steak, cooked medium well, please.',
    tags: '飲食,food,餐廳,restaurant'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："This soup is too _____ . Could I have some water?"（鹹）',
    answer: 'salty',
    explanation: '「salty」是鹹的，湯太鹹想要喝水。',
    audio_transcript: 'This soup is too salty. Could I have some water?',
    tags: '飲食,food,口味,taste'
  },
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出早餐吃了什麼。',
    option_a: 'eggs and toast', option_b: 'cereal and milk', option_c: 'pancakes', option_d: 'porridge',
    answer: 'B',
    explanation: '句子說「我早餐吃麥片配牛奶」，所以是 cereal and milk。',
    audio_transcript: 'I have cereal and milk for breakfast every morning.',
    tags: '飲食,food,早餐,breakfast'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She is a _____ and does not eat any meat."（素食者）',
    answer: 'vegetarian',
    explanation: '「vegetarian」是素食者，不吃任何肉類食品。',
    audio_transcript: 'She is a vegetarian and does not eat any meat.',
    tags: '飲食,food,素食,vegetarian'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這家餐廳的特色。',
    option_a: 'cheap prices', option_b: 'large portions', option_c: 'fast service', option_d: 'live music',
    answer: 'B',
    explanation: '句子說「這家餐廳份量很多，一個人吃不完」，所以是 large portions。',
    audio_transcript: 'This restaurant has very large portions. One person cannot finish everything.',
    tags: '飲食,food,餐廳,restaurant'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Could we have the _____, please? We are ready to pay."（帳單）',
    answer: 'bill',
    explanation: '「bill」是帳單，在餐廳結帳時使用。',
    audio_transcript: 'Could we have the bill, please? We are ready to pay.',
    tags: '飲食,food,帳單,bill'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出這個人對食物的過敏反應。',
    option_a: 'nuts', option_b: 'seafood', option_c: 'dairy', option_d: 'eggs',
    answer: 'B',
    explanation: '句子說「我對海鮮過敏，請不要在我的餐點裡加任何海鮮」，所以是 seafood。',
    audio_transcript: 'I am allergic to seafood. Please do not add any seafood to my dish.',
    tags: '飲食,food,過敏,allergy'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The restaurant is fully _____ on Friday nights."（預訂）',
    answer: 'booked',
    explanation: '「fully booked」是全部訂滿，表示沒有空位了。',
    audio_transcript: 'The restaurant is fully booked on Friday nights.',
    tags: '飲食,food,訂位,reservation'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出甜點是什麼。',
    option_a: 'ice cream', option_b: 'cake', option_c: 'pudding', option_d: 'cookies',
    answer: 'C',
    explanation: '句子說「今天的甜點是布丁，配上焦糖醬」，所以是 pudding。',
    audio_transcript: 'Today\'s dessert is pudding with caramel sauce.',
    tags: '飲食,food,甜點,dessert'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："I would like my steak _____ well done, please."（五分熟）',
    answer: 'medium',
    explanation: '「medium well done」是五分熟，牛排的熟度選項之一。',
    audio_transcript: 'I would like my steak medium well done, please.',
    tags: '飲食,food,牛排,steak'
  },

  // ── 主題七：描述人物與外表 Describing People ──────────────────────────────
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出頭髮的顏色。',
    option_a: 'black', option_b: 'brown', option_c: 'blonde', option_d: 'red',
    answer: 'C',
    explanation: '句子說「她有一頭金色的長髮，非常漂亮」，所以是 blonde。',
    audio_transcript: 'She has long blonde hair. It is very beautiful.',
    tags: '外表,appearance,頭髮,hair'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："He is very _____ and can reach the top shelf easily."（高）',
    answer: 'tall',
    explanation: '「tall」是高的，他可以輕鬆夠到最高的架子。',
    audio_transcript: 'He is very tall and can reach the top shelf easily.',
    tags: '外表,appearance,高,tall'
  },
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出這個人戴了什麼。',
    option_a: 'a hat', option_b: 'glasses', option_c: 'earrings', option_d: 'a scarf',
    answer: 'B',
    explanation: '句子說「那個戴眼鏡的男孩是我弟弟」，所以是 glasses。',
    audio_transcript: 'The boy with glasses is my brother.',
    tags: '外表,appearance,眼鏡,glasses'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的形容詞（英文）。\n句子："My grandmother has _____ hair and a warm smile."（白色）',
    answer: 'white',
    explanation: '「white hair」是白頭髮，老人家通常有白髮。',
    audio_transcript: 'My grandmother has white hair and a warm smile.',
    tags: '外表,appearance,頭髮,hair'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出描述這個人個性的詞。',
    option_a: 'shy', option_b: 'outgoing', option_c: 'quiet', option_d: 'lazy',
    answer: 'B',
    explanation: '句子說「她非常外向，在派對上認識了很多新朋友」，所以是 outgoing。',
    audio_transcript: 'She is very outgoing and made many new friends at the party.',
    tags: '外表,appearance,個性,personality'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："He has a long _____ and a mustache."（鬍子）',
    answer: 'beard',
    explanation: '「beard」是下巴鬍鬚，「mustache」是上唇鬍鬚。',
    audio_transcript: 'He has a long beard and a mustache.',
    tags: '外表,appearance,鬍鬚,beard'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出老師穿了什麼顏色的衣服。',
    option_a: 'red', option_b: 'green', option_c: 'blue', option_d: 'yellow',
    answer: 'C',
    explanation: '句子說「我們的老師今天穿了一件藍色的西裝」，所以是 blue。',
    audio_transcript: 'Our teacher is wearing a blue suit today.',
    tags: '外表,appearance,衣服,clothes,顏色,color'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She looks very _____ like her mother."（像）',
    answer: 'similar',
    explanation: '「look similar」是看起來很像，她長得很像她媽媽。',
    audio_transcript: 'She looks very similar to her mother.',
    tags: '外表,appearance,相似,similar'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個人的年齡範圍。',
    option_a: '10-15 years old', option_b: '20-25 years old', option_c: '30-35 years old', option_d: '40-50 years old',
    answer: 'C',
    explanation: '句子說「他看起來大約三十多歲，但實際上已經四十五歲了」，外表是30-35。',
    audio_transcript: 'He looks about thirty years old, but he is actually forty-five.',
    tags: '外表,appearance,年齡,age'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The woman with the _____ dress is my aunt."（條紋）',
    answer: 'striped',
    explanation: '「striped dress」是條紋洋裝，描述特定外表特徵。',
    audio_transcript: 'The woman with the striped dress is my aunt.',
    tags: '外表,appearance,圖案,pattern'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人的身材描述。',
    option_a: 'tall and thin', option_b: 'short and fat', option_c: 'medium height', option_d: 'very muscular',
    answer: 'A',
    explanation: '句子說「那位籃球員非常高且瘦，跑起來很快」，所以是 tall and thin。',
    audio_transcript: 'That basketball player is very tall and thin. He runs very fast.',
    tags: '外表,appearance,身材,body'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She always has a _____ on her face and makes everyone happy."（微笑）',
    answer: 'smile',
    explanation: '「a smile on her face」是臉上帶著微笑，讓每個人都開心。',
    audio_transcript: 'She always has a smile on her face and makes everyone happy.',
    tags: '外表,appearance,微笑,smile'
  },

  // ── 主題八：時間與日期 Time & Dates ───────────────────────────────────────
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的時間。',
    option_a: '7:30', option_b: '7:15', option_c: '6:30', option_d: '7:45',
    answer: 'A',
    explanation: '句子說「現在是七點半」，所以是 7:30。',
    audio_transcript: 'It is seven thirty now.',
    tags: '時間,time'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的月份（英文）。\n句子："My birthday is in _____ . I love summer!"（七月）',
    answer: 'July',
    explanation: '「July」是七月，夏天的月份。',
    audio_transcript: 'My birthday is in July. I love summer!',
    tags: '時間,time,月份,month'
  },
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的星期幾。',
    option_a: 'Monday', option_b: 'Wednesday', option_c: 'Friday', option_d: 'Sunday',
    answer: 'C',
    explanation: '句子說「每個星期五我們學校下午不上課」，所以是 Friday。',
    audio_transcript: 'We do not have classes in the afternoon every Friday.',
    tags: '時間,time,星期,weekday'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The school year starts in _____ and ends in June."（九月）',
    answer: 'September',
    explanation: '「September」是九月，許多國家的學年從九月開始。',
    audio_transcript: 'The school year starts in September and ends in June.',
    tags: '時間,time,月份,month'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出活動在幾點鐘開始。',
    option_a: '2:00 PM', option_b: '2:30 PM', option_c: '3:00 PM', option_d: '3:30 PM',
    answer: 'C',
    explanation: '句子說「音樂會下午三點準時開始，請早一點到」，所以是 3:00 PM。',
    audio_transcript: 'The concert starts at three o\'clock in the afternoon. Please arrive early.',
    tags: '時間,time'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："We have a _____ day today and no homework!"（假日/放假）',
    answer: 'holiday',
    explanation: '「holiday」是假日，今天放假不用寫作業。',
    audio_transcript: 'We have a holiday today and no homework!',
    tags: '時間,time,假日,holiday'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人多久前到達。',
    option_a: '10 minutes ago', option_b: '30 minutes ago', option_c: '1 hour ago', option_d: '2 hours ago',
    answer: 'B',
    explanation: '句子說「我三十分鐘前就到了，一直在等你」，所以是 30 minutes ago。',
    audio_transcript: 'I arrived thirty minutes ago and have been waiting for you.',
    tags: '時間,time'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The library is open from Monday to _____ ."（星期六）',
    answer: 'Saturday',
    explanation: '「Saturday」是星期六，圖書館開放的日子。',
    audio_transcript: 'The library is open from Monday to Saturday.',
    tags: '時間,time,星期,weekday'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出會議重新安排的日期。',
    option_a: 'March 5', option_b: 'March 15', option_c: 'March 50', option_d: 'March 25',
    answer: 'B',
    explanation: '句子說「會議改到三月十五日」，所以是 March 15。',
    audio_transcript: 'The meeting has been rescheduled to March fifteenth.',
    tags: '時間,time,日期,date'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She was born in the last _____ of the 20th century."（十年）',
    answer: 'decade',
    explanation: '「decade」是十年，20世紀最後十年是1990-2000年。',
    audio_transcript: 'She was born in the last decade of the 20th century.',
    tags: '時間,time,年代,decade'
  },

  // ── 主題九：情緒與感受 Emotions & Feelings ────────────────────────────────
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出這個人的感受。',
    option_a: 'happy', option_b: 'sad', option_c: 'angry', option_d: 'scared',
    answer: 'A',
    explanation: '句子說「他通過了考試，非常開心地跳起來」，所以是 happy。',
    audio_transcript: 'He passed the exam and jumped with happiness.',
    tags: '情緒,emotions,快樂,happy'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的情緒詞（英文）。\n句子："She felt _____ when her best friend moved away."（難過）',
    answer: 'sad',
    explanation: '「sad」是難過的，好朋友搬走了當然會傷心。',
    audio_transcript: 'She felt sad when her best friend moved away.',
    tags: '情緒,emotions,難過,sad'
  },
  {
    type: 'choice', difficulty: 1,
    content: '🎧 請聆聽句子，選出這個人為什麼緊張。',
    option_a: 'first day of school', option_b: 'taking a test', option_c: 'meeting new people', option_d: 'giving a speech',
    answer: 'D',
    explanation: '句子說「他在全班面前演講時很緊張，手都在抖」，所以是 giving a speech。',
    audio_transcript: 'He was very nervous when giving a speech in front of the whole class. His hands were shaking.',
    tags: '情緒,emotions,緊張,nervous'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的情緒詞（英文）。\n句子："I am so _____ that I cannot sleep tonight."（興奮）',
    answer: 'excited',
    explanation: '「excited」是興奮的，太興奮了睡不著。',
    audio_transcript: 'I am so excited that I cannot sleep tonight.',
    tags: '情緒,emotions,興奮,excited'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人的感受。',
    option_a: 'bored', option_b: 'confused', option_c: 'surprised', option_d: 'embarrassed',
    answer: 'C',
    explanation: '句子說「她打開禮物時非常驚訝，沒想到會收到這個」，所以是 surprised。',
    audio_transcript: 'She was very surprised when she opened the gift. She did not expect it.',
    tags: '情緒,emotions,驚訝,surprised'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的情緒詞（英文）。\n句子："He felt _____ about forgetting his mom\'s birthday."（內疚）',
    answer: 'guilty',
    explanation: '「guilty」是內疚的，忘了媽媽的生日會感到愧疚。',
    audio_transcript: "He felt guilty about forgetting his mom's birthday.",
    tags: '情緒,emotions,內疚,guilty'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個孩子的感受。',
    option_a: 'lonely', option_b: 'proud', option_c: 'worried', option_d: 'calm',
    answer: 'B',
    explanation: '句子說「他贏得了比賽，父母都非常以他為傲，他也很驕傲」，所以是 proud。',
    audio_transcript: 'He won the competition. His parents are proud of him, and he feels proud too.',
    tags: '情緒,emotions,驕傲,proud'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的情緒詞（英文）。\n句子："She was _____ in the large crowd and could not find her parents."（害怕）',
    answer: 'scared',
    explanation: '「scared」是害怕的，在人群中迷路找不到父母當然很害怕。',
    audio_transcript: 'She was scared in the large crowd and could not find her parents.',
    tags: '情緒,emotions,害怕,scared'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出最能描述這個人感受的詞。',
    option_a: 'disappointed', option_b: 'frustrated', option_c: 'relieved', option_d: 'jealous',
    answer: 'C',
    explanation: '句子說「他通過了期末考試後，終於鬆了一口氣，感到輕鬆」，所以是 relieved。',
    audio_transcript: 'After passing the final exam, he finally relaxed and felt relieved.',
    tags: '情緒,emotions,放鬆,relieved'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的情緒詞（英文）。\n句子："The students are _____ because the school canceled the field trip."（失望）',
    answer: 'disappointed',
    explanation: '「disappointed」是失望的，學校取消了校外教學讓學生失望。',
    audio_transcript: 'The students are disappointed because the school canceled the field trip.',
    tags: '情緒,emotions,失望,disappointed'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人感到疲倦的原因。',
    option_a: 'stayed up late', option_b: 'ran a marathon', option_c: 'worked all day', option_d: 'studied too much',
    answer: 'A',
    explanation: '句子說「她昨晚熬夜看電影，今天早上非常疲倦」，所以是 stayed up late。',
    audio_transcript: 'She stayed up late watching movies last night and feels very tired this morning.',
    tags: '情緒,emotions,疲倦,tired'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的情緒詞（英文）。\n句子："I feel _____ when I listen to classical music."（放鬆）',
    answer: 'relaxed',
    explanation: '「relaxed」是放鬆的，聽古典音樂讓人心情平靜放鬆。',
    audio_transcript: 'I feel relaxed when I listen to classical music.',
    tags: '情緒,emotions,放鬆,relaxed'
  },
];

const insert = db.prepare(`
  INSERT INTO questions
    (subject_id, type, difficulty, content, option_a, option_b, option_c, option_d, answer, explanation, audio_transcript, tags, grade_level)
  VALUES
    (@subject_id, @type, @difficulty, @content, @option_a, @option_b, @option_c, @option_d, @answer, @explanation, @audio_transcript, @tags, @grade_level)
`);

const insertAll = db.transaction((qs) => {
  let count = 0;
  for (const q of qs) {
    insert.run({
      subject_id: subjectId,
      type: q.type,
      difficulty: q.difficulty,
      content: q.content,
      option_a: q.option_a || null,
      option_b: q.option_b || null,
      option_c: q.option_c || null,
      option_d: q.option_d || null,
      answer: q.answer,
      explanation: q.explanation || '',
      audio_transcript: q.audio_transcript || '',
      tags: q.tags || '',
      grade_level: 'grade_7',
    });
    count++;
  }
  return count;
});

const inserted = insertAll(questions);
console.log(`✅ 成功植入 ${inserted} 道國一英文聽力題`);
console.log(`   科目：英文聽力（ENG_LISTEN_7），學段：grade_7`);

const stats = db.prepare(`
  SELECT type, count(*) as cnt FROM questions WHERE subject_id = ? GROUP BY type
`).all(subjectId);
console.log('題型分布:', stats);
