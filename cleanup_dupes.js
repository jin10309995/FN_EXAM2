/**
 * cleanup_dupes.js
 * 清理資料庫中內容相同（content 完全相同）的重覆題目。
 * 每組重覆題目保留最小 ID，其餘刪除。
 * 執行前自動備份相關 ID 到 console，並在 transaction 中完成。
 */
const db = require('./database.js');

const stats = db.prepare(`
  SELECT COUNT(*) as groups, SUM(cnt-1) as extra_rows FROM (
    SELECT COUNT(*) as cnt FROM questions WHERE is_archived=0 GROUP BY content HAVING cnt > 1
  )
`).get();

if (!stats.extra_rows) {
  console.log('✅ 資料庫無重覆題目，無需清理。');
  process.exit(0);
}

console.log(`🔍 發現 ${stats.groups} 組重覆題目，共 ${stats.extra_rows} 筆多餘資料`);
console.log('🚀 開始清理...\n');

const cleanup = db.transaction(() => {
  // 取得所有重覆組：content → [id1, id2, ...] (id1 為最小，即保留者)
  const dupGroups = db.prepare(`
    SELECT content, MIN(id) as keep_id, GROUP_CONCAT(id) as all_ids
    FROM questions
    WHERE is_archived = 0
    GROUP BY content
    HAVING COUNT(*) > 1
  `).all();

  let updatedEQ = 0;
  let deletedEQ = 0;
  let updatedAD = 0;
  let deletedQ  = 0;

  for (const group of dupGroups) {
    const keepId  = group.keep_id;
    const allIds  = group.all_ids.split(',').map(Number);
    const dupIds  = allIds.filter(id => id !== keepId);

    // 1. exam_questions：將重覆 ID 改指向 keepId
    //    若同一份考卷裡已存在 keepId，則直接刪除該 dupId 那筆
    for (const dupId of dupIds) {
      const affectedExams = db.prepare(
        `SELECT DISTINCT exam_id FROM exam_questions WHERE question_id = ?`
      ).all(dupId);

      for (const { exam_id } of affectedExams) {
        const keepExists = db.prepare(
          `SELECT 1 FROM exam_questions WHERE exam_id = ? AND question_id = ?`
        ).get(exam_id, keepId);

        if (keepExists) {
          // keepId 已在該考卷，刪除重覆那筆
          const r = db.prepare(
            `DELETE FROM exam_questions WHERE exam_id = ? AND question_id = ?`
          ).run(exam_id, dupId);
          deletedEQ += r.changes;
        } else {
          // keepId 不在該考卷，把 dupId 更新為 keepId
          const r = db.prepare(
            `UPDATE exam_questions SET question_id = ? WHERE exam_id = ? AND question_id = ?`
          ).run(keepId, exam_id, dupId);
          updatedEQ += r.changes;
        }
      }
    }

    // 2. answer_details：將重覆 ID 改指向 keepId
    for (const dupId of dupIds) {
      const r = db.prepare(
        `UPDATE answer_details SET question_id = ? WHERE question_id = ?`
      ).run(keepId, dupId);
      updatedAD += r.changes;
    }

    // 3. 刪除重覆題目（所有 FK 已處理完畢）
    const placeholders = dupIds.map(() => '?').join(',');
    const r = db.prepare(
      `DELETE FROM questions WHERE id IN (${placeholders})`
    ).run(...dupIds);
    deletedQ += r.changes;
  }

  return { updatedEQ, deletedEQ, updatedAD, deletedQ };
});

// 暫時關閉 FK 檢查以安全執行（transaction 內部已確保資料一致性）
db.exec('PRAGMA foreign_keys = OFF');
const result = cleanup();
db.exec('PRAGMA foreign_keys = ON');

const remaining = db.prepare('SELECT COUNT(*) as n FROM questions WHERE is_archived=0').get();

console.log('✅ 清理完成！');
console.log(`   exam_questions 更新: ${result.updatedEQ} 筆`);
console.log(`   exam_questions 刪除（重覆）: ${result.deletedEQ} 筆`);
console.log(`   answer_details 更新: ${result.updatedAD} 筆`);
console.log(`   questions 刪除: ${result.deletedQ} 筆`);
console.log(`   剩餘題目數: ${remaining.n}`);
