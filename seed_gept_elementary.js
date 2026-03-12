'use strict';
/**
 * 全民英檢初級（GEPT Elementary）— 各科 20 題
 * 科目：聽力(GEPT_LISTEN) / 閱讀(GEPT_READ) / 寫作(GEPT_WRITE) / 口說(GEPT_SPEAK)
 * 學段：gept_elementary
 */
const db = require('./database');

const getSubjectId = code => db.prepare("SELECT id FROM subjects WHERE code=?").get(code).id;

const ids = {
  LISTEN: getSubjectId('GEPT_LISTEN'),
  READ:   getSubjectId('GEPT_READ'),
  WRITE:  getSubjectId('GEPT_WRITE'),
  SPEAK:  getSubjectId('GEPT_SPEAK'),
};

// ─────────────────────────────────────────────────────────
// 聽力 GEPT_LISTEN 20 題（看圖辨義7 + 問答7 + 對話6）
// ─────────────────────────────────────────────────────────
const listenQs = [
  // 看圖辨義
  { type:'choice', difficulty:2, content:'🎧【看圖辨義】請聆聽題目，選出與圖片描述相符的答案。\n（圖片：一個女孩在公園裡騎腳踏車）', option_a:'A girl is riding a bike in the park.', option_b:'A boy is swimming in the pool.', option_c:'A woman is cooking in the kitchen.', option_d:'A man is reading a book.', answer:'A', explanation:'圖片顯示女孩在公園騎腳踏車，符合選項 A。', audio_transcript:'Look at the picture. What is the girl doing?', tags:'GEPT,聽力,看圖辨義', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【看圖辨義】請聆聽題目，選出與圖片描述相符的答案。\n（圖片：一家人在餐廳吃晚餐）', option_a:'People are playing sports outdoors.', option_b:'A family is having dinner at a restaurant.', option_c:'Students are studying in a library.', option_d:'Workers are building a house.', answer:'B', explanation:'圖片顯示一家人在餐廳吃晚餐，符合選項 B。', audio_transcript:'Look at the picture. What are the people doing?', tags:'GEPT,聽力,看圖辨義', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【看圖辨義】請聆聽題目，選出與圖片描述相符的答案。\n（圖片：一名男子在超市結帳）', option_a:'A man is paying at the supermarket checkout.', option_b:'A woman is shopping for clothes.', option_c:'A child is playing with toys.', option_d:'A doctor is examining a patient.', answer:'A', explanation:'圖片顯示男子在超市結帳台付款，符合選項 A。', audio_transcript:'Look at the picture. What is the man doing?', tags:'GEPT,聽力,看圖辨義', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【看圖辨義】請聆聽題目，選出與圖片描述相符的答案。\n（圖片：下雨天，一個人撐著雨傘走在街上）', option_a:'It is sunny and people are having a picnic.', option_b:'A person is walking in the rain with an umbrella.', option_c:'Children are playing in the snow.', option_d:'People are sunbathing on the beach.', answer:'B', explanation:'圖片顯示雨天有人撐傘走路，符合選項 B。', audio_transcript:'Look at the picture. What is the weather like?', tags:'GEPT,聽力,看圖辨義', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【看圖辨義】請聆聽題目，選出與圖片描述相符的答案。\n（圖片：圖書館裡，學生們安靜地閱讀）', option_a:'Students are talking loudly in the hallway.', option_b:'People are dancing at a party.', option_c:'Students are reading quietly in the library.', option_d:'Teachers are writing on the blackboard.', answer:'C', explanation:'圖片顯示學生在圖書館安靜閱讀，符合選項 C。', audio_transcript:'Look at the picture. Where are the students and what are they doing?', tags:'GEPT,聽力,看圖辨義', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【看圖辨義】請聆聽題目，選出與圖片描述相符的答案。\n（圖片：一位老奶奶在澆花）', option_a:'An old woman is watering the flowers.', option_b:'A young man is cutting the grass.', option_c:'A girl is picking apples.', option_d:'A boy is planting vegetables.', answer:'A', explanation:'圖片顯示老奶奶在澆花，符合選項 A。', audio_transcript:'Look at the picture. What is the old woman doing?', tags:'GEPT,聽力,看圖辨義', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【看圖辨義】請聆聽題目，選出與圖片描述相符的答案。\n（圖片：兩個朋友在咖啡廳聊天喝咖啡）', option_a:'Two friends are chatting in a cafe.', option_b:'A man is working at his desk.', option_c:'Students are eating lunch in the school cafeteria.', option_d:'A family is watching TV at home.', answer:'A', explanation:'圖片顯示兩個朋友在咖啡廳喝咖啡聊天，符合選項 A。', audio_transcript:'Look at the picture. What are the two friends doing?', tags:'GEPT,聽力,看圖辨義', grade_level:'gept_elementary' },

  // 問答
  { type:'choice', difficulty:2, content:'🎧【問答】請聆聽問句，選出最適當的回答。\n問句："What time do you usually wake up?"', option_a:'I wake up at seven o\'clock.', option_b:'I live near the school.', option_c:'My favorite color is blue.', option_d:'I had noodles for lunch.', answer:'A', explanation:'被問到幾點起床，應回答時間，所以是 I wake up at seven o\'clock。', audio_transcript:'What time do you usually wake up?', tags:'GEPT,聽力,問答', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【問答】請聆聽問句，選出最適當的回答。\n問句："How many brothers and sisters do you have?"', option_a:'I have one brother and two sisters.', option_b:'My birthday is in March.', option_c:'I like playing basketball.', option_d:'School starts at 8 AM.', answer:'A', explanation:'被問到有幾個兄弟姊妹，應回答人數，所以是 I have one brother and two sisters。', audio_transcript:'How many brothers and sisters do you have?', tags:'GEPT,聽力,問答', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【問答】請聆聽問句，選出最適當的回答。\n問句："Where is the nearest post office?"', option_a:'It is on Main Street, next to the bank.', option_b:'It opens at nine in the morning.', option_c:'You need to buy a stamp.', option_d:'The letter arrived yesterday.', answer:'A', explanation:'被問到郵局在哪裡，應回答地點，所以是 It is on Main Street, next to the bank。', audio_transcript:'Where is the nearest post office?', tags:'GEPT,聽力,問答', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【問答】請聆聽問句，選出最適當的回答。\n問句："Did you enjoy the movie last night?"', option_a:'Yes, it was really exciting!', option_b:'I usually go to bed at ten.', option_c:'The cinema is downtown.', option_d:'Tickets cost 250 dollars.', answer:'A', explanation:'被問到電影好不好看，應回答感想，所以是 Yes, it was really exciting!', audio_transcript:'Did you enjoy the movie last night?', tags:'GEPT,聽力,問答', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【問答】請聆聽問句，選出最適當的回答。\n問句："What is the weather like today?"', option_a:'It is warm and sunny.', option_b:'I prefer summer to winter.', option_c:'Let\'s take an umbrella.', option_d:'The forecast was wrong.', answer:'A', explanation:'被問到今天天氣如何，應直接描述天氣，所以是 It is warm and sunny。', audio_transcript:'What is the weather like today?', tags:'GEPT,聽力,問答', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【問答】請聆聽問句，選出最適當的回答。\n問句："Can you help me with my English homework?"', option_a:'Sure, I\'d be happy to help.', option_b:'English is my favorite subject.', option_c:'The homework is due tomorrow.', option_d:'I finished my homework already.', answer:'A', explanation:'被請求幫忙時，最合適的正面回應是 Sure, I\'d be happy to help。', audio_transcript:'Can you help me with my English homework?', tags:'GEPT,聽力,問答', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【問答】請聆聽問句，選出最適當的回答。\n問句："How much does this T-shirt cost?"', option_a:'It costs 350 dollars.', option_b:'I bought it last week.', option_c:'The color is light blue.', option_d:'It looks great on you.', answer:'A', explanation:'被問到價格，應回答金額，所以是 It costs 350 dollars。', audio_transcript:'How much does this T-shirt cost?', tags:'GEPT,聽力,問答', grade_level:'gept_elementary' },

  // 對話
  { type:'choice', difficulty:2, content:'🎧【對話】請聆聽對話，選出這個人要去哪裡。', option_a:'the train station', option_b:'the airport', option_c:'the bus terminal', option_d:'the taxi stand', answer:'B', explanation:'對話中他說「我明天要搭飛機去日本，所以要去機場」，所以是 the airport。', audio_transcript:'A: Where are you going with that big suitcase? B: I\'m going to the airport. I\'m flying to Japan tomorrow!', tags:'GEPT,聽力,對話', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【對話】請聆聽對話，選出兩人在討論什麼。', option_a:'weekend plans', option_b:'homework assignments', option_c:'sports results', option_d:'travel memories', answer:'A', explanation:'對話中兩人在討論週末要去哪裡玩，所以是 weekend plans。', audio_transcript:'A: What are you doing this weekend? B: I\'m thinking of going hiking. Want to join me? A: That sounds great!', tags:'GEPT,聽力,對話', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【對話】請聆聽對話，選出這個女生的問題是什麼。', option_a:'She cannot find her keys.', option_b:'She missed the bus.', option_c:'She forgot her homework.', option_d:'She lost her phone.', answer:'C', explanation:'對話中她說「我把作業忘在家裡了，怎麼辦？」，所以是 She forgot her homework。', audio_transcript:'A: What\'s wrong? You look worried. B: I left my homework at home! What should I do? A: You should call your mom and ask her to bring it.', tags:'GEPT,聽力,對話', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【對話】請聆聽對話，選出他們最後決定點什麼飲料。', option_a:'orange juice', option_b:'green tea', option_c:'lemonade', option_d:'milk tea', answer:'D', explanation:'對話中他們最後決定點珍珠奶茶，所以是 milk tea。', audio_transcript:'A: What would you like to drink? B: How about lemonade? A: I\'d prefer milk tea. Let\'s both get milk tea! B: OK, sounds good.', tags:'GEPT,聽力,對話', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【對話】請聆聽對話，選出這個男孩為什麼很高興。', option_a:'He got a new pet.', option_b:'He passed his exam.', option_c:'He won a game.', option_d:'He received a gift.', answer:'B', explanation:'對話中他說「我英文考試考了90分，真的很開心」，所以是 He passed his exam。', audio_transcript:'A: Why are you so happy today? B: I got 90 points on my English test! I studied so hard for it. A: Congratulations!', tags:'GEPT,聽力,對話', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'🎧【對話】請聆聽對話，選出他們約好在哪裡見面。', option_a:'at the school gate', option_b:'at the MRT station', option_c:'at the coffee shop', option_d:'at the bookstore', answer:'C', explanation:'對話中他們約好在咖啡廳見面，所以是 at the coffee shop。', audio_transcript:'A: Where should we meet on Saturday? B: How about the coffee shop near the park? A: Perfect, I know the place. See you at 2 PM!', tags:'GEPT,聽力,對話', grade_level:'gept_elementary' },
];

// ─────────────────────────────────────────────────────────
// 閱讀 GEPT_READ 20 題（詞彙8 + 段落填空6 + 閱讀理解6）
// ─────────────────────────────────────────────────────────
const readQs = [
  // 詞彙
  { type:'choice', difficulty:2, content:'【詞彙】Choose the best word to complete the sentence.\n"She _____ her teeth every morning and night."', option_a:'combs', option_b:'brushes', option_c:'washes', option_d:'cuts', answer:'B', explanation:'「brush teeth」是刷牙，每天早晚刷牙用 brushes。', audio_transcript:'', tags:'GEPT,閱讀,詞彙', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'【詞彙】Choose the best word to complete the sentence.\n"He was _____ because he had not slept well the night before."', option_a:'excited', option_b:'tired', option_c:'happy', option_d:'hungry', answer:'B', explanation:'「tired」是疲倦，因為前晚睡不好所以很累。', audio_transcript:'', tags:'GEPT,閱讀,詞彙', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'【詞彙】Choose the best word to complete the sentence.\n"Please _____ the door when you leave the room."', option_a:'open', option_b:'break', option_c:'close', option_d:'paint', answer:'C', explanation:'「close the door」是關門，離開房間時請關門。', audio_transcript:'', tags:'GEPT,閱讀,詞彙', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'【詞彙】Choose the best word to complete the sentence.\n"The weather is very _____ today. You should wear a coat."', option_a:'hot', option_b:'cloudy', option_c:'cold', option_d:'sunny', answer:'C', explanation:'「cold」是冷，天氣很冷所以要穿外套。', audio_transcript:'', tags:'GEPT,閱讀,詞彙', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'【詞彙】Choose the best word to complete the sentence.\n"Tom is a very _____ student. He always finishes his work on time."', option_a:'lazy', option_b:'noisy', option_c:'responsible', option_d:'careless', answer:'C', explanation:'「responsible」是負責任的，他總是準時完成作業，所以很負責任。', audio_transcript:'', tags:'GEPT,閱讀,詞彙', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'【詞彙】Choose the best word to complete the sentence.\n"My grandmother lives in the _____ , far away from the city."', option_a:'downtown', option_b:'countryside', option_c:'factory', option_d:'office', answer:'B', explanation:'「countryside」是鄉村，祖母住在遠離城市的鄉村。', audio_transcript:'', tags:'GEPT,閱讀,詞彙', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'【詞彙】Choose the best word to complete the sentence.\n"Can I _____ your pen? I forgot mine."', option_a:'sell', option_b:'buy', option_c:'borrow', option_d:'throw', answer:'C', explanation:'「borrow」是借（物品），向別人借筆用 borrow。', audio_transcript:'', tags:'GEPT,閱讀,詞彙', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'【詞彙】Choose the best word to complete the sentence.\n"The store is _____ on Sundays. You cannot buy anything there."', option_a:'open', option_b:'busy', option_c:'closed', option_d:'new', answer:'C', explanation:'「closed」是關閉的，商店週日不營業。', audio_transcript:'', tags:'GEPT,閱讀,詞彙', grade_level:'gept_elementary' },

  // 段落填空
  { type:'choice', difficulty:2, content:'【段落填空】Read the passage and choose the best answer.\n"My name is Jenny. I am a middle school student. Every day, I go to school _____ bus. It takes about 20 minutes."', option_a:'with', option_b:'on', option_c:'by', option_d:'at', answer:'C', explanation:'「by bus」是搭公車，交通方式用介系詞 by。', audio_transcript:'', tags:'GEPT,閱讀,段落填空', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'【段落填空】Read the passage and choose the best answer.\n"My family loves to travel. Last summer, we _____ to Japan. We visited many famous places."', option_a:'go', option_b:'goes', option_c:'went', option_d:'going', answer:'C', explanation:'「went」是 go 的過去式，描述去年夏天發生的事要用過去式。', audio_transcript:'', tags:'GEPT,閱讀,段落填空', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'【段落填空】Read the passage and choose the best answer.\n"Kevin likes playing basketball. He practices _____ day after school with his teammates."', option_a:'each', option_b:'some', option_c:'many', option_d:'few', answer:'A', explanation:'「each day」是每天，Kevin 每天練習籃球。', audio_transcript:'', tags:'GEPT,閱讀,段落填空', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'【段落填空】Read the passage and choose the best answer.\n"Lisa is a great cook. She learned _____ cook from her mother when she was young."', option_a:'how to', option_b:'what to', option_c:'where to', option_d:'who to', answer:'A', explanation:'「learn how to cook」是學習如何烹飪，使用 how to。', audio_transcript:'', tags:'GEPT,閱讀,段落填空', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'【段落填空】Read the passage and choose the best answer.\n"I have two pets — a cat _____ a dog. They are very friendly with each other."', option_a:'but', option_b:'or', option_c:'and', option_d:'so', answer:'C', explanation:'「a cat and a dog」是一隻貓和一隻狗，用 and 連接兩個名詞。', audio_transcript:'', tags:'GEPT,閱讀,段落填空', grade_level:'gept_elementary' },
  { type:'choice', difficulty:2, content:'【段落填空】Read the passage and choose the best answer.\n"Yesterday, I _____ so tired that I fell asleep as soon as I got home."', option_a:'am', option_b:'was', option_c:'is', option_d:'were', answer:'B', explanation:'「was」是 be 動詞的過去式單數形，描述昨天的狀態。', audio_transcript:'', tags:'GEPT,閱讀,段落填空', grade_level:'gept_elementary' },

  // 閱讀理解
  { type:'choice', difficulty:3, content:'【閱讀理解】Read the notice and answer the question.\n\n"LOST AND FOUND: A black backpack was found near the school gate on Monday. It contains textbooks and a water bottle. Please contact the school office to claim it."\n\nQuestion: Where was the backpack found?', option_a:'In the classroom', option_b:'At the school gate', option_c:'In the library', option_d:'Near the cafeteria', answer:'B', explanation:'公告說背包在學校大門附近被找到（near the school gate）。', audio_transcript:'', tags:'GEPT,閱讀,閱讀理解', grade_level:'gept_elementary' },
  { type:'choice', difficulty:3, content:'【閱讀理解】Read the email and answer the question.\n\n"Hi Anna,\nAre you free this Saturday? I want to go to the new shopping mall. They say it has great food and many stores. Let\'s meet at 2 PM at the MRT station.\nYour friend, Mary"\n\nQuestion: What does Mary want to do on Saturday?', option_a:'Study at the library', option_b:'Go to the shopping mall', option_c:'Visit a museum', option_d:'Watch a movie', answer:'B', explanation:'Mary 在信中說她想週六去新購物中心，所以是 go to the shopping mall。', audio_transcript:'', tags:'GEPT,閱讀,閱讀理解', grade_level:'gept_elementary' },
  { type:'choice', difficulty:3, content:'【閱讀理解】Read the advertisement and answer the question.\n\n"SPRING SALE — Buy 2, Get 1 Free!\nAll books are on sale this week only.\nCome to City Bookstore before Sunday!"\n\nQuestion: What is special about the sale?', option_a:'All books cost 10 dollars', option_b:'Buy two books and get one free', option_c:'Books are free on Sunday', option_d:'Every book is half price', answer:'B', explanation:'廣告說「買二送一」（Buy 2, Get 1 Free），所以是 buy two books and get one free。', audio_transcript:'', tags:'GEPT,閱讀,閱讀理解', grade_level:'gept_elementary' },
  { type:'choice', difficulty:3, content:'【閱讀理解】Read the passage and answer the question.\n\n"Amy loves animals. She has three pets: two cats and one dog. Every morning, she feeds them before going to school. On weekends, she takes her dog to the park."\n\nQuestion: How many pets does Amy have?', option_a:'One', option_b:'Two', option_c:'Three', option_d:'Four', answer:'C', explanation:'文章說 Amy 有三隻寵物：兩隻貓和一隻狗，共三隻。', audio_transcript:'', tags:'GEPT,閱讀,閱讀理解', grade_level:'gept_elementary' },
  { type:'choice', difficulty:3, content:'【閱讀理解】Read the schedule and answer the question.\n\n"School Holiday Schedule:\nMonday — Math, English, Art\nTuesday — Science, PE, Music\nWednesday — Math, History, English"\n\nQuestion: On which day does the student have PE?', option_a:'Monday', option_b:'Tuesday', option_c:'Wednesday', option_d:'Every day', answer:'B', explanation:'課表顯示體育（PE）課在週二，所以答案是 Tuesday。', audio_transcript:'', tags:'GEPT,閱讀,閱讀理解', grade_level:'gept_elementary' },
  { type:'choice', difficulty:3, content:'【閱讀理解】Read the passage and answer the question.\n\n"David is a firefighter. He works 24 hours and then rests for 48 hours. His job is dangerous, but he loves helping people. He says it is the most meaningful job in the world."\n\nQuestion: Why does David love his job?', option_a:'He earns a lot of money', option_b:'He likes the uniform', option_c:'He loves helping people', option_d:'He gets long holidays', answer:'C', explanation:'文章說 David 喜歡他的工作是因為他愛幫助別人（he loves helping people）。', audio_transcript:'', tags:'GEPT,閱讀,閱讀理解', grade_level:'gept_elementary' },
];

// ─────────────────────────────────────────────────────────
// 寫作 GEPT_WRITE 20 題（改寫7 + 合併7 + 翻譯6）
// ─────────────────────────────────────────────────────────
const writeQs = [
  // 單句寫作：改寫
  { type:'fill', difficulty:3, content:'【單句寫作：改寫】將下列句子改為否定句。\n原句："She likes coffee."\n改寫（填入完整改寫句）：', answer:'She does not like coffee.', explanation:'一般現在式否定句：主詞 + does not + 動詞原形。', audio_transcript:'', tags:'GEPT,寫作,改寫', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【單句寫作：改寫】將下列句子改為疑問句。\n原句："They are playing basketball."\n改寫（填入完整改寫句）：', answer:'Are they playing basketball?', explanation:'be 動詞疑問句：將 be 動詞（are）移至句首。', audio_transcript:'', tags:'GEPT,寫作,改寫', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【單句寫作：改寫】將下列主動句改為被動句。\n原句："Tom cleaned the room."\n改寫（填入完整改寫句）：', answer:'The room was cleaned by Tom.', explanation:'被動句：受詞 + was/were + 過去分詞 + by + 主詞。', audio_transcript:'', tags:'GEPT,寫作,改寫', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【單句寫作：改寫】將下列句子改寫，使用 "so...that"。\n原句："The bag was very heavy. She could not carry it."\n改寫（填入完整改寫句）：', answer:'The bag was so heavy that she could not carry it.', explanation:'「so...that」句型：so + 形容詞 + that + 結果子句。', audio_transcript:'', tags:'GEPT,寫作,改寫', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【單句寫作：改寫】將下列句子改為過去式。\n原句："I eat lunch at school every day."\n改寫（填入完整改寫句）：', answer:'I ate lunch at school every day.', explanation:'eat 的過去式是 ate，改為過去式敘述。', audio_transcript:'', tags:'GEPT,寫作,改寫', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【單句寫作：改寫】將下列句子改寫，使用比較級。\n原句："Mary is tall. Jenny is taller."\n改寫（填入完整改寫句，使用 taller than）：', answer:'Jenny is taller than Mary.', explanation:'比較級：主詞 + be動詞 + 形容詞比較級 + than + 比較對象。', audio_transcript:'', tags:'GEPT,寫作,改寫', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【單句寫作：改寫】將下列句子改為未來式（will）。\n原句："She goes to the library."\n改寫（填入完整改寫句）：', answer:'She will go to the library.', explanation:'未來式：主詞 + will + 動詞原形。', audio_transcript:'', tags:'GEPT,寫作,改寫', grade_level:'gept_elementary' },

  // 單句寫作：合併
  { type:'fill', difficulty:3, content:'【單句寫作：合併】將下列兩句合併為一句（使用 because）。\n句1："He was late." 句2："He missed the bus."\n合併（填入完整合併句）：', answer:'He was late because he missed the bus.', explanation:'使用 because 連接原因子句：He was late because he missed the bus.', audio_transcript:'', tags:'GEPT,寫作,合併', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【單句寫作：合併】將下列兩句合併為一句（使用 but）。\n句1："I like math." 句2："I don\'t like history."\n合併（填入完整合併句）：', answer:'I like math but I don\'t like history.', explanation:'使用 but 連接對比子句：I like math but I don\'t like history.', audio_transcript:'', tags:'GEPT,寫作,合併', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【單句寫作：合併】將下列兩句合併為一句（使用 which）。\n句1："I have a dog." 句2："The dog is very friendly."\n合併（填入完整合併句）：', answer:'I have a dog which is very friendly.', explanation:'使用關係代名詞 which 修飾前面的名詞 dog。', audio_transcript:'', tags:'GEPT,寫作,合併', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【單句寫作：合併】將下列兩句合併為一句（使用 when）。\n句1："She heard the news." 句2："She started crying."\n合併（填入完整合併句）：', answer:'When she heard the news, she started crying.', explanation:'使用 when 連接時間子句：When she heard the news, she started crying.', audio_transcript:'', tags:'GEPT,寫作,合併', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【單句寫作：合併】將下列兩句合併為一句（使用 and）。\n句1："He likes swimming." 句2："He likes running."\n合併（填入完整合併句）：', answer:'He likes swimming and running.', explanation:'使用 and 連接並列動名詞：He likes swimming and running.', audio_transcript:'', tags:'GEPT,寫作,合併', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【單句寫作：合併】將下列兩句合併為一句（使用 if）。\n句1："It rains tomorrow." 句2："We will stay home."\n合併（填入完整合併句）：', answer:'If it rains tomorrow, we will stay home.', explanation:'使用 if 連接條件子句：If it rains tomorrow, we will stay home.', audio_transcript:'', tags:'GEPT,寫作,合併', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【單句寫作：合併】將下列兩句合併為一句（使用 so）。\n句1："She studied hard." 句2："She passed the exam."\n合併（填入完整合併句）：', answer:'She studied hard, so she passed the exam.', explanation:'使用 so 表示結果：She studied hard, so she passed the exam.', audio_transcript:'', tags:'GEPT,寫作,合併', grade_level:'gept_elementary' },

  // 翻譯
  { type:'fill', difficulty:3, content:'【翻譯】將下列中文翻譯成英文。\n"我每天早上七點起床。"', answer:'I wake up at seven o\'clock every morning.', explanation:'I wake up at + 時間 + every morning. 描述每日習慣用一般現在式。', audio_transcript:'', tags:'GEPT,寫作,翻譯', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【翻譯】將下列中文翻譯成英文。\n"她昨天去了圖書館借書。"', answer:'She went to the library to borrow books yesterday.', explanation:'過去式 went to，目的用 to borrow，時間副詞 yesterday 放句尾。', audio_transcript:'', tags:'GEPT,寫作,翻譯', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【翻譯】將下列中文翻譯成英文。\n"這道菜太辣了，我吃不了。"', answer:'This dish is too spicy for me to eat.', explanation:'「too...to」句型：too + 形容詞 + for + 人 + to + 動詞。', audio_transcript:'', tags:'GEPT,寫作,翻譯', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【翻譯】將下列中文翻譯成英文。\n"你能告訴我最近的捷運站在哪裡嗎？"', answer:'Can you tell me where the nearest MRT station is?', explanation:'間接問句：Can you tell me + where + 主詞 + be動詞（疑問詞引導名詞子句不倒裝）。', audio_transcript:'', tags:'GEPT,寫作,翻譯', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【翻譯】將下列中文翻譯成英文。\n"他們正在公園裡踢足球。"', answer:'They are playing soccer in the park.', explanation:'現在進行式：主詞 + be動詞 + 動詞ing。play soccer 是踢足球。', audio_transcript:'', tags:'GEPT,寫作,翻譯', grade_level:'gept_elementary' },
  { type:'fill', difficulty:3, content:'【翻譯】將下列中文翻譯成英文。\n"這是我看過最有趣的電影。"', answer:'This is the most interesting movie I have ever seen.', explanation:'最高級 + I have ever + 過去分詞：This is the most interesting movie I have ever seen.', audio_transcript:'', tags:'GEPT,寫作,翻譯', grade_level:'gept_elementary' },
];

// ─────────────────────────────────────────────────────────
// 口說 GEPT_SPEAK 20 題（複誦7 + 朗讀7 + 回答問題6）
// ─────────────────────────────────────────────────────────
const speakQs = [
  // 複誦
  { type:'fill', difficulty:2, content:'🎧【複誦】請聆聽並複誦下列句子（填入聽到的完整句子）。\n（請在作答欄位填入你複誦的句子）', answer:'I usually have breakfast before I go to school.', explanation:'複誦句子：I usually have breakfast before I go to school. 描述日常習慣。', audio_transcript:'I usually have breakfast before I go to school.', tags:'GEPT,口說,複誦', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【複誦】請聆聽並複誦下列句子（填入聽到的完整句子）。\n（請在作答欄位填入你複誦的句子）', answer:'The library opens at nine o\'clock every morning.', explanation:'複誦句子：The library opens at nine o\'clock every morning. 描述規律事實。', audio_transcript:'The library opens at nine o\'clock every morning.', tags:'GEPT,口說,複誦', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【複誦】請聆聽並複誦下列句子（填入聽到的完整句子）。\n（請在作答欄位填入你複誦的句子）', answer:'My father is a teacher and my mother is a nurse.', explanation:'複誦句子：My father is a teacher and my mother is a nurse. 介紹家庭。', audio_transcript:'My father is a teacher and my mother is a nurse.', tags:'GEPT,口說,複誦', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【複誦】請聆聽並複誦下列句子（填入聽到的完整句子）。\n（請在作答欄位填入你複誦的句子）', answer:'We need to protect the environment for future generations.', explanation:'複誦句子：We need to protect the environment for future generations. 關於環保的主張。', audio_transcript:'We need to protect the environment for future generations.', tags:'GEPT,口說,複誦', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【複誦】請聆聽並複誦下列句子（填入聽到的完整句子）。\n（請在作答欄位填入你複誦的句子）', answer:'Could you please turn off the lights when you leave the room?', explanation:'複誦句子：Could you please turn off the lights when you leave the room? 禮貌請求。', audio_transcript:'Could you please turn off the lights when you leave the room?', tags:'GEPT,口說,複誦', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【複誦】請聆聽並複誦下列句子（填入聽到的完整句子）。\n（請在作答欄位填入你複誦的句子）', answer:'She has been learning English for three years.', explanation:'複誦句子：She has been learning English for three years. 現在完成進行式。', audio_transcript:'She has been learning English for three years.', tags:'GEPT,口說,複誦', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【複誦】請聆聽並複誦下列句子（填入聽到的完整句子）。\n（請在作答欄位填入你複誦的句子）', answer:'The train to Kaohsiung will depart in ten minutes from Platform 2.', explanation:'複誦句子：The train to Kaohsiung will depart in ten minutes from Platform 2. 廣播風格句子。', audio_transcript:'The train to Kaohsiung will depart in ten minutes from Platform 2.', tags:'GEPT,口說,複誦', grade_level:'gept_elementary' },

  // 朗讀
  { type:'fill', difficulty:2, content:'🎧【朗讀句子】請朗讀下列句子（填入朗讀的完整句子）。\n"Good morning! My name is Kevin and I am happy to meet you."', answer:'Good morning! My name is Kevin and I am happy to meet you.', explanation:'朗讀問候語，注意語調和發音。', audio_transcript:'Good morning! My name is Kevin and I am happy to meet you.', tags:'GEPT,口說,朗讀', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【朗讀句子】請朗讀下列句子（填入朗讀的完整句子）。\n"Excuse me, can you tell me how to get to the train station?"', answer:'Excuse me, can you tell me how to get to the train station?', explanation:'朗讀問路句子，注意語調。', audio_transcript:'Excuse me, can you tell me how to get to the train station?', tags:'GEPT,口說,朗讀', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【朗讀短文】請朗讀下列短文（填入朗讀的完整短文）。\n"Taiwan is a beautiful island. It has high mountains, blue oceans, and delicious food. Many tourists from around the world come to visit every year."', answer:'Taiwan is a beautiful island. It has high mountains, blue oceans, and delicious food. Many tourists from around the world come to visit every year.', explanation:'朗讀介紹台灣的短文，注意停頓和語調。', audio_transcript:'Taiwan is a beautiful island. It has high mountains, blue oceans, and delicious food. Many tourists from around the world come to visit every year.', tags:'GEPT,口說,朗讀', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【朗讀句子】請朗讀下列句子（填入朗讀的完整句子）。\n"I would like to order a cup of hot coffee and a sandwich, please."', answer:'I would like to order a cup of hot coffee and a sandwich, please.', explanation:'朗讀點餐句子，注意語調和禮貌語氣。', audio_transcript:'I would like to order a cup of hot coffee and a sandwich, please.', tags:'GEPT,口說,朗讀', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【朗讀短文】請朗讀下列短文（填入朗讀的完整短文）。\n"Reading is a great hobby. It helps you learn new things and improves your vocabulary. Try to read for at least 30 minutes every day."', answer:'Reading is a great hobby. It helps you learn new things and improves your vocabulary. Try to read for at least 30 minutes every day.', explanation:'朗讀鼓勵閱讀的短文，注意段落語氣。', audio_transcript:'Reading is a great hobby. It helps you learn new things and improves your vocabulary. Try to read for at least 30 minutes every day.', tags:'GEPT,口說,朗讀', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【朗讀句子】請朗讀下列句子（填入朗讀的完整句子）。\n"If you feel sick, you should see a doctor and get some rest."', answer:'If you feel sick, you should see a doctor and get some rest.', explanation:'朗讀建議句，注意 if 子句的語調。', audio_transcript:'If you feel sick, you should see a doctor and get some rest.', tags:'GEPT,口說,朗讀', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【朗讀句子】請朗讀下列句子（填入朗讀的完整句子）。\n"Protecting the environment is everyone\'s responsibility."', answer:'Protecting the environment is everyone\'s responsibility.', explanation:'朗讀環保主題句子，注意重音字的強調。', audio_transcript:'Protecting the environment is everyone\'s responsibility.', tags:'GEPT,口說,朗讀', grade_level:'gept_elementary' },

  // 回答問題
  { type:'fill', difficulty:2, content:'🎧【回答問題】請聆聽問題並回答（以英文填入回答）。\n問題："What is your name and where are you from?"（填入你的英文回答）', answer:'My name is [your name] and I am from Taiwan.', explanation:'回答自我介紹問題：My name is... and I am from...', audio_transcript:'What is your name and where are you from?', tags:'GEPT,口說,回答問題', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【回答問題】請聆聽問題並回答（以英文填入回答）。\n問題："What do you like to do on weekends?"（填入你的英文回答）', answer:'I like to go hiking and watch movies on weekends.', explanation:'回答週末活動：I like to + 動詞/動詞片語，列舉兩項活動。', audio_transcript:'What do you like to do on weekends?', tags:'GEPT,口說,回答問題', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【回答問題】請聆聽問題並回答（以英文填入回答）。\n問題："Describe your best friend."（填入你的英文回答）', answer:'My best friend is kind and funny. She always helps me when I have problems.', explanation:'描述好朋友：形容詞 + 具體行為描述，使用一般現在式。', audio_transcript:'Describe your best friend.', tags:'GEPT,口說,回答問題', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【回答問題】請聆聽問題並回答（以英文填入回答）。\n問題："What would you do if you found a lost wallet?"（填入你的英文回答）', answer:'If I found a lost wallet, I would turn it in to the police station.', explanation:'假設條件句回答：If I found..., I would...，描述應對方式。', audio_transcript:'What would you do if you found a lost wallet?', tags:'GEPT,口說,回答問題', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【回答問題】請聆聽問題並回答（以英文填入回答）。\n問題："What is your favorite food and why?"（填入你的英文回答）', answer:'My favorite food is sushi because it is fresh and delicious.', explanation:'回答喜好：My favorite... is... because + 原因，解釋喜歡的理由。', audio_transcript:'What is your favorite food and why?', tags:'GEPT,口說,回答問題', grade_level:'gept_elementary' },
  { type:'fill', difficulty:2, content:'🎧【回答問題】請聆聽問題並回答（以英文填入回答）。\n問題："How do you usually get to school?"（填入你的英文回答）', answer:'I usually take the bus to school. It takes about 20 minutes.', explanation:'回答交通方式：I usually take the + 交通工具 + to school，加上所需時間更完整。', audio_transcript:'How do you usually get to school?', tags:'GEPT,口說,回答問題', grade_level:'gept_elementary' },
];

// 插入所有題目
const ins = db.prepare(`INSERT INTO questions
  (subject_id, type, difficulty, content, option_a, option_b, option_c, option_d,
   answer, explanation, audio_transcript, tags, grade_level)
  VALUES (@subject_id, @type, @difficulty, @content, @option_a, @option_b, @option_c, @option_d,
   @answer, @explanation, @audio_transcript, @tags, @grade_level)`);

const insertBatch = (subjectId, qs, label) => {
  const doInsert = db.transaction(arr => {
    arr.forEach(q => ins.run({
      subject_id: subjectId,
      type: q.type, difficulty: q.difficulty,
      content: q.content,
      option_a: q.option_a || null, option_b: q.option_b || null,
      option_c: q.option_c || null, option_d: q.option_d || null,
      answer: q.answer, explanation: q.explanation || '',
      audio_transcript: q.audio_transcript || '',
      tags: q.tags || '', grade_level: q.grade_level
    }));
    return arr.length;
  });
  const n = doInsert(qs);
  const total = db.prepare('SELECT count(*) as c FROM questions WHERE subject_id=?').get(subjectId).c;
  console.log(`✅ ${label}：植入 ${n} 題，總計 ${total} 題`);
};

insertBatch(ids.LISTEN, listenQs, '聽力 (GEPT_LISTEN)');
insertBatch(ids.READ,   readQs,   '閱讀 (GEPT_READ)');
insertBatch(ids.WRITE,  writeQs,  '寫作 (GEPT_WRITE)');
insertBatch(ids.SPEAK,  speakQs,  '口說 (GEPT_SPEAK)');
