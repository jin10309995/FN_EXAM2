require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./database');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // 安全 HTTP Headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json({ limit: '100kb' })); // 限制請求體大小
app.use(express.static(path.join(__dirname, 'public')));

// 提交作答專用速率限制：每個 IP 每 15 分鐘最多 10 次
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: '提交次數過多，請稍後再試' }
});

// 一般 API 速率限制：每個 IP 每分鐘最多 200 次
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: '請求過於頻繁，請稍後再試' }
});
app.use('/api/', apiLimiter);

// ─── Subjects ────────────────────────────────────────────────────────────────
app.get('/api/subjects', (req, res) => {
  const { grade_level } = req.query;
  if (grade_level) {
    res.json(db.prepare('SELECT * FROM subjects WHERE grade_level = ? ORDER BY id').all(grade_level));
  } else {
    res.json(db.prepare('SELECT * FROM subjects ORDER BY id').all());
  }
});

// ─── 管理員金鑰驗證中介層 ────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (adminKey) {
    const key = req.headers['x-api-key'];
    if (!key || key !== adminKey)
      return res.status(401).json({ error: '未授權，需要管理員金鑰' });
  }
  next();
}
// ─── Random Questions ────────────────────────────────────────────────────────
app.get('/api/questions/random', (req, res) => {
  const { subject_id, type, difficulty_min, difficulty_max, grade_level, count = 10 } = req.query;
  const where = [];
  const params = [];
  if (subject_id)     { where.push('q.subject_id = ?');   params.push(subject_id); }
  if (type)           { where.push('q.type = ?');         params.push(type); }
  if (difficulty_min) { where.push('q.difficulty >= ?');  params.push(difficulty_min); }
  if (difficulty_max) { where.push('q.difficulty <= ?');  params.push(difficulty_max); }
  if (grade_level)    { where.push('q.grade_level = ?');  params.push(grade_level); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const data = db.prepare(`
    SELECT q.*, s.name as subject_name FROM questions q
    JOIN subjects s ON s.id = q.subject_id
    ${w} ORDER BY RANDOM() LIMIT ?
  `).all(...params, parseInt(count));
  res.json(data);
});

// ─── Questions ───────────────────────────────────────────────────────────────
app.get('/api/questions', (req, res) => {
  const { subject_id, type, difficulty, search, grade_level, page = 1, limit = 20 } = req.query;
  const where = [];
  const params = [];
  if (subject_id)  { where.push('q.subject_id = ?'); params.push(subject_id); }
  if (type)        { where.push('q.type = ?');       params.push(type); }
  if (difficulty)  { where.push('q.difficulty = ?'); params.push(difficulty); }
  if (search)      { where.push('(q.content LIKE ? OR q.tags LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (grade_level) { where.push('q.grade_level = ?'); params.push(grade_level); }

  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const pageNum  = Math.max(1, parseInt(page)  || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM questions q ${w}`).get(...params).cnt;
  const data  = db.prepare(`
    SELECT q.*, s.name as subject_name FROM questions q
    JOIN subjects s ON s.id = q.subject_id
    ${w} ORDER BY q.id DESC LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset);
  res.json({ total, page: pageNum, limit: limitNum, data });
});

app.get('/api/questions/:id', (req, res) => {
  const row = db.prepare(`
    SELECT q.*, s.name as subject_name FROM questions q
    JOIN subjects s ON s.id = q.subject_id WHERE q.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: '找不到題目' });
  res.json(row);
});

app.post('/api/questions', requireAdmin, (req, res) => {
  const { subject_id, type, difficulty, content, option_a, option_b, option_c, option_d, answer, explanation, source, tags, grade_level = 'junior_high' } = req.body;
  if (!subject_id || !type || !difficulty || !content || !answer)
    return res.status(400).json({ error: '必填欄位不完整' });
  if (!['elementary_6', 'junior_high'].includes(grade_level))
    return res.status(400).json({ error: '學段值無效，請使用 elementary_6 或 junior_high' });
  const r = db.prepare(`
    INSERT INTO questions (subject_id,type,difficulty,content,option_a,option_b,option_c,option_d,answer,explanation,source,tags,grade_level)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(subject_id, type, difficulty, content, option_a||null, option_b||null, option_c||null, option_d||null, answer, explanation||null, source||null, tags||null, grade_level);
  res.json({ id: r.lastInsertRowid, message: '題目新增成功' });
});

app.put('/api/questions/:id', requireAdmin, (req, res) => {
  const { subject_id, type, difficulty, content, option_a, option_b, option_c, option_d, answer, explanation, source, tags, grade_level } = req.body;
  if (grade_level && !['elementary_6', 'junior_high'].includes(grade_level))
    return res.status(400).json({ error: '學段值無效，請使用 elementary_6 或 junior_high' });
  const r = db.prepare(`
    UPDATE questions SET subject_id=?,type=?,difficulty=?,content=?,option_a=?,option_b=?,option_c=?,option_d=?,
    answer=?,explanation=?,source=?,tags=?,grade_level=COALESCE(?,grade_level),updated_at=datetime('now','localtime') WHERE id=?
  `).run(subject_id, type, difficulty, content, option_a||null, option_b||null, option_c||null, option_d||null, answer, explanation||null, source||null, tags||null, grade_level||null, req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: '找不到題目' });
  res.json({ message: '題目更新成功' });
});

app.delete('/api/questions/:id', requireAdmin, (req, res) => {
  const r = db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: '找不到題目' });
  res.json({ message: '題目刪除成功' });
});

// ─── Exams ───────────────────────────────────────────────────────────────────
app.get('/api/exams', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, COUNT(eq.id) as question_count,
           SUM(eq.score) as total_score
    FROM exams e LEFT JOIN exam_questions eq ON eq.exam_id = e.id
    GROUP BY e.id ORDER BY e.id DESC
  `).all();
  res.json(rows);
});

// GET exam detail with answers (admin only — H-3 答案洩漏防護)
app.get('/api/exams/:id', requireAdmin, (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: '找不到試卷' });
  const questions = db.prepare(`
    SELECT eq.sort_order, eq.score, q.*, s.name as subject_name
    FROM exam_questions eq
    JOIN questions q ON q.id = eq.question_id
    JOIN subjects s ON s.id = q.subject_id
    WHERE eq.exam_id = ? ORDER BY eq.sort_order
  `).all(req.params.id);
  res.json({ ...exam, questions });
});

// GET exam for students (hides answers)
app.get('/api/exams/:id/take', (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ? AND status = ?').get(req.params.id, 'active');
  if (!exam) return res.status(404).json({ error: '試卷不存在或尚未開放' });
  const questions = db.prepare(`
    SELECT eq.sort_order, eq.score, q.id, q.type, q.content, q.subject_id,
           q.option_a, q.option_b, q.option_c, q.option_d, s.name as subject_name
    FROM exam_questions eq
    JOIN questions q ON q.id = eq.question_id
    JOIN subjects s ON s.id = q.subject_id
    WHERE eq.exam_id = ? ORDER BY eq.sort_order
  `).all(req.params.id);
  res.json({ ...exam, questions });
});

app.post('/api/exams', requireAdmin, (req, res) => {
  const { title, description, duration_min = 60, status = 'draft', question_ids } = req.body;
  if (!title) return res.status(400).json({ error: '試卷標題為必填' });
  if (!['draft', 'active', 'closed'].includes(status))
    return res.status(400).json({ error: '狀態值無效' });
  // L-2: Transaction 保護多步驟寫入
  const createExam = db.transaction(() => {
    const exam = db.prepare(`INSERT INTO exams (title, description, duration_min, status) VALUES (?,?,?,?)`).run(title, description||null, duration_min, status);
    if (question_ids && question_ids.length) {
      const ins = db.prepare(`INSERT INTO exam_questions (exam_id,question_id,sort_order,score) VALUES (?,?,?,?)`);
      question_ids.forEach((qid, i) => ins.run(exam.lastInsertRowid, qid.id || qid, i + 1, qid.score || 5));
    }
    return exam.lastInsertRowid;
  });
  const id = createExam();
  res.json({ id, message: '試卷建立成功' });
});

app.put('/api/exams/:id', requireAdmin, (req, res) => {
  const { title, description, duration_min, status, question_ids } = req.body;
  // L-2: Transaction 保護
  const updateExam = db.transaction(() => {
    db.prepare(`UPDATE exams SET title=?,description=?,duration_min=?,status=? WHERE id=?`)
      .run(title, description||null, duration_min, status, req.params.id);
    if (question_ids) {
      db.prepare(`DELETE FROM exam_questions WHERE exam_id = ?`).run(req.params.id);
      const ins = db.prepare(`INSERT INTO exam_questions (exam_id,question_id,sort_order,score) VALUES (?,?,?,?)`);
      question_ids.forEach((qid, i) => ins.run(req.params.id, qid.id || qid, i + 1, qid.score || 5));
    }
  });
  updateExam();
  res.json({ message: '試卷更新成功' });
});

app.delete('/api/exams/:id', requireAdmin, (req, res) => {
  const exam = db.prepare('SELECT id FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: '找不到試卷' });
  // H-1: 用子查詢取代字串拼接；L-2: Transaction 保護
  const deleteExam = db.transaction((id) => {
    db.prepare(`DELETE FROM answer_details WHERE submission_id IN (SELECT id FROM submissions WHERE exam_id = ?)`).run(id);
    db.prepare('DELETE FROM submissions WHERE exam_id = ?').run(id);
    db.prepare('DELETE FROM exams WHERE id = ?').run(id);
  });
  deleteExam(req.params.id);
  res.json({ message: '試卷刪除成功' });
});

// ─── Submissions ─────────────────────────────────────────────────────────────
app.post('/api/exams/:id/submit', submitLimiter, (req, res) => {
  const { student_name, student_id, answers } = req.body;
  if (!student_name || !answers) return res.status(400).json({ error: '缺少必要資料' });

  const exam = db.prepare('SELECT * FROM exams WHERE id = ? AND status = ?').get(req.params.id, 'active');
  if (!exam) return res.status(403).json({ error: '試卷不存在或尚未開放' });

  const questions = db.prepare(`
    SELECT eq.question_id, eq.score, q.answer, q.type
    FROM exam_questions eq JOIN questions q ON q.id = eq.question_id
    WHERE eq.exam_id = ?
  `).all(req.params.id);

  let totalScore = 0;
  let earnedScore = 0;
  const details = questions.map(q => {
    totalScore += q.score;
    const given = (answers[q.question_id] || '').toString().trim();
    const correct = q.answer.toString().trim();
    const isCorrect = given.toLowerCase() === correct.toLowerCase() ? 1 : 0;
    const scoreEarned = isCorrect ? q.score : 0;
    earnedScore += scoreEarned;
    return { question_id: q.question_id, given_answer: given, is_correct: isCorrect, score_earned: scoreEarned };
  });

  // L-2: Transaction 保護提交與明細寫入
  const saveSubmission = db.transaction(() => {
    const sub = db.prepare(`
      INSERT INTO submissions (exam_id, student_name, student_id, answers, score, total_score)
      VALUES (?,?,?,?,?,?)
    `).run(req.params.id, student_name, student_id||null, JSON.stringify(answers), earnedScore, totalScore);
    const insDetail = db.prepare(`INSERT INTO answer_details (submission_id,question_id,given_answer,is_correct,score_earned) VALUES (?,?,?,?,?)`);
    details.forEach(d => insDetail.run(sub.lastInsertRowid, d.question_id, d.given_answer, d.is_correct, d.score_earned));
    return sub.lastInsertRowid;
  });
  const submissionId = saveSubmission();

  res.json({ submission_id: submissionId, score: earnedScore, total_score: totalScore, percentage: Math.round(earnedScore / totalScore * 100) });
});

// GET submission result
app.get('/api/submissions/:id', (req, res) => {
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: '找不到作答紀錄' });
  const details = db.prepare(`
    SELECT ad.*, q.content, q.answer as correct_answer, q.explanation, q.type,
           q.option_a, q.option_b, q.option_c, q.option_d
    FROM answer_details ad JOIN questions q ON q.id = ad.question_id
    WHERE ad.submission_id = ?
  `).all(req.params.id);
  res.json({ ...sub, details });
});

// GET all submissions for an exam
app.get('/api/exams/:id/submissions', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT id, student_name, student_id, score, total_score,
           ROUND(score * 100.0 / NULLIF(total_score,0), 1) as percentage, submitted_at
    FROM submissions WHERE exam_id = ? ORDER BY submitted_at DESC
  `).all(req.params.id);
  res.json(rows);
});

// GET statistics for an exam
app.get('/api/exams/:id/stats', requireAdmin, (req, res) => {
  const stats = db.prepare(`
    SELECT COUNT(*) as count,
           ROUND(AVG(score * 100.0 / NULLIF(total_score,0)),1) as avg_pct,
           MAX(score * 100.0 / NULLIF(total_score,0)) as max_pct,
           MIN(score * 100.0 / NULLIF(total_score,0)) as min_pct
    FROM submissions WHERE exam_id = ?
  `).get(req.params.id);
  const wrongMost = db.prepare(`
    SELECT q.content, COUNT(*) as wrong_count
    FROM answer_details ad JOIN questions q ON q.id = ad.question_id
    JOIN submissions s ON s.id = ad.submission_id
    WHERE s.exam_id = ? AND ad.is_correct = 0
    GROUP BY ad.question_id ORDER BY wrong_count DESC LIMIT 5
  `).all(req.params.id);
  res.json({ ...stats, most_wrong: wrongMost });
});

// ─── Start ────────────────────────────────────────────────────────────────────
// L-1: 全域錯誤處理，避免 stack trace 洩漏給客戶端
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
  res.status(500).json({ error: '伺服器內部錯誤' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\n🎓 升國中數理資優班考題系統\n   http://localhost:${PORT}\n`))
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ 錯誤：Port ${PORT} 已被其他程式佔用。`);
      console.error(`   請先關閉佔用 port 的程式，或改用其他 port：`);
      console.error(`   set PORT=8080 && node server.js\n`);
    } else {
      console.error(`\n❌ 伺服器啟動失敗：${err.message}\n`);
    }
    process.exit(1);
  });
