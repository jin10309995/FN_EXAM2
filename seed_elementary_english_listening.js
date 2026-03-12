'use strict';
const db = require('./database');

const subjectRow = db.prepare(`SELECT id FROM subjects WHERE code = 'ENG' AND grade_level = 'elementary_6'`).get();
if (!subjectRow) { console.error('找不到 ENG (elementary_6) 科目，請先執行 database.js 初始化'); process.exit(1); }
const subjectId = subjectRow.id;

const questions = [

  // ── 主題一：日常作息 Daily Routine ──────────────────────────────────────
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的時間活動。',
    option_a: 'brush teeth', option_b: 'eat lunch', option_c: 'go to bed', option_d: 'take a bath',
    answer: 'A',
    explanation: '「brush teeth」是刷牙，是早晨常見的日常活動。',
    audio_transcript: 'I brush my teeth every morning.',
    tags: '日常作息,daily routine,動詞,verb'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的活動。',
    option_a: 'read a book', option_b: 'watch TV', option_c: 'play soccer', option_d: 'cook dinner',
    answer: 'B',
    explanation: '「watch TV」是看電視，是下午常見的休閒活動。',
    audio_transcript: 'I watch TV in the afternoon.',
    tags: '日常作息,daily routine,休閒,leisure'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的時間詞（英文）。\n句子："I wake up at seven _____."',
    answer: "o'clock",
    explanation: "「o'clock」是「點鐘」，表示整點時間。",
    audio_transcript: "I wake up at seven o'clock.",
    tags: '日常作息,時間,time,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的活動。',
    option_a: 'do homework', option_b: 'have breakfast', option_c: 'take a nap', option_d: 'go shopping',
    answer: 'A',
    explanation: '「do homework」是做作業，通常在放學後進行。',
    audio_transcript: 'I do my homework after school.',
    tags: '日常作息,daily routine,學校,school'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的活動英文單字。\n（提示：這是睡前的一個活動）',
    answer: 'shower',
    explanation: '「shower」是淋浴，許多人在睡前會洗澡。shower → s-h-o-w-e-r',
    audio_transcript: 'I take a shower before bed.',
    tags: '日常作息,daily routine,spelling'
  },

  // ── 主題二：家庭成員 Family Members ────────────────────────────────────
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的家庭成員。',
    option_a: 'uncle', option_b: 'brother', option_c: 'cousin', option_d: 'grandfather',
    answer: 'B',
    explanation: '「brother」是哥哥或弟弟，是直系家庭成員。',
    audio_transcript: 'My brother is eight years old.',
    tags: '家庭,family,成員,member'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的家庭成員。',
    option_a: 'aunt', option_b: 'sister', option_c: 'grandmother', option_d: 'daughter',
    answer: 'C',
    explanation: '「grandmother」是祖母或外婆，是長輩家庭成員。',
    audio_transcript: 'My grandmother makes delicious cookies.',
    tags: '家庭,family,成員,member'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的家庭成員單字（英文）。\n句子："My _____ teaches math at school."',
    answer: 'father',
    explanation: '「father」是父親，dad 也是常見的說法。',
    audio_transcript: 'My father teaches math at school.',
    tags: '家庭,family,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的家庭成員。',
    option_a: 'nephew', option_b: 'niece', option_c: 'cousin', option_d: 'twin',
    answer: 'C',
    explanation: '「cousin」是表兄弟姊妹，是旁系家庭成員。',
    audio_transcript: 'My cousin lives in Taipei.',
    tags: '家庭,family,成員,member'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的家庭成員英文單字。\n（提示：這是媽媽的兄弟）',
    answer: 'uncle',
    explanation: '「uncle」是伯父、叔叔或舅舅。uncle → u-n-c-l-e',
    audio_transcript: 'My uncle takes me to the park.',
    tags: '家庭,family,spelling'
  },

  // ── 主題三：身體部位 Body Parts ─────────────────────────────────────────
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的身體部位。',
    option_a: 'eye', option_b: 'ear', option_c: 'nose', option_d: 'mouth',
    answer: 'C',
    explanation: '「nose」是鼻子，位於臉部中央，用來聞氣味。',
    audio_transcript: 'I smell flowers with my nose.',
    tags: '身體,body,部位,part'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的身體部位。',
    option_a: 'finger', option_b: 'arm', option_c: 'leg', option_d: 'knee',
    answer: 'D',
    explanation: '「knee」是膝蓋，位於腿部中間的關節。',
    audio_transcript: 'I hurt my knee when I fell down.',
    tags: '身體,body,部位,part'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的身體部位（英文）。\n句子："She has long _____ hair."',
    answer: 'black',
    explanation: '此句描述頭髮的顏色特徵，「black」是黑色。',
    audio_transcript: 'She has long black hair.',
    tags: '身體,body,形容詞,adjective,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的身體部位。',
    option_a: 'shoulder', option_b: 'elbow', option_c: 'wrist', option_d: 'ankle',
    answer: 'A',
    explanation: '「shoulder」是肩膀，連接手臂與軀幹的部位。',
    audio_transcript: 'I carry my backpack on my shoulder.',
    tags: '身體,body,部位,part'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的身體部位英文單字。\n（提示：用來聽聲音的器官）',
    answer: 'ears',
    explanation: '「ear」是耳朵，複數為「ears」。ear → e-a-r-s',
    audio_transcript: 'I listen to music with my ears.',
    tags: '身體,body,spelling'
  },

  // ── 主題四：衣物 Clothing ───────────────────────────────────────────────
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的衣物。',
    option_a: 'coat', option_b: 'shorts', option_c: 'gloves', option_d: 'scarf',
    answer: 'C',
    explanation: '「gloves」是手套，天冷時戴在手上保暖。',
    audio_transcript: 'I wear gloves when it is cold.',
    tags: '衣物,clothing,天氣,weather'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的衣物。',
    option_a: 'dress', option_b: 'skirt', option_c: 'suit', option_d: 'uniform',
    answer: 'D',
    explanation: '「uniform」是制服，學生上學通常穿制服。',
    audio_transcript: 'Students wear a uniform to school.',
    tags: '衣物,clothing,學校,school'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的衣物單字（英文）。\n句子："Please put on your _____ before going out."',
    answer: 'jacket',
    explanation: '「jacket」是夾克或薄外套，外出時穿著保暖。',
    audio_transcript: 'Please put on your jacket before going out.',
    tags: '衣物,clothing,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的衣物。',
    option_a: 'sneakers', option_b: 'sandals', option_c: 'boots', option_d: 'slippers',
    answer: 'C',
    explanation: '「boots」是靴子，下雨天或冬天穿著防水保暖。',
    audio_transcript: 'I wear boots when it rains.',
    tags: '衣物,clothing,鞋子,shoes'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的衣物英文單字。\n（提示：戴在頭上遮陽的東西）',
    answer: 'hat',
    explanation: '「hat」是帽子，戴在頭上遮陽或保暖。hat → h-a-t',
    audio_transcript: 'She wears a hat in the summer.',
    tags: '衣物,clothing,spelling'
  },

  // ── 主題五：嗜好活動 Hobbies ────────────────────────────────────────────
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的嗜好。',
    option_a: 'painting', option_b: 'dancing', option_c: 'singing', option_d: 'cycling',
    answer: 'A',
    explanation: '「painting」是繪畫，使用顏料或水彩在紙上作畫。',
    audio_transcript: 'My hobby is painting pictures.',
    tags: '嗜好,hobby,藝術,art'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的嗜好。',
    option_a: 'cooking', option_b: 'gardening', option_c: 'swimming', option_d: 'reading',
    answer: 'D',
    explanation: '「reading」是閱讀，是培養知識的好嗜好。',
    audio_transcript: 'I enjoy reading books in my free time.',
    tags: '嗜好,hobby,閱讀,reading'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的嗜好動詞（英文）。\n句子："I like to _____ the piano every day."',
    answer: 'play',
    explanation: '「play」與樂器搭配使用，如 play the piano（彈鋼琴）。',
    audio_transcript: 'I like to play the piano every day.',
    tags: '嗜好,hobby,音樂,music,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的嗜好。',
    option_a: 'jogging', option_b: 'knitting', option_c: 'hiking', option_d: 'fishing',
    answer: 'C',
    explanation: '「hiking」是健行或爬山，是一種戶外活動。',
    audio_transcript: 'My family loves hiking in the mountains.',
    tags: '嗜好,hobby,戶外,outdoor'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，寫出聽到的嗜好英文單字。\n（提示：在水裡游泳）',
    answer: 'swimming',
    explanation: '「swimming」是游泳，是很受歡迎的水上運動。swimming → s-w-i-m-m-i-n-g',
    audio_transcript: 'Swimming is my favorite sport.',
    tags: '嗜好,hobby,運動,sport,spelling'
  },

  // ── 主題六：食物飲料 Food & Drinks ─────────────────────────────────────
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的食物。',
    option_a: 'pizza', option_b: 'hamburger', option_c: 'sandwich', option_d: 'noodles',
    answer: 'B',
    explanation: '「hamburger」是漢堡，由麵包夾肉排組成，是常見的速食。',
    audio_transcript: 'I eat a hamburger for lunch.',
    tags: '食物,food,飲食,diet'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的飲料。',
    option_a: 'tea', option_b: 'juice', option_c: 'soda', option_d: 'coffee',
    answer: 'B',
    explanation: '「juice」是果汁，是由水果榨成的飲料，富含維生素。',
    audio_transcript: 'I drink orange juice every morning.',
    tags: '飲料,drink,水果,fruit'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的食物名稱（英文）。\n句子："I put _____ on my bread every morning."',
    answer: 'butter',
    explanation: '「butter」是奶油，常塗在麵包上食用。',
    audio_transcript: 'I put butter on my bread every morning.',
    tags: '食物,food,早餐,breakfast,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的食物。',
    option_a: 'salad', option_b: 'soup', option_c: 'steak', option_d: 'dumpling',
    answer: 'D',
    explanation: '「dumpling」是水餃或湯圓，是亞洲常見的傳統食物。',
    audio_transcript: 'We eat dumplings during the holidays.',
    tags: '食物,food,傳統,tradition'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的食物英文單字。\n（提示：這是一種甜點，生日時常見）',
    answer: 'cake',
    explanation: '「cake」是蛋糕，生日時常吃生日蛋糕。cake → c-a-k-e',
    audio_transcript: 'We eat cake on my birthday.',
    tags: '食物,food,甜點,dessert,spelling'
  },

  // ── 主題七：社區場所 Community Places ──────────────────────────────────
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的地點。',
    option_a: 'hospital', option_b: 'library', option_c: 'post office', option_d: 'police station',
    answer: 'B',
    explanation: '「library」是圖書館，是借閱書籍和學習的地方。',
    audio_transcript: 'I borrow books from the library.',
    tags: '社區,community,地點,place'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的地點。',
    option_a: 'bank', option_b: 'bakery', option_c: 'museum', option_d: 'stadium',
    answer: 'B',
    explanation: '「bakery」是麵包店，販賣各種麵包和烘焙食品。',
    audio_transcript: 'We buy fresh bread at the bakery.',
    tags: '社區,community,地點,place,食物,food'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的地點名稱（英文）。\n句子："My mom goes to the _____ to buy vegetables."',
    answer: 'market',
    explanation: '「market」是市場，販賣蔬菜、水果和日用品。',
    audio_transcript: 'My mom goes to the market to buy vegetables.',
    tags: '社區,community,地點,place,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的地點。',
    option_a: 'airport', option_b: 'train station', option_c: 'bus stop', option_d: 'subway',
    answer: 'A',
    explanation: '「airport」是機場，是搭乘飛機的地方。',
    audio_transcript: 'We go to the airport to take a plane.',
    tags: '社區,community,交通,transport'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的場所英文單字。\n（提示：這是看醫生的地方）',
    answer: 'clinic',
    explanation: '「clinic」是診所，是小型的醫療機構。clinic → c-l-i-n-i-c',
    audio_transcript: 'I go to the clinic when I am sick.',
    tags: '社區,community,健康,health,spelling'
  },

  // ── 主題八：四季 Seasons ────────────────────────────────────────────────
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的季節。',
    option_a: 'spring', option_b: 'summer', option_c: 'autumn', option_d: 'winter',
    answer: 'A',
    explanation: '「spring」是春天，天氣溫暖，花朵盛開的季節。',
    audio_transcript: 'Flowers bloom in spring.',
    tags: '季節,season,天氣,weather,自然,nature'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的季節。',
    option_a: 'spring', option_b: 'summer', option_c: 'autumn', option_d: 'winter',
    answer: 'D',
    explanation: '「winter」是冬天，天氣寒冷，有時會下雪。',
    audio_transcript: 'It snows in winter.',
    tags: '季節,season,天氣,weather'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的季節單字（英文）。\n句子："We go swimming in the _____."',
    answer: 'summer',
    explanation: '「summer」是夏天，天氣炎熱，適合游泳。',
    audio_transcript: 'We go swimming in the summer.',
    tags: '季節,season,活動,activity,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的季節特徵。',
    option_a: 'hot and sunny', option_b: 'cold and snowy', option_c: 'warm and rainy', option_d: 'cool and windy',
    answer: 'C',
    explanation: '春天（spring）通常溫暖多雨，花朵盛開。',
    audio_transcript: 'Spring is warm and rainy. Flowers grow everywhere.',
    tags: '季節,season,天氣,weather,形容詞,adjective'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的季節英文單字。\n（提示：葉子變紅變黃的季節）',
    answer: 'autumn',
    explanation: '「autumn」是秋天（也稱 fall），葉子會變色掉落。autumn → a-u-t-u-m-n',
    audio_transcript: 'Leaves turn red and yellow in autumn.',
    tags: '季節,season,自然,nature,spelling'
  },

  // ── 主題九：比較級 Comparatives ─────────────────────────────────────────
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，選出正確的比較級形式。',
    option_a: 'bigger', option_b: 'biggest', option_c: 'more big', option_d: 'most big',
    answer: 'A',
    explanation: '「bigger」是 big 的比較級（big → bigger），用於兩者比較。',
    audio_transcript: 'An elephant is bigger than a dog.',
    tags: '比較級,comparative,文法,grammar'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，選出正確的比較級形式。',
    option_a: 'more fast', option_b: 'fastest', option_c: 'faster', option_d: 'most fast',
    answer: 'C',
    explanation: '「faster」是 fast 的比較級（fast → faster），用於兩者比較速度。',
    audio_transcript: 'A cheetah is faster than a lion.',
    tags: '比較級,comparative,文法,grammar'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，填入空格中的比較級（英文）。\n句子："This book is _____ than that one."',
    answer: 'longer',
    explanation: '「longer」是 long 的比較級，比較兩本書的長度/厚度。',
    audio_transcript: 'This book is longer than that one.',
    tags: '比較級,comparative,文法,grammar,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，選出正確的最高級形式。',
    option_a: 'tallest', option_b: 'taller', option_c: 'most tall', option_d: 'more tall',
    answer: 'A',
    explanation: '「tallest」是 tall 的最高級，表示三者或以上中最高的。',
    audio_transcript: 'She is the tallest girl in the class.',
    tags: '最高級,superlative,文法,grammar'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，寫出聽到的比較級英文單字。\n（提示：hot 的比較級）',
    answer: 'hotter',
    explanation: '「hotter」是 hot 的比較級，雙寫字尾再加 -er。hotter → h-o-t-t-e-r',
    audio_transcript: 'Today is hotter than yesterday.',
    tags: '比較級,comparative,文法,grammar,spelling'
  },

  // ── 主題十：問答對話 Q&A Dialogues ─────────────────────────────────────
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽對話，選出最適合的回答。\n問題："What do you want to eat?"',
    option_a: "I'm fine, thank you.", option_b: "I'd like some pizza.", option_c: "I go to school.", option_d: 'My name is Tom.',
    answer: 'B',
    explanation: '詢問想吃什麼時，應回答食物選擇。「I\'d like some pizza.」是正確的回應。',
    audio_transcript: "What do you want to eat? I'd like some pizza.",
    tags: '對話,dialogue,問答,Q&A,食物,food'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽對話，選出最適合的回答。\n問題："How do you go to school?"',
    option_a: 'I go at eight.', option_b: 'I go by bus.', option_c: 'I like school.', option_d: 'School is fun.',
    answer: 'B',
    explanation: '詢問交通方式時用 "by + 交通工具" 回答。「I go by bus.」是正確格式。',
    audio_transcript: 'How do you go to school? I go by bus.',
    tags: '對話,dialogue,交通,transport'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽對話，填入空格中的回應（英文）。\n問題 A: "How old are you?"\n答案 B: "I am _____ years old."',
    answer: 'twelve',
    explanation: '「twelve」是十二，國小六年級生通常 12 歲。',
    audio_transcript: 'How old are you? I am twelve years old.',
    tags: '對話,dialogue,年齡,age,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽對話，選出最適合的回答。\n問題："Where are you from?"',
    option_a: "I'm from Taiwan.", option_b: "I'm ten years old.", option_c: "I like cats.", option_d: "I'm happy.",
    answer: 'A',
    explanation: '詢問來自哪裡時，應回答地方名稱。「I\'m from Taiwan.」是正確回應。',
    audio_transcript: "Where are you from? I'm from Taiwan.",
    tags: '對話,dialogue,國籍,nationality'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽對話，寫出聽到的回應關鍵字（英文）。\n（提示：回答「你最喜歡什麼顏色？」的答案）',
    answer: 'blue',
    explanation: '「blue」是藍色，是詢問最喜歡顏色時的回答。blue → b-l-u-e',
    audio_transcript: "What is your favorite color? My favorite color is blue.",
    tags: '對話,dialogue,顏色,color,spelling'
  },

  // ── 主題十一：現在進行式 Present Continuous ────────────────────────────
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的現在進行式動詞。',
    option_a: 'is running', option_b: 'runs', option_c: 'run', option_d: 'was running',
    answer: 'A',
    explanation: '現在進行式 = is/am/are + V-ing，表示正在進行的動作。',
    audio_transcript: 'Look! The dog is running in the park.',
    tags: '現在進行式,present continuous,文法,grammar'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的現在進行式動詞。',
    option_a: 'are dancing', option_b: 'dance', option_c: 'danced', option_d: 'will dance',
    answer: 'A',
    explanation: '主詞 They/We 搭配 are + V-ing 構成現在進行式。',
    audio_transcript: 'They are dancing at the party right now.',
    tags: '現在進行式,present continuous,文法,grammar'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的現在進行式動詞（英文）。\n句子："She is _____ a letter to her friend."',
    answer: 'writing',
    explanation: '「writing」是 write 的現在進行式（write → writing），表示正在寫。',
    audio_transcript: 'She is writing a letter to her friend.',
    tags: '現在進行式,present continuous,文法,grammar,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的現在進行式句子。',
    option_a: 'He eats breakfast.', option_b: 'He is eating breakfast.', option_c: 'He ate breakfast.', option_d: 'He will eat breakfast.',
    answer: 'B',
    explanation: '「is eating」是現在進行式，表示他現在正在吃早餐。',
    audio_transcript: 'He is eating breakfast right now.',
    tags: '現在進行式,present continuous,文法,grammar'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，寫出聽到的現在進行式動詞（英文）。\n（提示：表示「正在讀書」的動詞形式）',
    answer: 'studying',
    explanation: '「studying」是 study 的現在進行式（y → y，加 ing）。studying → s-t-u-d-y-i-n-g',
    audio_transcript: 'I am studying for my exam.',
    tags: '現在進行式,present continuous,文法,grammar,spelling'
  },

  // ── 主題十二：過去式 Past Tense ─────────────────────────────────────────
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，選出正確的過去式動詞。',
    option_a: 'go', option_b: 'goes', option_c: 'went', option_d: 'going',
    answer: 'C',
    explanation: '「went」是 go 的不規則過去式，表示昨天的行動。',
    audio_transcript: 'I went to the zoo yesterday.',
    tags: '過去式,past tense,文法,grammar'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，選出正確的過去式動詞。',
    option_a: 'see', option_b: 'saw', option_c: 'seen', option_d: 'sees',
    answer: 'B',
    explanation: '「saw」是 see 的不規則過去式，表示過去看到的動作。',
    audio_transcript: 'I saw a rainbow after the rain.',
    tags: '過去式,past tense,文法,grammar'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，填入空格中的過去式動詞（英文）。\n句子："We _____ pizza for dinner last night."',
    answer: 'ate',
    explanation: '「ate」是 eat 的不規則過去式，表示昨晚吃的動作。',
    audio_transcript: 'We ate pizza for dinner last night.',
    tags: '過去式,past tense,文法,grammar,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，選出正確的過去式動詞。',
    option_a: 'buyed', option_b: 'buys', option_c: 'buying', option_d: 'bought',
    answer: 'D',
    explanation: '「bought」是 buy 的不規則過去式，不是 buyed。',
    audio_transcript: 'My mother bought me a new bicycle.',
    tags: '過去式,past tense,文法,grammar,不規則動詞,irregular verb'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽句子，寫出聽到的過去式動詞（英文）。\n（提示：「make」的過去式）',
    answer: 'made',
    explanation: '「made」是 make 的不規則過去式。made → m-a-d-e',
    audio_transcript: 'She made a cake for the party.',
    tags: '過去式,past tense,文法,grammar,spelling'
  },

  // ── 主題十三：錢幣數字 Money & Numbers ─────────────────────────────────
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的金額。',
    option_a: 'fifty dollars', option_b: 'fifteen dollars', option_c: 'five dollars', option_d: 'five hundred dollars',
    answer: 'B',
    explanation: '「fifteen」是 15，要注意和「fifty」(50) 的發音差異。',
    audio_transcript: 'This book costs fifteen dollars.',
    tags: '金錢,money,數字,number'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的金額表達。',
    option_a: 'eighty cents', option_b: 'eighteen cents', option_c: 'eight dollars', option_d: 'eighty dollars',
    answer: 'D',
    explanation: '「eighty dollars」是八十元，注意 eighty（80）和 eighteen（18）的差異。',
    audio_transcript: 'The toy costs eighty dollars.',
    tags: '金錢,money,數字,number'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的金額數字（英文）。\n句子："I have _____ dollars in my wallet."',
    answer: 'twenty',
    explanation: '「twenty」是二十，20 元是學生常見的零用錢金額。',
    audio_transcript: 'I have twenty dollars in my wallet.',
    tags: '金錢,money,數字,number,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽對話，選出正確的找零金額。\n"The apple costs thirty dollars. I give fifty dollars."',
    option_a: 'ten dollars', option_b: 'twenty dollars', option_c: 'thirty dollars', option_d: 'eighty dollars',
    answer: 'B',
    explanation: '50 - 30 = 20，找回 twenty dollars（二十元）。',
    audio_transcript: 'The apple costs thirty dollars. I give fifty dollars. My change is twenty dollars.',
    tags: '金錢,money,數學,math,計算,calculation'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的數字英文單字。\n（提示：一打有幾個？）',
    answer: 'twelve',
    explanation: '「twelve」是十二，一打（a dozen）= 12 個。twelve → t-w-e-l-v-e',
    audio_transcript: 'There are twelve eggs in one dozen.',
    tags: '數字,number,spelling'
  },

  // ── 主題十四：方向指示 Directions ───────────────────────────────────────
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽指示，選出正確的方向。',
    option_a: 'turn left', option_b: 'turn right', option_c: 'go straight', option_d: 'go back',
    answer: 'C',
    explanation: '「go straight」是直走，表示沿著同一條路繼續前進。',
    audio_transcript: 'Go straight and you will see the school.',
    tags: '方向,direction,指示,instruction'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽指示，選出正確的方向。',
    option_a: 'turn left', option_b: 'turn right', option_c: 'go straight', option_d: 'go back',
    answer: 'A',
    explanation: '「turn left」是左轉，在十字路口向左轉。',
    audio_transcript: 'Turn left at the traffic light.',
    tags: '方向,direction,指示,instruction'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的方位詞（英文）。\n句子："The bank is _____ the post office."',
    answer: 'next to',
    explanation: '「next to」是緊鄰旁邊的意思，描述相鄰位置關係。',
    audio_transcript: 'The bank is next to the post office.',
    tags: '方向,direction,位置,location,介系詞,preposition,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 3,
    content: '🎧 請聆聽指示，選出正確的目的地。\n"Go straight for two blocks, then turn right. The building is on your left."',
    option_a: 'library', option_b: 'hospital', option_c: 'park', option_d: 'school',
    answer: 'A',
    explanation: '依照指示走兩個街區右轉，左手邊即是圖書館。',
    audio_transcript: 'Go straight for two blocks, then turn right. The library is on your left.',
    tags: '方向,direction,指示,instruction,對話,dialogue'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的方向英文單字。\n（提示：「右轉」的「右」）',
    answer: 'right',
    explanation: '「right」是右邊，right → r-i-g-h-t（注意有不發音的 gh）',
    audio_transcript: 'Turn right at the corner.',
    tags: '方向,direction,spelling'
  },

  // ── 主題十五：健康疾病 Health ────────────────────────────────────────────
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的症狀。',
    option_a: 'headache', option_b: 'stomachache', option_c: 'toothache', option_d: 'backache',
    answer: 'A',
    explanation: '「headache」是頭痛，head（頭）+ ache（疼痛）。',
    audio_transcript: 'I have a headache. I need to rest.',
    tags: '健康,health,症狀,symptom'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的症狀。',
    option_a: 'fever', option_b: 'cold', option_c: 'cough', option_d: 'sore throat',
    answer: 'C',
    explanation: '「cough」是咳嗽，是感冒常見的症狀之一。',
    audio_transcript: 'She has a bad cough and cannot sleep well.',
    tags: '健康,health,症狀,symptom'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽對話，填入空格中的健康建議（英文）。\n醫生說："You should drink more _____ and rest."',
    answer: 'water',
    explanation: '「water」是水，生病時多喝水有助於復原。',
    audio_transcript: 'You should drink more water and rest.',
    tags: '健康,health,建議,advice,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的醫療用品。',
    option_a: 'bandage', option_b: 'thermometer', option_c: 'medicine', option_d: 'syringe',
    answer: 'B',
    explanation: '「thermometer」是溫度計，用來量體溫。',
    audio_transcript: 'The doctor uses a thermometer to check my temperature.',
    tags: '健康,health,醫療,medical'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的健康相關英文單字。\n（提示：體育課後要做的事，確保身體健康）',
    answer: 'exercise',
    explanation: '「exercise」是運動、鍛鍊。exercise → e-x-e-r-c-i-s-e',
    audio_transcript: 'Regular exercise keeps you healthy.',
    tags: '健康,health,運動,sport,spelling'
  },

  // ── 主題十六：自然環境 Nature ────────────────────────────────────────────
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的自然景觀。',
    option_a: 'mountain', option_b: 'river', option_c: 'ocean', option_d: 'desert',
    answer: 'C',
    explanation: '「ocean」是海洋，是地球上最大的水體。',
    audio_transcript: 'Many fish live in the ocean.',
    tags: '自然,nature,地理,geography'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的天氣描述。',
    option_a: 'cloudy', option_b: 'sunny', option_c: 'rainy', option_d: 'snowy',
    answer: 'B',
    explanation: '「sunny」是晴天，太陽明亮照耀的天氣。',
    audio_transcript: 'It is a sunny day. Let us go to the park.',
    tags: '天氣,weather,自然,nature'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的自然環境單字（英文）。\n句子："We need to protect the _____ to save animals."',
    answer: 'forest',
    explanation: '「forest」是森林，是許多動植物的棲息地。',
    audio_transcript: 'We need to protect the forest to save animals.',
    tags: '自然,nature,環境,environment,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的自然現象。',
    option_a: 'earthquake', option_b: 'typhoon', option_c: 'tornado', option_d: 'tsunami',
    answer: 'B',
    explanation: '「typhoon」是颱風，是台灣夏秋常見的天災。',
    audio_transcript: 'A typhoon is coming. Stay indoors.',
    tags: '天氣,weather,自然現象,natural disaster'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的自然景觀英文單字。\n（提示：天空中的白色或灰色漂浮物）',
    answer: 'clouds',
    explanation: '「cloud」是雲，複數是「clouds」。cloud → c-l-o-u-d-s',
    audio_transcript: 'Look at the white clouds in the sky.',
    tags: '自然,nature,天氣,weather,spelling'
  },

  // ── 主題十七：節日慶典 Holidays ─────────────────────────────────────────
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的節日。',
    option_a: "Valentine's Day", option_b: 'Halloween', option_c: 'Christmas', option_d: 'Easter',
    answer: 'C',
    explanation: '「Christmas」是聖誕節，在 12 月 25 日慶祝，有聖誕老人和禮物。',
    audio_transcript: 'We exchange gifts on Christmas Day.',
    tags: '節日,holiday,慶典,celebration'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的節日。',
    option_a: "New Year's Day", option_b: "Mother's Day", option_c: "Father's Day", option_d: "Children's Day",
    answer: 'B',
    explanation: '「Mother\'s Day」是母親節，在五月第二個星期日慶祝。',
    audio_transcript: 'We give flowers to our mothers on Mother\'s Day.',
    tags: '節日,holiday,家庭,family'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的節日名稱（英文）。\n句子："People dress in costumes on _____."',
    answer: 'Halloween',
    explanation: '「Halloween」是萬聖節，在 10 月 31 日，人們穿鬼怪服裝慶祝。',
    audio_transcript: 'People dress in costumes on Halloween.',
    tags: '節日,holiday,慶典,celebration,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的節日活動。',
    option_a: 'light firecrackers', option_b: 'hunt for Easter eggs', option_c: 'trick or treat', option_d: 'watch fireworks',
    answer: 'B',
    explanation: '「hunt for Easter eggs」是復活節找彩蛋的傳統活動。',
    audio_transcript: 'Children hunt for Easter eggs in the garden.',
    tags: '節日,holiday,活動,activity'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的節日英文單字。\n（提示：新年的英文）',
    answer: 'New Year',
    explanation: '「New Year」是新年，1 月 1 日是 New Year\'s Day（元旦）。New Year → N-e-w Y-e-a-r',
    audio_transcript: "Happy New Year! Let's celebrate together.",
    tags: '節日,holiday,spelling'
  },

  // ── 主題十八：動物棲地 Animals & Habitats ───────────────────────────────
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的動物。',
    option_a: 'lion', option_b: 'tiger', option_c: 'leopard', option_d: 'cheetah',
    answer: 'A',
    explanation: '「lion」是獅子，被稱為「草原之王」，生活在非洲。',
    audio_transcript: 'A lion lives on the African savanna.',
    tags: '動物,animal,棲地,habitat'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的動物。',
    option_a: 'whale', option_b: 'shark', option_c: 'dolphin', option_d: 'octopus',
    answer: 'C',
    explanation: '「dolphin」是海豚，是聰明的海洋哺乳動物，喜歡跳躍。',
    audio_transcript: 'Dolphins jump out of the water and play.',
    tags: '動物,animal,海洋,ocean'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的動物單字（英文）。\n句子："A _____ uses its long neck to eat leaves from tall trees."',
    answer: 'giraffe',
    explanation: '「giraffe」是長頸鹿，用長脖子吃高樹上的葉子。',
    audio_transcript: 'A giraffe uses its long neck to eat leaves from tall trees.',
    tags: '動物,animal,棲地,habitat,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的動物棲地。',
    option_a: 'A penguin lives in the desert.', option_b: 'A penguin lives in the rainforest.',
    option_c: 'A penguin lives in the Arctic.', option_d: 'A penguin lives in the jungle.',
    answer: 'C',
    explanation: '「Arctic」是北極圈，企鵝生活在南極（Antarctica），但也常與 Arctic 一起被提及為極地。',
    audio_transcript: 'A penguin lives in the cold Arctic region.',
    tags: '動物,animal,棲地,habitat,地理,geography'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的動物英文單字。\n（提示：這種動物有條紋，是貓科動物）',
    answer: 'tiger',
    explanation: '「tiger」是老虎，有黑色條紋的大型貓科動物。tiger → t-i-g-e-r',
    audio_transcript: 'A tiger has black and orange stripes.',
    tags: '動物,animal,spelling'
  },

  // ── 主題十九：形容詞描述 Adjectives ─────────────────────────────────────
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的形容詞。',
    option_a: 'delicious', option_b: 'terrible', option_c: 'spicy', option_d: 'sweet',
    answer: 'A',
    explanation: '「delicious」是美味的，形容食物非常好吃。',
    audio_transcript: 'This cake is delicious! I want more.',
    tags: '形容詞,adjective,食物,food'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的形容詞。',
    option_a: 'noisy', option_b: 'quiet', option_c: 'boring', option_d: 'exciting',
    answer: 'D',
    explanation: '「exciting」是令人興奮的，形容非常刺激或精彩。',
    audio_transcript: 'The soccer game was very exciting.',
    tags: '形容詞,adjective,運動,sport'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的形容詞（英文）。\n句子："The weather today is very _____ and warm."',
    answer: 'sunny',
    explanation: '「sunny」是晴朗的，天氣晴朗溫暖很適合戶外活動。',
    audio_transcript: 'The weather today is very sunny and warm.',
    tags: '形容詞,adjective,天氣,weather,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的反義詞對。',
    option_a: 'happy / sad', option_b: 'big / large', option_c: 'fast / quick', option_d: 'cold / chilly',
    answer: 'A',
    explanation: '「happy」（快樂）和「sad」（悲傷）是反義詞，意思相反。',
    audio_transcript: 'She was happy yesterday but sad today.',
    tags: '形容詞,adjective,反義詞,antonym'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的形容詞英文單字。\n（提示：形容聲音非常大的）',
    answer: 'loud',
    explanation: '「loud」是大聲的，形容聲音很大。loud → l-o-u-d',
    audio_transcript: 'The music is too loud. Please turn it down.',
    tags: '形容詞,adjective,spelling'
  },

  // ── 主題二十：顏色形狀 Colors & Shapes ──────────────────────────────────
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的形狀。',
    option_a: 'circle', option_b: 'square', option_c: 'triangle', option_d: 'rectangle',
    answer: 'C',
    explanation: '「triangle」是三角形，有三個邊和三個角。',
    audio_transcript: 'A triangle has three sides.',
    tags: '形狀,shape,幾何,geometry'
  },
  {
    type: 'listening', difficulty: 1,
    content: '🎧 請聆聽句子，選出正確的顏色描述。',
    option_a: 'The sky is green.', option_b: 'The sky is yellow.', option_c: 'The sky is blue.', option_d: 'The sky is purple.',
    answer: 'C',
    explanation: '「blue」是藍色，天空晴天時是藍色的。',
    audio_transcript: 'The sky is blue on a clear day.',
    tags: '顏色,color,自然,nature'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，填入空格中的顏色單字（英文）。\n句子："Mix red and yellow to get _____."',
    answer: 'orange',
    explanation: '「orange」是橘色，由紅色（red）和黃色（yellow）混合而成。',
    audio_transcript: 'Mix red and yellow to get orange.',
    tags: '顏色,color,藝術,art,fill-in-blank'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的形狀描述。',
    option_a: 'A circle has four corners.', option_b: 'A circle has no corners.',
    option_c: 'A circle has three sides.', option_d: 'A circle has six sides.',
    answer: 'B',
    explanation: '「circle」是圓形，沒有角和邊，是一條連續的曲線。',
    audio_transcript: 'A circle has no corners and no straight sides.',
    tags: '形狀,shape,幾何,geometry'
  },
  {
    type: 'listening', difficulty: 2,
    content: '🎧 請聆聽句子，寫出聽到的顏色英文單字。\n（提示：天空在日落時呈現的橘紅色）',
    answer: 'pink',
    explanation: '「pink」是粉紅色，日落時天空有時呈現粉紅色調。pink → p-i-n-k',
    audio_transcript: 'The sky turns pink at sunset.',
    tags: '顏色,color,自然,nature,spelling'
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
      subjectId,
      q.type,
      q.difficulty,
      q.content,
      q.option_a || null,
      q.option_b || null,
      q.option_c || null,
      q.option_d || null,
      q.answer,
      q.explanation || null,
      '英語聽力種子題目（第二批）',
      q.tags || null,
      null,
      q.audio_transcript || null
    );
    count++;
  }
  return count;
});

const inserted = insertAll();
console.log(`✅ 成功植入 ${inserted} 題國小六年級英文聽力測驗題`);
console.log(`   - 選擇題：${questions.filter(q => q.option_a).length} 題`);
console.log(`   - 填空題：${questions.filter(q => !q.option_a && q.content.includes('___')).length} 題`);
console.log(`   - 拼字題：${questions.filter(q => !q.option_a && !q.content.includes('___')).length} 題`);
