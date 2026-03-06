/**
 * 國小六年級題目最後補充（補足至 500 題）
 */
const db = require('./database');
const insert = db.prepare(`
  INSERT INTO questions (subject_id,type,difficulty,content,option_a,option_b,option_c,option_d,answer,explanation,source,tags,grade_level)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
`);
function ch(sid,diff,content,a,b,c,d,answer,explanation,tags){
  return{subject_id:sid,type:'choice',difficulty:diff,content,option_a:a,option_b:b,option_c:c,option_d:d,answer,explanation,tags,grade_level:'elementary_6'};
}
function fi(sid,diff,content,answer,explanation,tags){
  return{subject_id:sid,type:'fill',difficulty:diff,content,option_a:null,option_b:null,option_c:null,option_d:null,answer,explanation,tags,grade_level:'elementary_6'};
}

const finalQ = [
  // 社會 (207) 補 6 題
  ch(207,2,'台灣的「中正紀念堂」紀念哪位歷史人物？','孫中山','蔣介石（蔣中正）','鄭成功','蔣經國','B','中正紀念堂紀念蔣中正（蔣介石），位於台北市。','台灣文化,歷史'),
  ch(207,2,'台灣發展最早的城市之一，有「府城」之稱的是？','台北','台中','台南','高雄','C','台南是台灣歷史最悠久的城市，舊稱「府城」。','台灣歷史,城市'),
  ch(207,2,'台灣哪個縣市有著名的「九份老街」？','台北市','新北市（瑞芳）','基隆','桃園','B','九份位於新北市瑞芳區，是台灣著名觀光勝地。','台灣文化'),
  ch(207,3,'「聯合國」成立於哪一年？','1939','1945','1950','1960','B','聯合國（UN）於1945年10月24日正式成立。','世界歷史'),
  ch(207,2,'「世界人權宣言」由哪個國際組織通過？','世界銀行','聯合國','歐盟','世界衛生組織','B','1948年聯合國大會通過《世界人權宣言》。','公民,人權'),
  fi(207,2,'聯合國總部設在___（城市名）','紐約','聯合國總部位於美國紐約市。','世界地理'),

  // 自然 (280) 補 3 題
  ch(280,2,'雷電是怎麼形成的？','火山噴發','雲層中正負電荷分離，累積後放電','地震引起','磁場變化','B','積雨雲中電荷分離，當電位差夠大，在雲間或雲地間放電，形成閃電。','天氣,雷電'),
  ch(280,2,'冬天在窗玻璃上看到的霜或水珠，是因為？','窗戶漏水','室外水氣凝結在冷玻璃上','窗戶本身有水','空氣中的水蒸氣昇華','B','室外溫暖潮濕的空氣或室內水氣遇到冷玻璃，凝結成水滴或霜。','物質三態,凝結'),
  fi(280,2,'彩虹的顏色順序由外到內（從紅到紫）共有___種顏色','7','赤橙黃綠藍靛紫，共7種顏色。','光學,彩虹'),

  // 國語 (205) 補 2 題
  ch(205,2,'下列哪個句子的標點符號使用正確？','我喜歡吃，蘋果，和橘子。','她問：「你吃飯了嗎？」','我叫，小明，今年十歲。','他說他很好、謝謝你、','B','冒號引導引語，引語用引號，疑問句末加問號，用法正確。','標點符號'),
  fi(205,3,'「___而知新，可以為師矣」（論語）：___而知新','溫故（溫）','溫故知新：複習舊知識而能有新的領悟。','論語,名言'),
];

const doInsert = db.transaction(() => {
  finalQ.forEach(q => insert.run(
    q.subject_id,q.type,q.difficulty,q.content,
    q.option_a,q.option_b,q.option_c,q.option_d,
    q.answer,q.explanation,null,q.tags,q.grade_level
  ));
  return finalQ.length;
});
const inserted = doInsert();

const summary = db.prepare(`
  SELECT s.name, COUNT(q.id) as cnt
  FROM subjects s LEFT JOIN questions q ON q.subject_id=s.id AND q.grade_level='elementary_6'
  WHERE s.grade_level='elementary_6' GROUP BY s.id ORDER BY s.id
`).all();

console.log(`✅ 最後補充植入 ${inserted} 題\n各科目題目數量（最終）：`);
summary.forEach(r=>console.log(`  ${r.name}：${r.cnt} 題`));
const total = summary.reduce((s,r)=>s+r.cnt,0);
console.log(`  合計：${total} 題`);
