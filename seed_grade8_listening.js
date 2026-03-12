'use strict';
const db = require('./database');

const subjectRow = db.prepare(`SELECT id FROM subjects WHERE code = 'ENG_LISTEN_8' AND grade_level = 'grade_8'`).get();
if (!subjectRow) { console.error('找不到 ENG_LISTEN_8 (grade_8) 科目，請先執行 database.js 初始化'); process.exit(1); }
const subjectId = subjectRow.id;

const questions = [

  // ── 主題一：健康與身體 Health & Body ─────────────────────────────────────
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人的症狀。',
    option_a: 'headache', option_b: 'stomachache', option_c: 'sore throat', option_d: 'fever',
    answer: 'C',
    explanation: '句子說「她喉嚨痛，說話很困難」，所以是 sore throat。',
    audio_transcript: 'She has a sore throat and finds it hard to speak.',
    tags: '健康,health,症狀,symptom'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The doctor told him to take this _____ three times a day."（藥）',
    answer: 'medicine',
    explanation: '「medicine」是藥，一天吃三次。',
    audio_transcript: 'The doctor told him to take this medicine three times a day.',
    tags: '健康,health,藥,medicine'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人去看哪種醫生。',
    option_a: 'dentist', option_b: 'eye doctor', option_c: 'skin doctor', option_d: 'general doctor',
    answer: 'A',
    explanation: '句子說「她牙痛去看牙醫」，所以是 dentist。',
    audio_transcript: 'She had a toothache and went to see the dentist.',
    tags: '健康,health,醫生,doctor'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Regular _____ helps keep your heart healthy."（運動）',
    answer: 'exercise',
    explanation: '「exercise」是運動，規律運動有益心臟健康。',
    audio_transcript: 'Regular exercise helps keep your heart healthy.',
    tags: '健康,health,運動,exercise'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人需要做什麼。',
    option_a: 'rest at home', option_b: 'go to hospital', option_c: 'drink more water', option_d: 'take vitamins',
    answer: 'C',
    explanation: '句子說「你需要多喝水，保持身體水分充足」，所以是 drink more water。',
    audio_transcript: 'You need to drink more water to stay hydrated.',
    tags: '健康,health,建議,advice'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She broke her _____ while playing basketball."（手腕）',
    answer: 'wrist',
    explanation: '「wrist」是手腕，打籃球時受傷骨折了。',
    audio_transcript: 'She broke her wrist while playing basketball.',
    tags: '健康,health,身體部位,body part'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個人受傷的原因。',
    option_a: 'fell off a bicycle', option_b: 'slipped in the bathroom', option_c: 'hit by a ball', option_d: 'twisted ankle',
    answer: 'B',
    explanation: '句子說「他在浴室滑倒，撞到頭」，所以是 slipped in the bathroom。',
    audio_transcript: 'He slipped in the bathroom and hit his head.',
    tags: '健康,health,受傷,injury'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："You should get enough _____ to stay healthy."（睡眠）',
    answer: 'sleep',
    explanation: '「sleep」是睡眠，充足的睡眠是保持健康的重要因素。',
    audio_transcript: 'You should get enough sleep to stay healthy.',
    tags: '健康,health,睡眠,sleep'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出醫院哪個部門。',
    option_a: 'emergency room', option_b: 'pharmacy', option_c: 'outpatient clinic', option_d: 'surgery room',
    answer: 'A',
    explanation: '句子說「他被緊急送到急診室，因為心臟病發作」，所以是 emergency room。',
    audio_transcript: 'He was rushed to the emergency room because of a heart attack.',
    tags: '健康,health,醫院,hospital'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She is _____ to peanuts and carries medicine with her."（過敏）',
    answer: 'allergic',
    explanation: '「allergic」是對某物過敏，她對花生過敏需要隨身攜帶藥物。',
    audio_transcript: 'She is allergic to peanuts and carries medicine with her.',
    tags: '健康,health,過敏,allergy'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出醫生的建議。',
    option_a: 'take antibiotics for 5 days', option_b: 'avoid cold drinks', option_c: 'get X-ray first', option_d: 'stay in hospital',
    answer: 'A',
    explanation: '醫生說「我開五天的抗生素給你，每天吃一顆」，所以是 take antibiotics for 5 days。',
    audio_transcript: 'I will prescribe antibiotics for five days. Take one pill each day.',
    tags: '健康,health,醫生建議,doctor advice'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Wearing a _____ can protect you from getting sick."（口罩）',
    answer: 'mask',
    explanation: '「mask」是口罩，可以預防疾病傳播。',
    audio_transcript: 'Wearing a mask can protect you from getting sick.',
    tags: '健康,health,口罩,mask'
  },

  // ── 主題二：環境與自然 Environment & Nature ───────────────────────────────
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出環境問題。',
    option_a: 'air pollution', option_b: 'water shortage', option_c: 'deforestation', option_d: 'global warming',
    answer: 'D',
    explanation: '句子說「全球暖化使地球越來越熱，冰川正在融化」，所以是 global warming。',
    audio_transcript: 'Global warming is making the earth hotter and glaciers are melting.',
    tags: '環境,environment,全球暖化,global warming'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："We should _____ our waste to protect the environment."（回收）',
    answer: 'recycle',
    explanation: '「recycle」是回收，分類回收廢棄物保護環境。',
    audio_transcript: 'We should recycle our waste to protect the environment.',
    tags: '環境,environment,回收,recycle'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出哪種動物瀕臨絕種。',
    option_a: 'elephants', option_b: 'lions', option_c: 'polar bears', option_d: 'dolphins',
    answer: 'C',
    explanation: '句子說「北極熊因為氣候變遷正面臨滅絕威脅」，所以是 polar bears。',
    audio_transcript: 'Polar bears are facing extinction due to climate change.',
    tags: '環境,environment,動物,animal'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The river was polluted by factory _____ ."（廢水）',
    answer: 'waste',
    explanation: '「waste」是廢棄物，工廠廢水污染了河流。',
    audio_transcript: 'The river was polluted by factory waste.',
    tags: '環境,environment,污染,pollution'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出節能方式。',
    option_a: 'use more air conditioning', option_b: 'turn off lights when leaving', option_c: 'drive everywhere', option_d: 'buy new appliances',
    answer: 'B',
    explanation: '句子說「離開房間時要關燈，這樣可以節省電力」，所以是 turn off lights when leaving。',
    audio_transcript: 'Turn off the lights when you leave the room to save electricity.',
    tags: '環境,environment,節能,energy saving'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Cutting down too many trees causes _____ ."（森林砍伐）',
    answer: 'deforestation',
    explanation: '「deforestation」是森林砍伐，大量砍樹破壞生態系統。',
    audio_transcript: 'Cutting down too many trees causes deforestation.',
    tags: '環境,environment,森林砍伐,deforestation'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出最環保的行為。',
    option_a: 'use plastic bags', option_b: 'print lots of paper', option_c: 'take public transport', option_d: 'leave tap running',
    answer: 'C',
    explanation: '句子說「搭大眾交通工具比自己開車更環保」，所以是 take public transport。',
    audio_transcript: 'Taking public transport is more environmentally friendly than driving your own car.',
    tags: '環境,environment,交通,transportation'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Solar _____ is a clean and renewable energy source."（能源）',
    answer: 'energy',
    explanation: '「solar energy」是太陽能，一種乾淨的可再生能源。',
    audio_transcript: 'Solar energy is a clean and renewable energy source.',
    tags: '環境,environment,太陽能,solar energy'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出正確的動物棲地。',
    option_a: 'desert', option_b: 'ocean', option_c: 'rainforest', option_d: 'arctic',
    answer: 'C',
    explanation: '句子說「猩猩生活在熱帶雨林，那是牠們的自然棲地」，所以是 rainforest。',
    audio_transcript: 'Orangutans live in the rainforest. That is their natural habitat.',
    tags: '環境,environment,棲地,habitat'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Using a reusable water bottle reduces plastic _____ ."（浪費）',
    answer: 'waste',
    explanation: '「plastic waste」是塑膠廢棄物，用可重複使用的水瓶可以減少塑膠垃圾。',
    audio_transcript: 'Using a reusable water bottle reduces plastic waste.',
    tags: '環境,environment,塑膠,plastic'
  },

  // ── 主題三：科技與網路 Technology & Internet ──────────────────────────────
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人在使用什麼科技。',
    option_a: 'laptop', option_b: 'tablet', option_c: 'smartphone', option_d: 'smart watch',
    answer: 'C',
    explanation: '句子說「她用智慧型手機查地圖，找到了目的地」，所以是 smartphone。',
    audio_transcript: 'She used her smartphone to check the map and found the destination.',
    tags: '科技,technology,手機,smartphone'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Please enter your _____ to log into the system."（密碼）',
    answer: 'password',
    explanation: '「password」是密碼，登入系統需要輸入密碼。',
    audio_transcript: 'Please enter your password to log into the system.',
    tags: '科技,technology,密碼,password'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人遇到的問題。',
    option_a: 'battery is dead', option_b: 'no internet connection', option_c: 'screen is broken', option_d: 'memory is full',
    answer: 'B',
    explanation: '句子說「我無法連上網路，無法上傳影片」，所以是 no internet connection。',
    audio_transcript: 'I cannot connect to the internet and I cannot upload the video.',
    tags: '科技,technology,網路,internet'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："You can _____ the file to your email as an attachment."（附上）',
    answer: 'attach',
    explanation: '「attach」是附加，可以把檔案附加在電子郵件中發送。',
    audio_transcript: 'You can attach the file to your email as an attachment.',
    tags: '科技,technology,電郵,email'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出網路安全的建議。',
    option_a: 'share passwords with friends', option_b: 'use the same password everywhere', option_c: 'click all links in emails', option_d: 'use strong and unique passwords',
    answer: 'D',
    explanation: '句子說「為每個帳號設定強力且獨特的密碼，保護你的資訊安全」，所以是 D。',
    audio_transcript: 'Use strong and unique passwords for each account to protect your information.',
    tags: '科技,technology,網路安全,cybersecurity'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The video has gone _____ and millions of people watched it."（病毒式傳播）',
    answer: 'viral',
    explanation: '「go viral」是病毒式傳播，影片被數百萬人觀看。',
    audio_transcript: 'The video has gone viral and millions of people watched it.',
    tags: '科技,technology,社群媒體,social media'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人在做什麼。',
    option_a: 'downloading music', option_b: 'streaming a movie', option_c: 'video calling', option_d: 'playing online games',
    answer: 'C',
    explanation: '句子說「他正在和住在美國的祖父母視訊通話」，所以是 video calling。',
    audio_transcript: 'He is video calling his grandparents who live in the United States.',
    tags: '科技,technology,視訊,video call'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："AI stands for Artificial _____ ."（智慧）',
    answer: 'Intelligence',
    explanation: '「AI」是 Artificial Intelligence（人工智慧）的縮寫。',
    audio_transcript: 'AI stands for Artificial Intelligence.',
    tags: '科技,technology,AI,人工智慧'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出需要多少儲存空間。',
    option_a: '4 GB', option_b: '16 GB', option_c: '64 GB', option_d: '128 GB',
    answer: 'C',
    explanation: '句子說「這個 App 需要 64 GB 的儲存空間」，所以是 64 GB。',
    audio_transcript: 'This app requires sixty-four gigabytes of storage space.',
    tags: '科技,technology,儲存,storage'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Please _____ the document before sending it."（儲存）',
    answer: 'save',
    explanation: '「save」是儲存，發送前要先儲存文件。',
    audio_transcript: 'Please save the document before sending it.',
    tags: '科技,technology,電腦,computer'
  },

  // ── 主題四：旅遊與文化 Travel & Culture ───────────────────────────────────
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人去了哪個國家。',
    option_a: 'Japan', option_b: 'Korea', option_c: 'France', option_d: 'Australia',
    answer: 'C',
    explanation: '句子說「去年暑假她去了法國，參觀了艾菲爾鐵塔」，所以是 France。',
    audio_transcript: 'She visited France last summer and saw the Eiffel Tower.',
    tags: '旅遊,travel,法國,France'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："You need a valid _____ to travel abroad."（護照）',
    answer: 'passport',
    explanation: '「passport」是護照，出國旅遊必備的證件。',
    audio_transcript: 'You need a valid passport to travel abroad.',
    tags: '旅遊,travel,護照,passport'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽對話，選出這個人住在哪種住宿。',
    option_a: 'five-star hotel', option_b: 'hostel', option_c: 'homestay', option_d: 'camping tent',
    answer: 'C',
    explanation: '句子說「她選擇住在當地家庭，體驗真實的文化生活」，所以是 homestay。',
    audio_transcript: 'She chose to stay with a local family to experience real cultural life.',
    tags: '旅遊,travel,住宿,accommodation'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She exchanged money at the _____ at the airport."（匯兌）',
    answer: 'exchange',
    explanation: '「currency exchange」是貨幣兌換，在機場可以換匯。',
    audio_transcript: 'She exchanged money at the currency exchange at the airport.',
    tags: '旅遊,travel,換匯,exchange'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個人對日本文化的描述。',
    option_a: 'people are very loud', option_b: 'food is too spicy', option_c: 'people are very polite', option_d: 'buildings are very old',
    answer: 'C',
    explanation: '句子說「日本人非常有禮貌，讓他印象深刻」，所以是 people are very polite。',
    audio_transcript: 'Japanese people are very polite. He was very impressed.',
    tags: '旅遊,travel,文化,culture'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Don\'t forget to buy some _____ for your family."（紀念品）',
    answer: 'souvenirs',
    explanation: '「souvenirs」是紀念品，旅遊時常為家人購買。',
    audio_transcript: "Don't forget to buy some souvenirs for your family.",
    tags: '旅遊,travel,紀念品,souvenir'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人在機場遇到的問題。',
    option_a: 'lost luggage', option_b: 'missed flight', option_c: 'wrong terminal', option_d: 'no boarding pass',
    answer: 'B',
    explanation: '句子說「他塞車錯過了班機，需要重新訂票」，所以是 missed flight。',
    audio_transcript: 'He got stuck in traffic and missed his flight. He had to rebook.',
    tags: '旅遊,travel,機場,airport'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She got jet _____ after the long flight from New York."（時差）',
    answer: 'lag',
    explanation: '「jet lag」是時差問題，長途飛行後常見。',
    audio_transcript: 'She got jet lag after the long flight from New York.',
    tags: '旅遊,travel,時差,jet lag'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個旅遊景點的特色。',
    option_a: 'great food', option_b: 'beautiful beaches', option_c: 'historical buildings', option_d: 'amazing nightlife',
    answer: 'C',
    explanation: '句子說「這個城市有很多歷史建築，保存了幾百年的文化」，所以是 historical buildings。',
    audio_transcript: 'This city has many historical buildings that preserve hundreds of years of culture.',
    tags: '旅遊,travel,景點,attraction'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The tour guide showed us around the famous _____ ."（博物館）',
    answer: 'museum',
    explanation: '「museum」是博物館，導遊帶我們參觀。',
    audio_transcript: 'The tour guide showed us around the famous museum.',
    tags: '旅遊,travel,博物館,museum'
  },

  // ── 主題五：學校與社交生活 School & Social Life ───────────────────────────
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人參加了什麼社團。',
    option_a: 'drama club', option_b: 'science club', option_c: 'chess club', option_d: 'cooking club',
    answer: 'A',
    explanation: '句子說「她加入了話劇社，今年演出了一場精彩的戲劇」，所以是 drama club。',
    audio_transcript: 'She joined the drama club and performed in a wonderful play this year.',
    tags: '學校,school,社團,club'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The school is holding a _____ to raise money for charity."（募款活動）',
    answer: 'fundraiser',
    explanation: '「fundraiser」是募款活動，學校為慈善機構籌款。',
    audio_transcript: 'The school is holding a fundraiser to raise money for charity.',
    tags: '學校,school,活動,event'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人面臨的問題。',
    option_a: 'failing grades', option_b: 'peer pressure', option_c: 'being bullied', option_d: 'too much homework',
    answer: 'C',
    explanation: '句子說「有些同學一直取笑他，讓他不想上學」，所以是 being bullied。',
    audio_transcript: 'Some classmates keep making fun of him and he does not want to go to school.',
    tags: '學校,school,霸凌,bullying'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She received a _____ for excellent academic performance."（獎學金）',
    answer: 'scholarship',
    explanation: '「scholarship」是獎學金，因優秀的學業表現獲得。',
    audio_transcript: 'She received a scholarship for excellent academic performance.',
    tags: '學校,school,獎學金,scholarship'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個人申請了哪個項目。',
    option_a: 'student council', option_b: 'school newspaper', option_c: 'exchange program', option_d: 'sports team',
    answer: 'C',
    explanation: '句子說「他申請了交換生計劃，將去德國讀一年書」，所以是 exchange program。',
    audio_transcript: 'He applied for an exchange program and will study in Germany for one year.',
    tags: '學校,school,交換生,exchange'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The graduation _____ will be held in the school gym."（典禮）',
    answer: 'ceremony',
    explanation: '「graduation ceremony」是畢業典禮，在學校體育館舉行。',
    audio_transcript: 'The graduation ceremony will be held in the school gym.',
    tags: '學校,school,畢業,graduation'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人怎麼幫助同學。',
    option_a: 'shared notes', option_b: 'tutored after school', option_c: 'lent money', option_d: 'gave answers',
    answer: 'B',
    explanation: '句子說「她放學後輔導同學數學，幫助他通過考試」，所以是 tutored after school。',
    audio_transcript: 'She tutored her classmate in math after school and helped him pass the exam.',
    tags: '學校,school,幫助,help'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The school _____ meets every Tuesday to discuss school issues."（學生會）',
    answer: 'council',
    explanation: '「student council」是學生會，每週二開會討論學校事務。',
    audio_transcript: 'The school council meets every Tuesday to discuss school issues.',
    tags: '學校,school,學生會,council'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出老師為什麼生氣。',
    option_a: 'students were late', option_b: 'no one did homework', option_c: 'class was too noisy', option_d: 'students used phones',
    answer: 'D',
    explanation: '句子說「老師生氣是因為學生上課一直在滑手機」，所以是 students used phones。',
    audio_transcript: 'The teacher was angry because students were using their phones during class.',
    tags: '學校,school,規定,rules'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The school _____ trip to the science museum was cancelled."（校外教學）',
    answer: 'field',
    explanation: '「field trip」是校外教學，去科學博物館的參訪被取消了。',
    audio_transcript: 'The school field trip to the science museum was cancelled.',
    tags: '學校,school,校外教學,field trip'
  },

  // ── 主題六：工作與職業 Jobs & Careers ─────────────────────────────────────
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人的職業。',
    option_a: 'nurse', option_b: 'engineer', option_c: 'journalist', option_d: 'chef',
    answer: 'C',
    explanation: '句子說「她是記者，每天報導重要新聞」，所以是 journalist。',
    audio_transcript: 'She is a journalist who reports important news every day.',
    tags: '職業,career,記者,journalist'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："He wants to become an _____ and design buildings."（建築師）',
    answer: 'architect',
    explanation: '「architect」是建築師，設計建築物的專業人員。',
    audio_transcript: 'He wants to become an architect and design buildings.',
    tags: '職業,career,建築師,architect'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人在找什麼工作。',
    option_a: 'part-time cashier', option_b: 'full-time cook', option_c: 'volunteer teacher', option_d: 'freelance designer',
    answer: 'A',
    explanation: '句子說「他在找收銀員的兼職工作，一週工作三天」，所以是 part-time cashier。',
    audio_transcript: 'He is looking for a part-time cashier job, working three days a week.',
    tags: '職業,career,兼職,part-time'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："A good _____ needs to be patient and creative."（設計師）',
    answer: 'designer',
    explanation: '「designer」是設計師，需要有耐心和創意。',
    audio_transcript: 'A good designer needs to be patient and creative.',
    tags: '職業,career,設計師,designer'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個工作最重要的技能。',
    option_a: 'good memory', option_b: 'communication skills', option_c: 'math ability', option_d: 'physical strength',
    answer: 'B',
    explanation: '句子說「在這份工作中，溝通技巧是最重要的，你需要每天和不同的人交談」，所以是 B。',
    audio_transcript: 'In this job, communication skills are the most important. You need to talk to different people every day.',
    tags: '職業,career,技能,skill'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She submitted her _____ for the marketing manager position."（履歷）',
    answer: 'resume',
    explanation: '「resume」是履歷，應徵行銷經理職位需要提交履歷。',
    audio_transcript: 'She submitted her resume for the marketing manager position.',
    tags: '職業,career,履歷,resume'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人做的工作。',
    option_a: 'teach students', option_b: 'treat patients', option_c: 'fight fires', option_d: 'fly planes',
    answer: 'C',
    explanation: '句子說「他是消防員，勇敢地撲滅了大火」，所以是 fight fires。',
    audio_transcript: 'He is a firefighter who bravely put out a large fire.',
    tags: '職業,career,消防員,firefighter'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The _____ gave a speech about the company\'s future plans."（執行長）',
    answer: 'CEO',
    explanation: '「CEO」是執行長（Chief Executive Officer），公司的最高負責人。',
    audio_transcript: "The CEO gave a speech about the company's future plans.",
    tags: '職業,career,執行長,CEO'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人的夢想職業。',
    option_a: 'vet', option_b: 'astronaut', option_c: 'musician', option_d: 'scientist',
    answer: 'B',
    explanation: '句子說「從小她就夢想成為太空人，探索宇宙」，所以是 astronaut。',
    audio_transcript: 'Since she was young, she dreamed of becoming an astronaut and exploring the universe.',
    tags: '職業,career,太空人,astronaut'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："He earns a good _____ as a software engineer."（薪水）',
    answer: 'salary',
    explanation: '「salary」是薪水，軟體工程師的薪水不錯。',
    audio_transcript: 'He earns a good salary as a software engineer.',
    tags: '職業,career,薪水,salary'
  },

  // ── 主題七：社區與社會 Community & Society ────────────────────────────────
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人正在做什麼志工活動。',
    option_a: 'picking up trash', option_b: 'teaching elderly', option_c: 'planting trees', option_d: 'visiting orphanage',
    answer: 'A',
    explanation: '句子說「他們在海灘撿垃圾，清潔環境」，所以是 picking up trash。',
    audio_transcript: 'They are picking up trash on the beach to clean up the environment.',
    tags: '社區,community,志工,volunteer'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She volunteers at the local _____ on weekends."（圖書館）',
    answer: 'library',
    explanation: '「library」是圖書館，她週末在圖書館當志工。',
    audio_transcript: 'She volunteers at the local library on weekends.',
    tags: '社區,community,圖書館,library'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個社區活動的目的。',
    option_a: 'make money', option_b: 'meet neighbors', option_c: 'clean the park', option_d: 'raise awareness',
    answer: 'D',
    explanation: '句子說「這個活動旨在提高大家對食物浪費問題的意識」，所以是 raise awareness。',
    audio_transcript: 'This event aims to raise awareness about the issue of food waste.',
    tags: '社區,community,活動,event'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The government plans to build more _____ housing for low-income families."（平價住宅）',
    answer: 'affordable',
    explanation: '「affordable housing」是平價住宅，政府計劃為低收入家庭建造。',
    audio_transcript: 'The government plans to build more affordable housing for low-income families.',
    tags: '社區,community,住宅,housing'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個慈善活動募集了多少錢。',
    option_a: '10,000 dollars', option_b: '50,000 dollars', option_c: '100,000 dollars', option_d: '500,000 dollars',
    answer: 'C',
    explanation: '句子說「這次慈善活動共募集了十萬元捐款」，所以是 100,000 dollars。',
    audio_transcript: 'This charity event raised a total of one hundred thousand dollars in donations.',
    tags: '社區,community,慈善,charity'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The neighborhood _____ keeps the area safe and clean."（協會）',
    answer: 'association',
    explanation: '「neighborhood association」是社區協會，維持地區安全和整潔。',
    audio_transcript: 'The neighborhood association keeps the area safe and clean.',
    tags: '社區,community,協會,association'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人為社區做了什麼貢獻。',
    option_a: 'built a playground', option_b: 'started a recycling program', option_c: 'opened a free school', option_d: 'planted a garden',
    answer: 'B',
    explanation: '句子說「她在社區啟動了回收計劃，大大減少了垃圾量」，所以是 B。',
    audio_transcript: 'She started a recycling program in the community and greatly reduced the amount of trash.',
    tags: '社區,community,回收,recycle'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The city is building a new _____ center for elderly residents."（照護）',
    answer: 'care',
    explanation: '「care center」是照護中心，城市為老年居民建立的設施。',
    audio_transcript: 'The city is building a new care center for elderly residents.',
    tags: '社區,community,老年,elderly'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個公共設施在哪裡。',
    option_a: 'near the school', option_b: 'in the city center', option_c: 'next to the park', option_d: 'on the main street',
    answer: 'C',
    explanation: '句子說「新的社區中心就在公園旁邊，方便居民使用」，所以是 next to the park。',
    audio_transcript: 'The new community center is next to the park, making it convenient for residents.',
    tags: '社區,community,設施,facility'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Everyone should _____ their trash in the bin."（丟棄）',
    answer: 'dispose',
    explanation: '「dispose」是丟棄，應該把垃圾放入垃圾桶。',
    audio_transcript: 'Everyone should dispose their trash in the bin.',
    tags: '社區,community,垃圾,trash'
  },

  // ── 主題八：娛樂與媒體 Entertainment & Media ──────────────────────────────
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這部電影的類型。',
    option_a: 'comedy', option_b: 'horror', option_c: 'science fiction', option_d: 'romance',
    answer: 'C',
    explanation: '句子說「這部電影發生在2050年的太空，充滿了科幻元素」，所以是 science fiction。',
    audio_transcript: 'This movie is set in space in 2050 and is full of science fiction elements.',
    tags: '娛樂,entertainment,電影,movie'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The new album will be _____ next Friday."（發行）',
    answer: 'released',
    explanation: '「released」是發行，新專輯下週五發行。',
    audio_transcript: 'The new album will be released next Friday.',
    tags: '娛樂,entertainment,音樂,music'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個節目的評分。',
    option_a: '3 stars', option_b: '3.5 stars', option_c: '4 stars', option_d: '4.5 stars',
    answer: 'D',
    explanation: '句子說「這個電視節目獲得了 4.5 顆星的高評分」，所以是 4.5 stars。',
    audio_transcript: 'This TV show received a high rating of four and a half stars.',
    tags: '娛樂,entertainment,評分,rating'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The _____ for the new superhero movie looks amazing."（預告片）',
    answer: 'trailer',
    explanation: '「trailer」是電影預告片，新超級英雄電影的預告片非常精彩。',
    audio_transcript: 'The trailer for the new superhero movie looks amazing.',
    tags: '娛樂,entertainment,電影,movie'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個人對這首歌的看法。',
    option_a: 'too slow and boring', option_b: 'catchy and enjoyable', option_c: 'too loud', option_d: 'hard to understand',
    answer: 'B',
    explanation: '句子說「這首歌的旋律朗朗上口，讓人忍不住跟著哼唱」，所以是 catchy and enjoyable。',
    audio_transcript: 'The melody of this song is catchy and makes you want to hum along.',
    tags: '娛樂,entertainment,音樂,music'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The comedian\'s show was so funny that the audience laughed the whole _____ ."（時間）',
    answer: 'time',
    explanation: '「the whole time」是整個過程，觀眾全程都在笑。',
    audio_transcript: "The comedian's show was so funny that the audience laughed the whole time.",
    tags: '娛樂,entertainment,表演,performance'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人為什麼不喜歡這本書。',
    option_a: 'too short', option_b: 'too confusing', option_c: 'ending was bad', option_d: 'characters were boring',
    answer: 'C',
    explanation: '句子說「故事情節很好，但結局太令人失望了」，所以是 ending was bad。',
    audio_transcript: 'The story plot was good but the ending was very disappointing.',
    tags: '娛樂,entertainment,書,book'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The band\'s _____ performance attracted thousands of fans."（現場）',
    answer: 'live',
    explanation: '「live performance」是現場表演，吸引了數千名粉絲。',
    audio_transcript: "The band's live performance attracted thousands of fans.",
    tags: '娛樂,entertainment,演唱會,concert'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個 YouTuber 的頻道類型。',
    option_a: 'gaming', option_b: 'cooking', option_c: 'travel', option_d: 'education',
    answer: 'D',
    explanation: '句子說「他的頻道專門解釋科學知識，幫助學生學習」，所以是 education。',
    audio_transcript: 'His channel specializes in explaining science concepts to help students learn.',
    tags: '娛樂,entertainment,YouTube,網路'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She _____ the documentary about ocean pollution and felt moved."（觀看）',
    answer: 'watched',
    explanation: '「watched」是觀看，她看了關於海洋污染的紀錄片深受感動。',
    audio_transcript: 'She watched the documentary about ocean pollution and felt moved.',
    tags: '娛樂,entertainment,紀錄片,documentary'
  },

  // ── 主題九：未來與夢想 Future & Dreams ────────────────────────────────────
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人未來想做什麼。',
    option_a: 'travel around the world', option_b: 'start a business', option_c: 'study abroad', option_d: 'write a novel',
    answer: 'C',
    explanation: '句子說「她希望大學時能去英國留學，增廣見聞」，所以是 study abroad。',
    audio_transcript: 'She hopes to study in the UK when she goes to university to broaden her horizons.',
    tags: '未來,future,留學,study abroad'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："He plans to _____ his own café after graduating."（開設）',
    answer: 'open',
    explanation: '「open a café」是開咖啡廳，他計劃畢業後創業。',
    audio_transcript: 'He plans to open his own café after graduating.',
    tags: '未來,future,創業,entrepreneurship'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個人認為未來最重要的技能。',
    option_a: 'language skills', option_b: 'coding skills', option_c: 'artistic skills', option_d: 'leadership skills',
    answer: 'B',
    explanation: '句子說「在未來，寫程式將是最重要的技能，因為科技將主導一切」，所以是 coding skills。',
    audio_transcript: 'In the future, coding will be the most important skill as technology will dominate everything.',
    tags: '未來,future,技能,skill'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She dreams of winning a Nobel _____ for her research."（獎）',
    answer: 'Prize',
    explanation: '「Nobel Prize」是諾貝爾獎，她夢想因為研究獲得諾貝爾獎。',
    audio_transcript: 'She dreams of winning a Nobel Prize for her research.',
    tags: '未來,future,夢想,dream'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人對未來的態度。',
    option_a: 'very worried', option_b: 'excited and hopeful', option_c: 'unsure and confused', option_d: 'totally calm',
    answer: 'B',
    explanation: '句子說「他對未來充滿期待，相信自己能實現夢想」，所以是 excited and hopeful。',
    audio_transcript: 'He is full of excitement for the future and believes he can achieve his dreams.',
    tags: '未來,future,態度,attitude'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："With hard work and _____ , you can achieve anything."（決心）',
    answer: 'determination',
    explanation: '「determination」是決心，努力加上決心就能實現任何事。',
    audio_transcript: 'With hard work and determination, you can achieve anything.',
    tags: '未來,future,激勵,motivation'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個人為實現夢想做了什麼準備。',
    option_a: 'took extra courses', option_b: 'saved money', option_c: 'practiced every day', option_d: 'asked for help',
    answer: 'C',
    explanation: '句子說「為了成為職業音樂家，她每天練習鋼琴六小時」，所以是 practiced every day。',
    audio_transcript: 'To become a professional musician, she practiced piano for six hours every day.',
    tags: '未來,future,準備,preparation'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Setting _____ goals helps you stay focused and motivated."（明確的）',
    answer: 'clear',
    explanation: '「clear goals」是明確的目標，有助於保持專注和動力。',
    audio_transcript: 'Setting clear goals helps you stay focused and motivated.',
    tags: '未來,future,目標,goal'
  },
  {
    type: 'choice', difficulty: 2,
    content: '🎧 請聆聽句子，選出這個人未來想住在哪裡。',
    option_a: 'big city', option_b: 'quiet countryside', option_c: 'near the ocean', option_d: 'overseas',
    answer: 'D',
    explanation: '句子說「他畢業後想移居海外，體驗不同的生活方式」，所以是 overseas。',
    audio_transcript: 'After graduation, he wants to move overseas to experience a different way of life.',
    tags: '未來,future,生活,lifestyle'
  },
  {
    type: 'fill', difficulty: 2,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Never give up on your _____ , no matter how hard it gets."（夢想）',
    answer: 'dreams',
    explanation: '「dreams」是夢想，不管多難都不要放棄夢想。',
    audio_transcript: 'Never give up on your dreams, no matter how hard it gets.',
    tags: '未來,future,夢想,dream,勵志,motivation'
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
      grade_level: 'grade_8',
    });
    count++;
  }
  return count;
});

const inserted = insertAll(questions);
console.log(`✅ 成功植入 ${inserted} 道國二英文聽力題`);
console.log(`   科目：英文聽力（ENG_LISTEN_8），學段：grade_8`);

const stats = db.prepare(`
  SELECT type, count(*) as cnt FROM questions WHERE subject_id = ? GROUP BY type
`).all(subjectId);
console.log('題型分布:', stats);
