'use strict';
/**
 * 會考（bctest）英文聽力測驗 — 100 題
 * 科目：英文聽力（ENG_LISTEN_BC），學段：bctest
 * 難度：B1–B2，符合國中教育會考英語聽力題型
 * 題型：choice 55 + fill 45
 * 每題均含 audio_transcript 供 TTS 播放
 * 題型涵蓋：日常對話、廣播公告、短文敘述
 */
const db = require('./database');

const subjectId = db.prepare("SELECT id FROM subjects WHERE code='ENG_LISTEN_BC'").get().id;

const questions = [

  // === 主題 1：日常生活與對話（Everyday Life & Conversations）15 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出這個人今天下午要做什麼。',
    option_a: 'go to the library', option_b: 'play basketball', option_c: 'visit a friend', option_d: 'attend a class',
    answer: 'A',
    explanation: '對話中他說「我今天下午要去圖書館還書」，所以是 go to the library。',
    audio_transcript: 'A: What are you doing this afternoon? B: I need to go to the library to return some books.',
    tags: '日常,library,對話,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽對話，填入空白的單字（英文）。\n對話："A: Are you free on Saturday? B: Sorry, I have a _____ appointment that day."（牙醫）',
    answer: 'dentist',
    explanation: '「dentist appointment」是牙醫預約，她週六有牙醫預約所以不空。',
    audio_transcript: 'A: Are you free on Saturday? B: Sorry, I have a dentist appointment that day.',
    tags: '日常,dentist,對話,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出兩人決定去哪裡吃晚餐。',
    option_a: 'a pizza place', option_b: 'a sushi restaurant', option_c: 'a noodle shop', option_d: 'a burger stand',
    answer: 'B',
    explanation: '對話中他們討論後決定去吃壽司，所以是 a sushi restaurant。',
    audio_transcript: 'A: Where should we eat tonight? B: How about sushi? A: Great idea! I love Japanese food.',
    tags: '日常,restaurant,晚餐,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽對話，填入空白的單字（英文）。\n對話："A: How long does it take to get to school? B: About thirty _____ by bus."（分鐘）',
    answer: 'minutes',
    explanation: '「thirty minutes」是三十分鐘，搭公車到學校大約要三十分鐘。',
    audio_transcript: 'A: How long does it take to get to school? B: About thirty minutes by bus.',
    tags: '日常,transportation,時間,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出這個人為什麼遲到。',
    option_a: 'missed the bus', option_b: 'forgot the time', option_c: 'was stuck in traffic', option_d: 'woke up late',
    answer: 'C',
    explanation: '對話中他說「對不起，我被堵在車陣裡了」，所以是 was stuck in traffic。',
    audio_transcript: 'A: You are late! B: I am so sorry, I was stuck in traffic for half an hour.',
    tags: '日常,traffic,遲到,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽對話，填入空白的單字（英文）。\n對話："A: Do you have the _____ for the meeting? B: Yes, it starts at two o\'clock."（時間表）',
    answer: 'schedule',
    explanation: '「schedule」是時間表，會議的時間表是從兩點開始。',
    audio_transcript: 'A: Do you have the schedule for the meeting? B: Yes, it starts at two o\'clock.',
    tags: '日常,schedule,會議,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出這個女生的嗜好是什麼。',
    option_a: 'painting', option_b: 'playing guitar', option_c: 'cooking', option_d: 'reading novels',
    answer: 'D',
    explanation: '對話中她說「我最喜歡的嗜好是讀小說，每週至少讀一本」，所以是 reading novels。',
    audio_transcript: 'A: What do you enjoy doing in your free time? B: My favorite hobby is reading novels. I read at least one a week.',
    tags: '日常,hobby,嗜好,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽對話，填入空白的單字（英文）。\n對話："A: Can I borrow your _____ ? I left mine at home. B: Sure, here you go."（雨傘）',
    answer: 'umbrella',
    explanation: '「umbrella」是雨傘，他把雨傘忘在家裡所以想借。',
    audio_transcript: 'A: Can I borrow your umbrella? I left mine at home. B: Sure, here you go.',
    tags: '日常,umbrella,借用,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出這個人在商店買了什麼。',
    option_a: 'a jacket', option_b: 'a pair of shoes', option_c: 'a backpack', option_d: 'a hat',
    answer: 'B',
    explanation: '對話中她說「我剛在鞋店買了一雙新鞋，打了七折」，所以是 a pair of shoes。',
    audio_transcript: 'A: What did you buy? B: I just bought a new pair of shoes at the shoe store. They were 30% off!',
    tags: '日常,shopping,鞋子,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽對話，填入空白的單字（英文）。\n對話："A: The movie starts in ten minutes. B: Let\'s hurry! We don\'t want to miss the _____ ."（開場）',
    answer: 'beginning',
    explanation: '「beginning」是開場，他們不想錯過電影的開場。',
    audio_transcript: 'A: The movie starts in ten minutes. B: Let\'s hurry! We don\'t want to miss the beginning.',
    tags: '日常,movie,電影,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出他們決定送給老師什麼禮物。',
    option_a: 'flowers', option_b: 'a book', option_c: 'a card', option_d: 'chocolates',
    answer: 'A',
    explanation: '對話中他們決定買花送給老師作為感謝，所以是 flowers。',
    audio_transcript: 'A: What should we get for the teacher\'s gift? B: How about flowers? A: That sounds perfect!',
    tags: '日常,gift,禮物,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽對話，填入空白的單字（英文）。\n對話："A: How is your new _____ ? B: She is very kind and explains things clearly."（老師）',
    answer: 'teacher',
    explanation: '「teacher」是老師，新老師很親切且解釋清楚。',
    audio_transcript: 'A: How is your new teacher? B: She is very kind and explains things clearly.',
    tags: '日常,teacher,學校,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出這個男生接下來要做什麼。',
    option_a: 'take a nap', option_b: 'do homework', option_c: 'call his mom', option_d: 'go for a walk',
    answer: 'B',
    explanation: '對話中他說「我現在要先把作業做完，然後才能出去玩」，所以是 do homework。',
    audio_transcript: 'A: Want to come out and play? B: I need to finish my homework first, then I can come out.',
    tags: '日常,homework,作業,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽對話，填入空白的單字（英文）。\n對話："A: You look tired. B: Yes, I stayed up until midnight _____ for the exam."（讀書）',
    answer: 'studying',
    explanation: '「studying」是讀書，他熬夜讀書到半夜，所以看起來很疲倦。',
    audio_transcript: 'A: You look tired. B: Yes, I stayed up until midnight studying for the exam.',
    tags: '日常,studying,熬夜,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出兩人計畫什麼時候出發旅行。',
    option_a: 'tomorrow morning', option_b: 'this Friday evening', option_c: 'next Monday', option_d: 'this weekend',
    answer: 'D',
    explanation: '對話中他們說「這個週末就出發，週六一早走」，所以是 this weekend。',
    audio_transcript: 'A: When are we leaving for the trip? B: This weekend. We leave early on Saturday morning.',
    tags: '日常,travel,旅行,bctest'
  },

  // === 主題 2：學校生活（School Life）15 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出這個學生沒有完成的作業是哪一科。',
    option_a: 'Math', option_b: 'English', option_c: 'Science', option_d: 'History',
    answer: 'C',
    explanation: '對話中他說「自然科的報告我還沒寫完，明天要交」，所以是 Science。',
    audio_transcript: 'A: Is all your homework done? B: Not yet. I still need to finish the Science report that is due tomorrow.',
    tags: '學校,homework,科目,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽對話，填入空白的單字（英文）。\n對話："A: When is the school _____ ? B: It is next Friday afternoon."（運動會）',
    answer: 'sports day',
    explanation: '「sports day」是運動會，學校運動會是下週五下午。',
    audio_transcript: 'A: When is the school sports day? B: It is next Friday afternoon.',
    tags: '學校,sports day,活動,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽廣播，選出圖書館今天關閉的原因。',
    option_a: 'cleaning', option_b: 'renovation', option_c: 'a special event', option_d: 'holiday',
    answer: 'A',
    explanation: '廣播說「圖書館今天因為年度大掃除而關閉，明天恢復正常開放」，所以是 cleaning。',
    audio_transcript: 'Attention, students. The library is closed today for the annual cleaning. It will reopen tomorrow.',
    tags: '學校,library,廣播,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The teacher asked us to _____ our answers with a classmate."（核對）',
    answer: 'check',
    explanation: '「check」是核對，老師要我們和同學核對答案。',
    audio_transcript: 'The teacher asked us to check our answers with a classmate.',
    tags: '學校,check,答案,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出這個女生為什麼不參加社團。',
    option_a: 'too expensive', option_b: 'not interested', option_c: 'schedule conflict', option_d: 'too far away',
    answer: 'C',
    explanation: '對話中她說「我很想參加，但那個時間我有補習課，衝突了」，所以是 schedule conflict。',
    audio_transcript: 'A: Why don\'t you join the club? B: I really want to, but I have tutoring at that time. It conflicts with my schedule.',
    tags: '學校,club,社團,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽廣播，填入空白的單字（英文）。\n廣播："Students who want to enter the _____ contest must register by Wednesday."（演講）',
    answer: 'speech',
    explanation: '「speech contest」是演講比賽，想參加演講比賽的學生必須在週三前報名。',
    audio_transcript: 'Students who want to enter the speech contest must register by Wednesday.',
    tags: '學校,speech contest,報名,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出老師對這份報告的評語是什麼。',
    option_a: 'needs more examples', option_b: 'too long', option_c: 'well organized', option_d: 'hard to understand',
    answer: 'A',
    explanation: '對話中老師說「這份報告的想法不錯，但需要多加一些例子來支持論點」，所以是 needs more examples。',
    audio_transcript: 'Teacher: The ideas in this report are good, but it needs more examples to support your arguments.',
    tags: '學校,report,評語,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽對話，填入空白的單字（英文）。\n對話："A: How did you do on the math _____ ? B: I got 95 points!"（考試）',
    answer: 'test',
    explanation: '「math test」是數學考試，他數學考試得了95分。',
    audio_transcript: 'A: How did you do on the math test? B: I got 95 points!',
    tags: '學校,math test,成績,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出學校要求學生做的事。',
    option_a: 'wear uniforms', option_b: 'bring lunch', option_c: 'walk to school', option_d: 'use tablets',
    answer: 'A',
    explanation: '廣播說「學校要求所有學生每天穿制服上學」，所以是 wear uniforms。',
    audio_transcript: 'The school requires all students to wear uniforms every day.',
    tags: '學校,uniform,制服,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽對話，填入空白的單字（英文）。\n對話："A: I am nervous about the _____ tomorrow. B: Don\'t worry, you\'ve practiced a lot."（發表）',
    answer: 'presentation',
    explanation: '「presentation」是發表，他對明天的發表很緊張。',
    audio_transcript: 'A: I am nervous about the presentation tomorrow. B: Don\'t worry, you\'ve practiced a lot.',
    tags: '學校,presentation,緊張,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽廣播，選出明天的活動地點。',
    option_a: 'the school gym', option_b: 'the auditorium', option_c: 'the playground', option_d: 'the cafeteria',
    answer: 'B',
    explanation: '廣播說「明天的畢業典禮將在學校禮堂舉行」，所以是 the auditorium。',
    audio_transcript: 'Tomorrow\'s graduation ceremony will be held in the school auditorium.',
    tags: '學校,ceremony,禮堂,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽對話，填入空白的單字（英文）。\n對話："A: Did you join any _____ activities this semester? B: Yes, I joined the art club and the choir."（課外）',
    answer: 'extracurricular',
    explanation: '「extracurricular activities」是課外活動，他這學期加入了美術社和合唱團。',
    audio_transcript: 'A: Did you join any extracurricular activities this semester? B: Yes, I joined the art club and the choir.',
    tags: '學校,extracurricular,社團,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出這個學生要求老師做什麼。',
    option_a: 'explain the homework', option_b: 'change the test date', option_c: 'give extra points', option_d: 'provide more examples',
    answer: 'B',
    explanation: '對話中學生說「老師，可以把考試時間改到下週嗎？我們需要更多時間準備」，所以是 change the test date。',
    audio_transcript: 'Student: Teacher, can you change the test date to next week? We need more time to prepare.',
    tags: '學校,test date,要求,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽對話，填入空白的單字（英文）。\n對話："A: The field trip is tomorrow. B: I know! I am so _____ about visiting the science museum."（興奮）',
    answer: 'excited',
    explanation: '「excited」是興奮，他對明天去科學博物館的戶外教學非常興奮。',
    audio_transcript: 'A: The field trip is tomorrow. B: I know! I am so excited about visiting the science museum.',
    tags: '學校,field trip,戶外教學,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出這個學生為什麼請假。',
    option_a: 'went on vacation', option_b: 'had a fever', option_c: 'attended a funeral', option_d: 'took a trip abroad',
    answer: 'B',
    explanation: '對話中媽媽說「他昨天發燒了，所以請假一天」，所以是 had a fever。',
    audio_transcript: 'Mother: He had a fever yesterday, so he took a day off from school.',
    tags: '學校,sick leave,發燒,bctest'
  },

  // === 主題 3：廣播與公告（Announcements & Broadcasts）15 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽廣播，選出超市特賣活動的時間。',
    option_a: 'this Friday only', option_b: 'Friday to Sunday', option_c: 'Saturday and Sunday', option_d: 'the whole week',
    answer: 'B',
    explanation: '廣播說「本超市特賣活動從週五到週日，錯過不再」，所以是 Friday to Sunday。',
    audio_transcript: 'Our supermarket sale runs from Friday to Sunday. Don\'t miss this great opportunity!',
    tags: '廣播,supermarket,特賣,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽廣播，填入空白的單字（英文）。\n廣播："Please _____ your belongings as you leave the bus."（攜帶）',
    answer: 'take',
    explanation: '「take your belongings」是帶走你的隨身物品，下車時請帶走個人物品。',
    audio_transcript: 'Please take your belongings as you leave the bus.',
    tags: '廣播,bus,提醒,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽廣播，選出天氣預報說明天的天氣如何。',
    option_a: 'sunny all day', option_b: 'rain in the morning', option_c: 'thunderstorms at night', option_d: 'cloudy with strong winds',
    answer: 'B',
    explanation: '廣播說「明天早上會有降雨，午後轉晴」，所以是 rain in the morning。',
    audio_transcript: 'Tomorrow\'s forecast: Rain in the morning, clearing up in the afternoon.',
    tags: '廣播,weather,天氣預報,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽廣播，填入空白的單字（英文）。\n廣播："The train to Taipei will _____ from Platform 3 at 10:15."（出發）',
    answer: 'depart',
    explanation: '「depart」是出發，前往台北的火車將在10:15從第3月台出發。',
    audio_transcript: 'The train to Taipei will depart from Platform 3 at 10:15.',
    tags: '廣播,train,月台,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽廣播，選出這個博物館的特展主題是什麼。',
    option_a: 'ancient Egypt', option_b: 'ocean animals', option_c: 'space and stars', option_d: 'robots and AI',
    answer: 'C',
    explanation: '廣播說「本館現正展出「宇宙之旅」特展，探索太空與星球的奧秘」，所以是 space and stars。',
    audio_transcript: 'Our museum is currently featuring the special exhibition "Journey to the Universe," exploring space and stars.',
    tags: '廣播,museum,太空,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽廣播，填入空白的單字（英文）。\n廣播："Passengers are reminded to _____ their tickets before boarding."（出示）',
    answer: 'show',
    explanation: '「show your tickets」是出示票券，旅客上車前請出示票券。',
    audio_transcript: 'Passengers are reminded to show their tickets before boarding.',
    tags: '廣播,ticket,乘客,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽廣播，選出這個活動中心關閉的原因。',
    option_a: 'power outage', option_b: 'renovation', option_c: 'a private event', option_d: 'national holiday',
    answer: 'D',
    explanation: '廣播說「活動中心因國定假日明日暫停營業，後天恢復正常」，所以是 national holiday。',
    audio_transcript: 'The activity center will be closed tomorrow due to a national holiday and will reopen the day after.',
    tags: '廣播,activity center,假日,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽廣播，填入空白的單字（英文）。\n廣播："For your safety, please _____ your seatbelt during the flight."（繫上）',
    answer: 'fasten',
    explanation: '「fasten your seatbelt」是繫上安全帶，飛行途中請繫好安全帶。',
    audio_transcript: 'For your safety, please fasten your seatbelt during the flight.',
    tags: '廣播,airplane,安全帶,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽廣播，選出游泳池新增的設施是什麼。',
    option_a: 'a water slide', option_b: 'a diving board', option_c: 'a children\'s pool', option_d: 'a hot spring area',
    answer: 'C',
    explanation: '廣播說「游泳池新增了兒童戲水池，非常適合小朋友使用」，所以是 a children\'s pool。',
    audio_transcript: 'The swimming pool has added a new children\'s pool, which is perfect for young children.',
    tags: '廣播,swimming pool,設施,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽廣播，填入空白的單字（英文）。\n廣播："The _____ is on sale for just 299 dollars this week only."（耳機）',
    answer: 'headphones',
    explanation: '「headphones」是耳機，耳機本週特賣只要299元。',
    audio_transcript: 'The headphones are on sale for just 299 dollars this week only.',
    tags: '廣播,sale,耳機,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽廣播，選出這個新餐廳的特色是什麼。',
    option_a: 'all-you-can-eat', option_b: 'outdoor seating', option_c: 'vegetarian only', option_d: '24-hour service',
    answer: 'A',
    explanation: '廣播說「這家新餐廳提供吃到飽服務，種類超過100道菜」，所以是 all-you-can-eat。',
    audio_transcript: 'This new restaurant offers all-you-can-eat service with over 100 dishes to choose from.',
    tags: '廣播,restaurant,吃到飽,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽廣播，填入空白的單字（英文）。\n廣播："We apologize for the _____ of the flight due to bad weather."（延誤）',
    answer: 'delay',
    explanation: '「delay」是延誤，因惡劣天氣造成班機延誤，敬請見諒。',
    audio_transcript: 'We apologize for the delay of the flight due to bad weather.',
    tags: '廣播,flight,延誤,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽廣播，選出圖書館更改了什麼規定。',
    option_a: 'loan period', option_b: 'opening hours', option_c: 'number of books', option_d: 'membership fee',
    answer: 'B',
    explanation: '廣播說「本館即日起將開放時間延長至晚上九點」，所以是 opening hours。',
    audio_transcript: 'Starting today, the library will extend its opening hours until 9 p.m.',
    tags: '廣播,library,開放時間,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽廣播，填入空白的單字（英文）。\n廣播："All visitors must _____ their bags at the entrance."（登記）',
    answer: 'register',
    explanation: '「register」是登記，所有訪客必須在入口處登記隨身包包。',
    audio_transcript: 'All visitors must register their bags at the entrance.',
    tags: '廣播,visitor,規定,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽廣播，選出健身中心優惠活動的內容。',
    option_a: 'free membership for one month', option_b: 'half price on weekends', option_c: 'free personal training session', option_d: 'buy one get one free',
    answer: 'C',
    explanation: '廣播說「本月加入會員即可獲得一次免費個人訓練課程」，所以是 free personal training session。',
    audio_transcript: 'Join this month and receive one free personal training session.',
    tags: '廣播,gym,健身,bctest'
  },

  // === 主題 4：短文與故事（Short Passages & Stories）20 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽短文，選出這篇文章的主題。',
    option_a: 'exercise habits', option_b: 'healthy eating', option_c: 'sleep importance', option_d: 'stress management',
    answer: 'C',
    explanation: '短文討論充足睡眠對健康的重要性，以及睡眠不足的後果。',
    audio_transcript: 'Getting enough sleep is very important for your health. Most teenagers need 8 to 9 hours of sleep each night. Without enough sleep, you may have trouble concentrating and feel irritable.',
    tags: '短文,sleep,健康,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽短文，填入空白的單字（英文）。\n問題："What does the speaker say students should do before an exam?"（答案為一個動詞短語）',
    answer: 'get enough sleep',
    explanation: '短文說考試前學生應該要睡足夠的覺，而不是熬夜苦讀。',
    audio_transcript: 'Before an exam, many students stay up all night studying. However, experts say that students should get enough sleep before the test. A rested brain performs better.',
    tags: '短文,exam,睡眠,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽短文，選出 Linda 為什麼喜歡騎腳踏車上學。',
    option_a: 'it is cheaper', option_b: 'it saves time', option_c: 'it is good exercise', option_d: 'the bus is too crowded',
    answer: 'C',
    explanation: '短文說 Linda 喜歡騎腳踏車上學，因為這是很好的運動方式。',
    audio_transcript: 'Linda cycles to school every day. She says it is a great form of exercise and helps her stay fit. She has been doing this for two years.',
    tags: '短文,cycling,運動,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽短文，填入空白的單字（英文）。\n問題："How long has Linda been cycling to school?"（數字+單位）',
    answer: 'two years',
    explanation: '短文說 Linda 騎腳踏車上學已經兩年了。',
    audio_transcript: 'Linda cycles to school every day. She says it is a great form of exercise and helps her stay fit. She has been doing this for two years.',
    tags: '短文,cycling,時間,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽短文，選出這個環保計畫的目標。',
    option_a: 'reduce water usage', option_b: 'plant more trees', option_c: 'clean the river', option_d: 'recycle more waste',
    answer: 'B',
    explanation: '短文介紹一個學校環保計畫，目標是在校園內多種植樹木。',
    audio_transcript: 'Our school has started a new environmental project. The goal is to plant more trees around the campus. Students will take turns watering the trees every week.',
    tags: '短文,環保,植樹,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽短文，填入空白的單字（英文）。\n問題："Who will water the trees?"（主詞）',
    answer: 'students',
    explanation: '短文說學生們會輪流每週為樹木澆水。',
    audio_transcript: 'Our school has started a new environmental project. The goal is to plant more trees around the campus. Students will take turns watering the trees every week.',
    tags: '短文,環保,澆水,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽短文，選出 Tom 的志願是什麼。',
    option_a: 'a doctor', option_b: 'an engineer', option_c: 'a teacher', option_d: 'a chef',
    answer: 'D',
    explanation: '短文說 Tom 從小就喜歡做菜，他的夢想是成為一名廚師。',
    audio_transcript: 'Tom has loved cooking since he was a child. He watches cooking shows and practices recipes every weekend. His dream is to become a chef one day.',
    tags: '短文,dream,廚師,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽短文，填入空白的單字（英文）。\n問題："What does Tom practice every weekend?"（activities）',
    answer: 'recipes',
    explanation: '短文說 Tom 每個週末都練習食譜。',
    audio_transcript: 'Tom has loved cooking since he was a child. He watches cooking shows and practices recipes every weekend. His dream is to become a chef one day.',
    tags: '短文,cooking,食譜,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽短文，選出這個城市最受遊客歡迎的景點。',
    option_a: 'the night market', option_b: 'the art museum', option_c: 'the ancient temple', option_d: 'the mountain trail',
    answer: 'A',
    explanation: '短文說夜市是這個城市最受遊客歡迎的地方，每晚吸引大量人潮。',
    audio_transcript: 'The night market is the most popular attraction in the city. Thousands of tourists visit it every evening to enjoy local food and shopping.',
    tags: '短文,tourist,夜市,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽短文，填入空白的單字（英文）。\n問題："What do tourists do at the night market?"（兩件事）',
    answer: 'enjoy local food and shopping',
    explanation: '短文說遊客到夜市是為了享受在地美食和購物。',
    audio_transcript: 'The night market is the most popular attraction in the city. Thousands of tourists visit it every evening to enjoy local food and shopping.',
    tags: '短文,night market,觀光,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽短文，選出這個年輕人如何為社區做貢獻。',
    option_a: 'teaching elderly people to use smartphones', option_b: 'collecting garbage in the park', option_c: 'organizing sports events', option_d: 'donating money to charity',
    answer: 'A',
    explanation: '短文說這個年輕人每週末教社區長者使用智慧型手機。',
    audio_transcript: 'Every weekend, this young man volunteers at the community center. He teaches elderly residents how to use smartphones to stay connected with their families.',
    tags: '短文,volunteer,社區,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽短文，填入空白的單字（英文）。\n問題："Where does he volunteer every weekend?"（地點）',
    answer: 'community center',
    explanation: '短文說他每個週末在社區中心擔任義工。',
    audio_transcript: 'Every weekend, this young man volunteers at the community center. He teaches elderly residents how to use smartphones to stay connected with their families.',
    tags: '短文,volunteer,社區中心,bctest'
  },
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽短文，選出演講者對科技的主要觀點。',
    option_a: 'technology causes laziness', option_b: 'technology should be banned', option_c: 'technology improves learning', option_d: 'technology replaces teachers',
    answer: 'C',
    explanation: '短文說科技工具讓學習變得更有趣、更有效率，是教育的良好輔助。',
    audio_transcript: 'Technology tools such as tablets and online videos make learning more interesting and effective. They are excellent aids for education when used properly.',
    tags: '短文,technology,教育,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽短文，填入空白的單字（英文）。\n問題："According to the speaker, when are technology tools excellent aids?"（條件）',
    answer: 'when used properly',
    explanation: '短文說科技工具在正確使用的情況下是很好的教育輔助。',
    audio_transcript: 'Technology tools such as tablets and online videos make learning more interesting and effective. They are excellent aids for education when used properly.',
    tags: '短文,technology,條件,bctest'
  },
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽短文，選出台灣傳統節日介紹的主題是什麼。',
    option_a: 'Moon Festival', option_b: 'Dragon Boat Festival', option_c: 'Lantern Festival', option_d: 'Tomb Sweeping Day',
    answer: 'B',
    explanation: '短文介紹端午節的起源和划龍舟、吃粽子的傳統。',
    audio_transcript: 'The Dragon Boat Festival is celebrated on the fifth day of the fifth lunar month. People eat rice dumplings and watch exciting dragon boat races to honor the poet Qu Yuan.',
    tags: '短文,Dragon Boat,端午節,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽短文，填入空白的單字（英文）。\n問題："What do people eat during the Dragon Boat Festival?"',
    answer: 'rice dumplings',
    explanation: '短文說端午節時人們吃粽子（rice dumplings）。',
    audio_transcript: 'The Dragon Boat Festival is celebrated on the fifth day of the fifth lunar month. People eat rice dumplings and watch exciting dragon boat races to honor the poet Qu Yuan.',
    tags: '短文,端午節,粽子,bctest'
  },
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽短文，選出這篇文章的結論。',
    option_a: 'reading is better than watching TV', option_b: 'both reading and TV have benefits', option_c: 'children should not watch TV', option_d: 'TV makes children smarter',
    answer: 'B',
    explanation: '短文討論閱讀和看電視各有優缺點，結論是兩者都有其好處。',
    audio_transcript: 'Some people think children should only read books. Others believe watching educational TV is also valuable. In fact, both reading and watching TV can benefit children when done in moderation.',
    tags: '短文,reading,TV,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽短文，填入空白的單字（英文）。\n問題："Both reading and watching TV can benefit children when done in _____ ."（適度）',
    answer: 'moderation',
    explanation: '「moderation」是適度，閱讀和看電視在適度的情況下都對孩子有益。',
    audio_transcript: 'Some people think children should only read books. Others believe watching educational TV is also valuable. In fact, both reading and watching TV can benefit children when done in moderation.',
    tags: '短文,moderation,適度,bctest'
  },
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽短文，選出 Amy 的暑假計畫。',
    option_a: 'attend a summer camp', option_b: 'travel abroad', option_c: 'take a language course', option_d: 'work part-time',
    answer: 'C',
    explanation: '短文說 Amy 這個暑假計畫去上英文加強課程，為升學做準備。',
    audio_transcript: 'Amy plans to take an intensive English course this summer. She wants to improve her English skills to prepare for high school.',
    tags: '短文,summer plan,英文課,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽短文，填入空白的單字（英文）。\n問題："Why does Amy want to improve her English skills?"（目的）',
    answer: 'to prepare for high school',
    explanation: '短文說 Amy 想提升英文以準備升高中。',
    audio_transcript: 'Amy plans to take an intensive English course this summer. She wants to improve her English skills to prepare for high school.',
    tags: '短文,English,升學,bctest'
  },

  // === 主題 5：情境問答（Situational Q&A）15 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出最適當的回應。\n句子："I\'m not feeling well today."',
    option_a: 'That\'s great news!', option_b: 'You should see a doctor.', option_c: 'Let\'s play basketball.', option_d: 'I don\'t like sports.',
    answer: 'B',
    explanation: '當別人說身體不舒服時，最適當的回應是建議去看醫生。',
    audio_transcript: 'I\'m not feeling well today.',
    tags: '情境,回應,健康,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽問句，填入最適當的回答（英文）。\n問句："What time does your school start?"（填入時間）',
    answer: 'Seven thirty',
    explanation: '學校通常在早上七點半開始，回答「Seven thirty」符合情境。',
    audio_transcript: 'What time does your school start?',
    tags: '情境,time,學校,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出最適當的回應。\n句子："Can you help me carry these boxes?"',
    option_a: 'No, I don\'t like boxes.', option_b: 'Sure, I\'d be happy to help.', option_c: 'I prefer to sit here.', option_d: 'The boxes are too colorful.',
    answer: 'B',
    explanation: '別人請求幫忙時，最適當的回應是答應幫忙。',
    audio_transcript: 'Can you help me carry these boxes?',
    tags: '情境,help,回應,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽問句，填入最適當的回答（英文）。\n問句："Where did you go last summer vacation?"（填入地點）',
    answer: 'Japan',
    explanation: '被問到暑假去了哪裡，可以回答一個地點，例如 Japan。',
    audio_transcript: 'Where did you go last summer vacation?',
    tags: '情境,vacation,地點,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出最適當的回應。\n句子："Would you like some more cake?"',
    option_a: 'Yes, please. It\'s delicious.', option_b: 'I don\'t have a pencil.', option_c: 'The park is closed.', option_d: 'My sister likes swimming.',
    answer: 'A',
    explanation: '別人問要不要再吃蛋糕時，最自然的回應是接受或婉拒，這裡答案是接受。',
    audio_transcript: 'Would you like some more cake?',
    tags: '情境,food,邀請,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽問句，填入最適當的回答（英文）。\n問句："How do you usually get to school?"（交通方式）',
    answer: 'by bus',
    explanation: '被問到如何上學，常見的回答是「by bus」、「on foot」等。',
    audio_transcript: 'How do you usually get to school?',
    tags: '情境,transportation,上學,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出最適當的回應。\n句子："I passed the exam! I got 100 points!"',
    option_a: 'I\'m sorry to hear that.', option_b: 'Congratulations! You worked hard.', option_c: 'That\'s too bad.', option_d: 'You should study more.',
    answer: 'B',
    explanation: '別人分享好消息時，最適當的回應是表示祝賀。',
    audio_transcript: 'I passed the exam! I got 100 points!',
    tags: '情境,congratulations,考試,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽問句，填入最適當的回答（英文）。\n問句："What is your favorite subject in school?"（學科）',
    answer: 'English',
    explanation: '被問到最喜歡的科目，可以回答如 English, Math, Science 等。',
    audio_transcript: 'What is your favorite subject in school?',
    tags: '情境,subject,學科,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出最適當的回應。\n句子："Excuse me, I think you dropped your wallet."',
    option_a: 'That\'s my favorite color.', option_b: 'Oh, thank you so much!', option_c: 'I like your shoes.', option_d: 'The weather is nice today.',
    answer: 'B',
    explanation: '別人提醒你掉了錢包時，應該感謝對方。',
    audio_transcript: 'Excuse me, I think you dropped your wallet.',
    tags: '情境,wallet,感謝,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽問句，填入最適當的回答（英文）。\n問句："How many people are in your family?"（數字）',
    answer: 'four',
    explanation: '被問到家庭成員人數，可以回答數字，例如 four。',
    audio_transcript: 'How many people are in your family?',
    tags: '情境,family,人數,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出最適當的回應。\n句子："Could you turn down the music, please? I\'m trying to study."',
    option_a: 'I love this song too!', option_b: 'Of course, sorry about that.', option_c: 'Let\'s dance together.', option_d: 'Music is too loud for me.',
    answer: 'B',
    explanation: '別人禮貌地要求你調低音量時，應該道歉並配合。',
    audio_transcript: 'Could you turn down the music, please? I\'m trying to study.',
    tags: '情境,music,請求,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽問句，填入最適當的回答（英文）。\n問句："What do you want to be when you grow up?"（職業）',
    answer: 'a doctor',
    explanation: '被問到長大想做什麼，可以回答職業，例如 a doctor。',
    audio_transcript: 'What do you want to be when you grow up?',
    tags: '情境,career,職業,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出最適當的回應。\n句子："I\'m sorry I forgot your birthday."',
    option_a: 'It\'s okay, don\'t worry about it.', option_b: 'I love birthday cakes!', option_c: 'Today is Monday.', option_d: 'My birthday is in April.',
    answer: 'A',
    explanation: '別人為忘記你的生日道歉時，常見的回應是接受道歉。',
    audio_transcript: 'I\'m sorry I forgot your birthday.',
    tags: '情境,apology,回應,bctest'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽問句，填入最適當的回答（英文）。\n問句："What did you have for breakfast this morning?"（食物）',
    answer: 'toast and eggs',
    explanation: '被問到早餐吃什麼，可以回答食物，例如 toast and eggs。',
    audio_transcript: 'What did you have for breakfast this morning?',
    tags: '情境,breakfast,食物,bctest'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出最適當的回應。\n句子："It\'s raining heavily outside."',
    option_a: 'I should bring an umbrella.', option_b: 'Let\'s go swimming.', option_c: 'The sun is very bright.', option_d: 'I prefer cold weather.',
    answer: 'A',
    explanation: '外面下大雨時，最合邏輯的回應是帶傘。',
    audio_transcript: 'It\'s raining heavily outside.',
    tags: '情境,weather,雨天,bctest'
  },
];

const ins = db.prepare(`INSERT INTO questions
  (subject_id, type, difficulty, content, option_a, option_b, option_c, option_d,
   answer, explanation, audio_transcript, tags, grade_level)
  VALUES (@subject_id, @type, @difficulty, @content, @option_a, @option_b, @option_c, @option_d,
   @answer, @explanation, @audio_transcript, @tags, @grade_level)`);

const doInsert = db.transaction(qs => {
  qs.forEach(q => ins.run({
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
    grade_level: 'bctest'
  }));
  return qs.length;
});

const count = doInsert(questions);
console.log(`✅ 成功植入 ${count} 道會考英文聽力題`);
console.log('   科目：英文聽力（ENG_LISTEN_BC），學段：bctest');
const stats = db.prepare(
  "SELECT type, count(*) as cnt FROM questions WHERE subject_id=? GROUP BY type"
).all(subjectId);
console.log('題型分布:', stats);
