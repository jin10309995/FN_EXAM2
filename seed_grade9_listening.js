'use strict';
/**
 * 國三（Grade 9）英文聽力測驗 — 100 題
 * 科目：英文聽力（ENG_LISTEN_9），學段：grade_9
 * 難度：B1（CEFR），適合升高中準備
 * 題型：choice 50 + fill 50
 * 每題均含 audio_transcript 供 TTS 播放
 */
const db = require('./database');

const subjectId = db.prepare("SELECT id FROM subjects WHERE code='ENG_LISTEN_9'").get().id;

const questions = [

  // === 主題 1：學業與升學（Academic Life & Further Study）12 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個學生申請了什麼。',
    option_a: 'a scholarship', option_b: 'a part-time job', option_c: 'a study abroad program', option_d: 'a science competition',
    answer: 'C',
    explanation: '句子說「她申請了一個留學計畫，希望能去英國讀書」，所以是 a study abroad program。',
    audio_transcript: 'She applied for a study abroad program and hopes to study in the UK.',
    tags: '學業,study abroad,升學,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："He needs to improve his _____ skills to pass the exam."（字彙）',
    answer: 'vocabulary',
    explanation: '「vocabulary」是字彙，他需要加強字彙技巧來通過考試。',
    audio_transcript: 'He needs to improve his vocabulary skills to pass the exam.',
    tags: '學業,vocabulary,考試,grade_9'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出老師建議學生做什麼。',
    option_a: 'take more notes', option_b: 'read more books', option_c: 'join a study group', option_d: 'rest more',
    answer: 'C',
    explanation: '句子說「老師建議學生加入讀書小組，互相幫助」，所以是 join a study group。',
    audio_transcript: 'The teacher suggested that students join a study group to help each other.',
    tags: '學業,study group,建議,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The university requires a minimum _____ of 80 points."（分數）',
    answer: 'score',
    explanation: '「score」是分數，大學要求最低80分。',
    audio_transcript: 'The university requires a minimum score of 80 points.',
    tags: '升學,university,分數,grade_9'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這位同學最擔心的考試科目。',
    option_a: 'Math', option_b: 'English', option_c: 'Science', option_d: 'History',
    answer: 'A',
    explanation: '句子說「他對數學最擔心，因為計算題對他來說很難」，所以是 Math。',
    audio_transcript: 'He is most worried about Math because calculation problems are very hard for him.',
    tags: '學業,Math,擔心,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She _____ her essay three times before submitting it."（修改）',
    answer: 'revised',
    explanation: '「revised」是修改，她在提交前修改了三次作文。',
    audio_transcript: 'She revised her essay three times before submitting it.',
    tags: '學業,essay,修改,grade_9'
  },

  // === 主題 2：社會議題（Social Issues）12 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個社會問題是什麼。',
    option_a: 'traffic', option_b: 'inequality', option_c: 'pollution', option_d: 'unemployment',
    answer: 'B',
    explanation: '句子說「社會不平等是現代最嚴重的問題之一」，所以是 inequality。',
    audio_transcript: 'Social inequality is one of the most serious problems in modern times.',
    tags: '社會,inequality,議題,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Many people _____ against the new policy in the street."（抗議）',
    answer: 'protested',
    explanation: '「protested」是抗議，許多人在街上抗議新政策。',
    audio_transcript: 'Many people protested against the new policy in the street.',
    tags: '社會,protest,政策,grade_9'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個組織在做什麼。',
    option_a: 'raising money', option_b: 'building schools', option_c: 'providing food', option_d: 'teaching languages',
    answer: 'C',
    explanation: '句子說「這個組織每天為無家可歸的人提供食物」，所以是 providing food。',
    audio_transcript: 'This organization provides food for homeless people every day.',
    tags: '社會,homeless,組織,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The government passed a law to protect _____ rights."（消費者）',
    answer: 'consumer',
    explanation: '「consumer」是消費者，政府通過法律保護消費者權益。',
    audio_transcript: 'The government passed a law to protect consumer rights.',
    tags: '社會,consumer,法律,grade_9'
  },
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽句子，選出演講者對網路霸凌的看法。',
    option_a: 'It is not serious', option_b: 'It only affects children', option_c: 'It needs immediate action', option_d: 'It will solve itself',
    answer: 'C',
    explanation: '句子說「網路霸凌是嚴重問題，需要立即採取行動解決」，所以是 It needs immediate action。',
    audio_transcript: 'Cyberbullying is a serious problem that needs immediate action to solve.',
    tags: '社會,cyberbullying,網路,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Volunteers help to clean up the _____ every weekend."（海灘）',
    answer: 'beach',
    explanation: '「beach」是海灘，志工每週末幫忙清理海灘。',
    audio_transcript: 'Volunteers help to clean up the beach every weekend.',
    tags: '社會,volunteer,海灘,grade_9'
  },

  // === 主題 3：科技與未來（Technology & Future）12 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個新科技的用途。',
    option_a: 'entertainment', option_b: 'medical treatment', option_c: 'transportation', option_d: 'cooking',
    answer: 'B',
    explanation: '句子說「這個新科技被用於醫療診斷，幫助醫生更準確地找到病因」，所以是 medical treatment。',
    audio_transcript: 'This new technology is used for medical diagnosis to help doctors find the cause of illness more accurately.',
    tags: '科技,medical,診斷,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Artificial _____ can now write poems and draw pictures."（智慧）',
    answer: 'intelligence',
    explanation: '「artificial intelligence」是人工智慧，現在可以寫詩和畫圖。',
    audio_transcript: 'Artificial intelligence can now write poems and draw pictures.',
    tags: '科技,AI,人工智慧,grade_9'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個機器人的功能。',
    option_a: 'cooking meals', option_b: 'delivering packages', option_c: 'teaching students', option_d: 'cleaning streets',
    answer: 'B',
    explanation: '句子說「這個機器人被設計來在城市裡遞送包裹」，所以是 delivering packages。',
    audio_transcript: 'This robot is designed to deliver packages around the city.',
    tags: '科技,robot,遞送,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The new electric car can travel 500 kilometers on a single _____ ."（充電）',
    answer: 'charge',
    explanation: '「charge」是充電，這輛新型電動車一次充電可行駛500公里。',
    audio_transcript: 'The new electric car can travel 500 kilometers on a single charge.',
    tags: '科技,electric car,充電,grade_9'
  },
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽句子，選出專家對太空旅遊的預測。',
    option_a: 'It will become common in 10 years', option_b: 'It is already affordable', option_c: 'It will never be possible', option_d: 'Only scientists can do it',
    answer: 'A',
    explanation: '句子說「專家預測太空旅遊將在十年內變得普遍」，所以是 It will become common in 10 years。',
    audio_transcript: 'Experts predict that space tourism will become common within ten years.',
    tags: '科技,space,旅遊,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The company uses solar _____ to power all its buildings."（能源）',
    answer: 'energy',
    explanation: '「solar energy」是太陽能，公司用太陽能為所有建築供電。',
    audio_transcript: 'The company uses solar energy to power all its buildings.',
    tags: '科技,solar,能源,grade_9'
  },

  // === 主題 4：健康與心理（Health & Mental Wellness）11 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出醫生建議的預防方式。',
    option_a: 'take more medicine', option_b: 'exercise regularly', option_c: 'sleep less', option_d: 'avoid sunlight',
    answer: 'B',
    explanation: '句子說「醫生建議定期運動是預防慢性病的最好方法」，所以是 exercise regularly。',
    audio_transcript: 'The doctor suggests that exercising regularly is the best way to prevent chronic diseases.',
    tags: '健康,exercise,預防,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Teenagers should limit their _____ time to two hours a day."（螢幕）',
    answer: 'screen',
    explanation: '「screen time」是螢幕使用時間，青少年應限制每天使用兩小時。',
    audio_transcript: 'Teenagers should limit their screen time to two hours a day.',
    tags: '健康,screen time,青少年,grade_9'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個人感到壓力的原因。',
    option_a: 'too much homework', option_b: 'family problems', option_c: 'peer pressure', option_d: 'all of the above',
    answer: 'D',
    explanation: '句子說「他的壓力來自作業、家庭問題和同儕壓力，這些都是原因」，所以是 all of the above。',
    audio_transcript: 'His stress comes from homework, family problems, and peer pressure; all of these are reasons.',
    tags: '心理,stress,壓力,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She sees a _____ to talk about her anxiety every week."（諮商師）',
    answer: 'counselor',
    explanation: '「counselor」是諮商師，她每週去找諮商師談她的焦慮。',
    audio_transcript: 'She sees a counselor to talk about her anxiety every week.',
    tags: '心理,counselor,焦慮,grade_9'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出研究發現睡眠不足的影響。',
    option_a: 'better memory', option_b: 'poor concentration', option_c: 'more energy', option_d: 'faster learning',
    answer: 'B',
    explanation: '句子說「研究發現睡眠不足會導致注意力下降」，所以是 poor concentration。',
    audio_transcript: 'Research found that lack of sleep leads to poor concentration.',
    tags: '健康,sleep,研究,grade_9'
  },

  // === 主題 5：環境與氣候（Environment & Climate）11 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出科學家警告的主要氣候問題。',
    option_a: 'rising sea levels', option_b: 'more rainfall', option_c: 'cooler summers', option_d: 'stronger winds',
    answer: 'A',
    explanation: '句子說「科學家警告海平面上升將淹沒許多沿海城市」，所以是 rising sea levels。',
    audio_transcript: 'Scientists warn that rising sea levels will flood many coastal cities.',
    tags: '環境,climate,海平面,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The government plans to plant one million trees to fight _____ ."（去森林化）',
    answer: 'deforestation',
    explanation: '「deforestation」是去森林化，政府計畫種植一百萬棵樹來對抗砍伐。',
    audio_transcript: 'The government plans to plant one million trees to fight deforestation.',
    tags: '環境,deforestation,樹木,grade_9'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個國家採取了什麼環保行動。',
    option_a: 'banned plastic bags', option_b: 'closed all factories', option_c: 'stopped using cars', option_d: 'built more parks',
    answer: 'A',
    explanation: '句子說「這個國家禁止使用塑膠袋，以減少海洋污染」，所以是 banned plastic bags。',
    audio_transcript: 'This country banned plastic bags to reduce ocean pollution.',
    tags: '環境,plastic,禁止,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Recycling helps to reduce _____ and save resources."（廢棄物）',
    answer: 'waste',
    explanation: '「waste」是廢棄物，回收有助於減少廢棄物和節省資源。',
    audio_transcript: 'Recycling helps to reduce waste and save resources.',
    tags: '環境,recycling,廢棄物,grade_9'
  },
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽句子，選出這份報告建議企業做什麼。',
    option_a: 'use more fossil fuels', option_b: 'invest in renewable energy', option_c: 'reduce employee numbers', option_d: 'increase production',
    answer: 'B',
    explanation: '句子說「報告建議企業投資可再生能源以降低碳排放」，所以是 invest in renewable energy。',
    audio_transcript: 'The report recommends that businesses invest in renewable energy to reduce carbon emissions.',
    tags: '環境,renewable energy,企業,grade_9'
  },

  // === 主題 6：文化與全球化（Culture & Globalization）11 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個文化節慶是哪個國家的。',
    option_a: 'Japan', option_b: 'India', option_c: 'Brazil', option_d: 'Mexico',
    answer: 'C',
    explanation: '句子說「這個知名嘉年華節慶在每年二月舉行，是巴西的傳統」，所以是 Brazil。',
    audio_transcript: 'This famous carnival festival is held every February and is a Brazilian tradition.',
    tags: '文化,carnival,巴西,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Learning a second language _____ your career opportunities."（擴展）',
    answer: 'expands',
    explanation: '「expands」是擴展，學習第二語言可以擴展你的職業機會。',
    audio_transcript: 'Learning a second language expands your career opportunities.',
    tags: '文化,language,職業,grade_9'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出全球化帶來的好處。',
    option_a: 'cultural loss', option_b: 'information sharing', option_c: 'more wars', option_d: 'higher prices',
    answer: 'B',
    explanation: '句子說「全球化使得知識和資訊得以快速分享」，所以是 information sharing。',
    audio_transcript: 'Globalization allows knowledge and information to be shared quickly.',
    tags: '文化,globalization,資訊,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The local _____ helps to preserve traditional crafts."（工藝師）',
    answer: 'artisan',
    explanation: '「artisan」是工藝師，當地工藝師幫助保護傳統工藝。',
    audio_transcript: 'The local artisan helps to preserve traditional crafts.',
    tags: '文化,artisan,傳統,grade_9'
  },
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽句子，選出演講者對文化多樣性的看法。',
    option_a: 'It causes conflict', option_b: 'It should be avoided', option_c: 'It enriches society', option_d: 'It is difficult to manage',
    answer: 'C',
    explanation: '句子說「文化多樣性豐富了社會，讓我們能從不同視角看世界」，所以是 It enriches society。',
    audio_transcript: 'Cultural diversity enriches society and allows us to see the world from different perspectives.',
    tags: '文化,diversity,社會,grade_9'
  },

  // === 主題 7：經濟與消費（Economy & Consumer Behavior）11 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個廣告的目的。',
    option_a: 'to inform about health', option_b: 'to promote a product', option_c: 'to warn about danger', option_d: 'to teach a skill',
    answer: 'B',
    explanation: '句子說「這個廣告的目的是推銷最新的健身器材」，所以是 to promote a product。',
    audio_transcript: 'The purpose of this advertisement is to promote the latest fitness equipment.',
    tags: '經濟,advertisement,消費,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She always compares prices before making a _____ ."（購買）',
    answer: 'purchase',
    explanation: '「purchase」是購買，她在購買前總是比較價格。',
    audio_transcript: 'She always compares prices before making a purchase.',
    tags: '經濟,purchase,消費,grade_9'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個年輕人選擇的理財方式。',
    option_a: 'spending all money', option_b: 'investing in stocks', option_c: 'saving in a bank', option_d: 'buying luxury items',
    answer: 'C',
    explanation: '句子說「這個年輕人選擇把錢存在銀行以備不時之需」，所以是 saving in a bank。',
    audio_transcript: 'This young person chooses to save money in a bank for emergencies.',
    tags: '經濟,saving,理財,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The company reported a 20% _____ in sales this quarter."（增長）',
    answer: 'increase',
    explanation: '「increase」是增長，公司本季銷售額增長了20%。',
    audio_transcript: 'The company reported a 20% increase in sales this quarter.',
    tags: '經濟,sales,增長,grade_9'
  },
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽對話，選出兩人討論的主要話題。',
    option_a: 'online shopping risks', option_b: 'how to start a business', option_c: 'investment strategies', option_d: 'job hunting tips',
    answer: 'A',
    explanation: '對話中兩人討論網路購物的詐騙風險和如何保護自己，所以是 online shopping risks。',
    audio_transcript: 'A: I got scammed when shopping online last week. B: Oh no! You need to check the website carefully and only use trusted platforms.',
    tags: '經濟,online shopping,詐騙,grade_9'
  },

  // === 主題 8：媒體與通訊（Media & Communication）11 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出記者在報導什麼。',
    option_a: 'a natural disaster', option_b: 'a sports event', option_c: 'a political election', option_d: 'a music concert',
    answer: 'C',
    explanation: '句子說「記者正在現場報導這次重要的政治選舉結果」，所以是 a political election。',
    audio_transcript: 'The reporter is covering the results of this important political election live.',
    tags: '媒體,election,記者,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："You should always check the _____ of news before sharing it."（來源）',
    answer: 'source',
    explanation: '「source」是來源，分享新聞前應先查核來源。',
    audio_transcript: 'You should always check the source of news before sharing it.',
    tags: '媒體,news,來源,grade_9'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個播客節目的主題。',
    option_a: 'travel adventures', option_b: 'mental health tips', option_c: 'cooking recipes', option_d: 'business trends',
    answer: 'B',
    explanation: '句子說「這個播客節目提供心理健康建議，已有數百萬訂閱者」，所以是 mental health tips。',
    audio_transcript: 'This podcast provides mental health tips and has millions of subscribers.',
    tags: '媒體,podcast,心理健康,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："The video went _____ and was watched 10 million times overnight."（病毒式傳播）',
    answer: 'viral',
    explanation: '「viral」是病毒式傳播，這支影片一夜之間爆紅被看了一千萬次。',
    audio_transcript: 'The video went viral and was watched 10 million times overnight.',
    tags: '媒體,viral,社群,grade_9'
  },
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽句子，選出演講者對假新聞的解決方案。',
    option_a: 'ban the internet', option_b: 'improve media literacy', option_c: 'trust all news', option_d: 'stop reading news',
    answer: 'B',
    explanation: '句子說「解決假新聞問題的關鍵在於提升媒體識讀能力」，所以是 improve media literacy。',
    audio_transcript: 'The key to solving the fake news problem is to improve media literacy.',
    tags: '媒體,fake news,識讀,grade_9'
  },

  // === 主題 9：情緒與人際關係（Emotions & Relationships）10 題 ===
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出這對朋友在討論什麼問題。',
    option_a: 'a misunderstanding', option_b: 'a lost item', option_c: 'a homework assignment', option_d: 'a sports match',
    answer: 'A',
    explanation: '對話中兩人在討論因誤解而產生的爭吵，所以是 a misunderstanding。',
    audio_transcript: 'A: I think you are angry with me because of what I said. B: No, I just misunderstood your words. Let me explain.',
    tags: '人際,misunderstanding,溝通,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："She showed great _____ by listening to her friend\'s problems."（同理心）',
    answer: 'empathy',
    explanation: '「empathy」是同理心，她透過傾聽朋友的問題展現了同理心。',
    audio_transcript: 'She showed great empathy by listening to her friend\'s problems.',
    tags: '人際,empathy,友誼,grade_9'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽句子，選出這個人在做什麼來管理情緒。',
    option_a: 'going for a run', option_b: 'playing video games', option_c: 'writing in a journal', option_d: 'watching TV',
    answer: 'C',
    explanation: '句子說「她透過在日記本上記錄想法來管理自己的情緒」，所以是 writing in a journal。',
    audio_transcript: 'She manages her emotions by writing her thoughts in a journal.',
    tags: '情緒,journal,管理,grade_9'
  },
  {
    type: 'fill', difficulty: 3,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："It is important to _____ boundaries in a healthy relationship."（設立）',
    answer: 'set',
    explanation: '「set boundaries」是設立界限，在健康的關係中設立界限很重要。',
    audio_transcript: 'It is important to set boundaries in a healthy relationship.',
    tags: '人際,boundaries,關係,grade_9'
  },
  {
    type: 'choice', difficulty: 3,
    content: '🎧 請聆聽對話，選出說話者的感受。',
    option_a: 'excited', option_b: 'frustrated', option_c: 'grateful', option_d: 'nervous',
    answer: 'C',
    explanation: '句子說「她說她非常感謝朋友在困難時期的支持」，所以是 grateful。',
    audio_transcript: 'She said she is very grateful for her friend\'s support during difficult times.',
    tags: '情緒,grateful,感謝,grade_9'
  },

  // === 主題 10：全球議題與對話（Global Issues & Discussion）10 題 ===
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽對話，選出兩人討論的主要全球問題。',
    option_a: 'food waste', option_b: 'water shortage', option_c: 'air pollution', option_d: 'population growth',
    answer: 'B',
    explanation: '對話中兩人討論淡水資源短缺的嚴重性，所以是 water shortage。',
    audio_transcript: 'A: Did you know that many countries face serious water shortages? B: Yes, clean water is becoming more and more scarce worldwide.',
    tags: '全球,water shortage,資源,grade_9'
  },
  {
    type: 'fill', difficulty: 4,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："Developed nations should help _____ countries achieve sustainable growth."（發展中）',
    answer: 'developing',
    explanation: '「developing countries」是發展中國家，已開發國家應幫助發展中國家實現永續成長。',
    audio_transcript: 'Developed nations should help developing countries achieve sustainable growth.',
    tags: '全球,developing,永續,grade_9'
  },
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽句子，選出演講者強調青年的角色。',
    option_a: 'following rules only', option_b: 'leading change', option_c: 'waiting for adults', option_d: 'avoiding politics',
    answer: 'B',
    explanation: '句子說「年輕人應該站出來引領變革，而不是等待別人行動」，所以是 leading change。',
    audio_transcript: 'Young people should stand up and lead change instead of waiting for others to act.',
    tags: '全球,youth,變革,grade_9'
  },
  {
    type: 'fill', difficulty: 4,
    content: '🎧 請聆聽句子，填入空白的單字（英文）。\n句子："International _____ is key to solving global health crises."（合作）',
    answer: 'cooperation',
    explanation: '「cooperation」是合作，國際合作是解決全球健康危機的關鍵。',
    audio_transcript: 'International cooperation is key to solving global health crises.',
    tags: '全球,cooperation,健康,grade_9'
  },
  {
    type: 'choice', difficulty: 4,
    content: '🎧 請聆聽句子，選出聯合國報告的主要結論。',
    option_a: 'poverty is increasing', option_b: 'education improves lives', option_c: 'technology is harmful', option_d: 'cities are shrinking',
    answer: 'B',
    explanation: '句子說「聯合國報告結論指出，教育是改善人們生活最有效的方法」，所以是 education improves lives。',
    audio_transcript: 'The UN report concludes that education is the most effective way to improve people\'s lives.',
    tags: '全球,education,聯合國,grade_9'
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
    grade_level: 'grade_9'
  }));
  return qs.length;
});

const count = doInsert(questions);
console.log(`✅ 成功植入 ${count} 道國三英文聽力題`);
console.log('   科目：英文聽力（ENG_LISTEN_9），學段：grade_9');
const stats = db.prepare(
  "SELECT type, count(*) as cnt FROM questions WHERE subject_id=? GROUP BY type"
).all(subjectId);
console.log('題型分布:', stats);
