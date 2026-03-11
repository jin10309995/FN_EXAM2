require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const db = require('./database');
const { generateQuestions } = require('./llm');

const app = express();

// ─── 音訊上傳目錄 ────────────────────────────────────────────────────────────
const AUDIO_DIR = path.join(__dirname, 'uploads', 'audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AUDIO_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
    cb(null, `audio_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage: audioStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    if (/^audio\/(mpeg|wav|ogg|mp4|x-m4a|aac|webm)$/.test(file.mimetype) ||
        /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('只接受音訊檔案（mp3, wav, ogg, m4a, aac, webm）'));
    }
  }
});

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

// ─── 音訊靜態服務 ──────────────────────────────────────────────────────────────
app.use('/audio', express.static(AUDIO_DIR));

// ─── 音訊上傳（管理員） ────────────────────────────────────────────────────────
app.post('/api/audio/upload', requireAdmin, (req, res, next) => {
  upload.single('audio')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: '未收到音訊檔案' });
    const audioUrl = `/audio/${req.file.filename}`;
    res.json({ audio_url: audioUrl, filename: req.file.filename });
  });
});

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
  const { subject_id, type, difficulty_min, difficulty_max, grade_level, count = 10, weighted } = req.query;
  const where = ['q.is_archived = 0'];
  const params = [];
  if (subject_id)     { where.push('q.subject_id = ?');   params.push(subject_id); }
  if (type)           { where.push('q.type = ?');         params.push(type); }
  if (difficulty_min) { where.push('q.difficulty >= ?');  params.push(difficulty_min); }
  if (difficulty_max) { where.push('q.difficulty <= ?');  params.push(difficulty_max); }
  if (grade_level)    { where.push('q.grade_level = ?');  params.push(grade_level); }
  const w = 'WHERE ' + where.join(' AND ');
  // 加權隨機：依 wrong_count 指數分佈加權，錯越多出現越頻繁
  const orderBy = weighted === '1'
    ? '-LOG(ABS(CAST(RANDOM() AS REAL) / 9223372036854775807)) / (q.wrong_count + 1)'
    : 'RANDOM()';
  const data = db.prepare(`
    SELECT q.*, s.name as subject_name FROM questions q
    JOIN subjects s ON s.id = q.subject_id
    ${w} ORDER BY ${orderBy} LIMIT ?
  `).all(...params, parseInt(count));
  res.json(data);
});

// ─── Questions ───────────────────────────────────────────────────────────────
app.get('/api/questions', (req, res) => {
  const { subject_id, type, difficulty, search, grade_level, include_archived, page = 1, limit = 20 } = req.query;
  const where = [];
  const params = [];
  if (!include_archived) { where.push('q.is_archived = 0'); }
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
  const { subject_id, type, difficulty, content, option_a, option_b, option_c, option_d, answer, explanation, source, tags, grade_level = 'junior_high', audio_url, audio_transcript } = req.body;
  if (!subject_id || !type || !difficulty || !content || !answer)
    return res.status(400).json({ error: '必填欄位不完整' });
  if (!['choice', 'fill', 'calculation', 'listening'].includes(type))
    return res.status(400).json({ error: '題型值無效' });
  if (!['elementary_6', 'junior_high', 'grade_7', 'grade_8', 'grade_9', 'bctest'].includes(grade_level))
    return res.status(400).json({ error: '學段值無效' });
  const r = db.prepare(`
    INSERT INTO questions (subject_id,type,difficulty,content,option_a,option_b,option_c,option_d,answer,explanation,source,tags,grade_level,audio_url,audio_transcript)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(subject_id, type, difficulty, content, option_a||null, option_b||null, option_c||null, option_d||null, answer, explanation||null, source||null, tags||null, grade_level, audio_url||null, audio_transcript||null);
  res.json({ id: r.lastInsertRowid, message: '題目新增成功' });
});

app.put('/api/questions/:id', requireAdmin, (req, res) => {
  const { subject_id, type, difficulty, content, option_a, option_b, option_c, option_d, answer, explanation, source, tags, grade_level, audio_url, audio_transcript } = req.body;
  if (type && !['choice', 'fill', 'calculation', 'listening'].includes(type))
    return res.status(400).json({ error: '題型值無效' });
  if (grade_level && !['elementary_6', 'junior_high', 'grade_7', 'grade_8', 'grade_9', 'bctest'].includes(grade_level))
    return res.status(400).json({ error: '學段值無效' });
  // 使用 COALESCE 支援部分欄位更新，未傳入的欄位保留原值
  const r = db.prepare(`
    UPDATE questions SET
      subject_id=COALESCE(?,subject_id), type=COALESCE(?,type), difficulty=COALESCE(?,difficulty),
      content=COALESCE(?,content),
      option_a=COALESCE(?,option_a), option_b=COALESCE(?,option_b),
      option_c=COALESCE(?,option_c), option_d=COALESCE(?,option_d),
      answer=COALESCE(?,answer), explanation=COALESCE(?,explanation),
      source=COALESCE(?,source), tags=COALESCE(?,tags),
      grade_level=COALESCE(?,grade_level),
      audio_url=COALESCE(?,audio_url), audio_transcript=COALESCE(?,audio_transcript),
      updated_at=datetime('now','localtime')
    WHERE id=?
  `).run(
    subject_id||null, type||null, difficulty||null, content||null,
    option_a||null, option_b||null, option_c||null, option_d||null,
    answer||null, explanation||null, source||null, tags||null,
    grade_level||null, audio_url||null, audio_transcript||null, req.params.id
  );
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
           q.option_a, q.option_b, q.option_c, q.option_d, q.difficulty,
           q.audio_url, q.audio_transcript, s.name as subject_name
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
  const exam = db.prepare('SELECT id FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: '找不到試卷' });
  // L-2: Transaction 保護；使用 COALESCE 支援部分欄位更新
  const updateExam = db.transaction(() => {
    db.prepare(`
      UPDATE exams SET
        title=COALESCE(?,title), description=COALESCE(?,description),
        duration_min=COALESCE(?,duration_min), status=COALESCE(?,status)
      WHERE id=?
    `).run(title||null, description||null, duration_min||null, status||null, req.params.id);
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

// ─── LLM 出題 ────────────────────────────────────────────────────────────────
// POST /api/generate/questions — 呼叫 LLM 產生題目預覽（不存 DB）
app.post('/api/generate/questions', requireAdmin, async (req, res) => {
  try {
    const {
      provider = process.env.LLM_PROVIDER || 'openai',
      subject_id, type = 'choice', difficulty = 3,
      count = 5, grade_level = 'junior_high', hint = ''
    } = req.body;

    if (!subject_id) return res.status(400).json({ error: '必須指定科目 subject_id' });

    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subject_id);
    if (!subject) return res.status(404).json({ error: '找不到指定科目' });

    const typeLabel = { choice: '單選題（A/B/C/D）', fill: '填空題', calculation: '計算題', listening: '英語聽力選擇題' }[type] || type;
    const gradeLabelMap = {elementary_6:'國小六年級',junior_high:'升國中（資優班）',grade_7:'國一（七年級）',grade_8:'國二（八年級）',grade_9:'國三（九年級）',bctest:'國中教育會考'};
    const gradeLabel = gradeLabelMap[grade_level] || '升國中（資優班）';
    const userPrompt = `請出 ${count} 題「${subject.name}」${gradeLabel}的${typeLabel}，難度 ${difficulty}/5（1 最易，5 最難）。${hint ? `\n補充要求：${hint}` : ''}`;

    const questions = await generateQuestions(provider, userPrompt);

    // 將科目與型別資訊補入預覽結果
    const preview = questions.slice(0, count).map(q => ({
      subject_id,
      subject_name: subject.name,
      type,
      difficulty: parseInt(difficulty),
      grade_level,
      content:     q.content     || '',
      option_a:    q.option_a    || null,
      option_b:    q.option_b    || null,
      option_c:    q.option_c    || null,
      option_d:    q.option_d    || null,
      answer:      q.answer      || '',
      explanation: q.explanation || null,
      tags:        q.tags        || null
    }));

    res.json({ provider, count: preview.length, questions: preview });
  } catch (err) {
    const isKeyMissing = err.message.includes('未設定');
    res.status(isKeyMissing ? 503 : 500).json({ error: err.message });
  }
});

// POST /api/questions/batch — 批次儲存審核後的題目
app.post('/api/questions/batch', requireAdmin, (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0)
    return res.status(400).json({ error: 'questions 陣列不得為空' });

  const ins = db.prepare(`
    INSERT INTO questions
      (subject_id,type,difficulty,content,option_a,option_b,option_c,option_d,answer,explanation,source,tags,grade_level,audio_url,audio_transcript)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insertAll = db.transaction((items) => {
    const ids = [];
    for (const q of items) {
      if (!q.subject_id || !q.type || !q.difficulty || !q.content || !q.answer)
        throw new Error('題目資料不完整，缺少必填欄位');
      if (!['elementary_6', 'junior_high', 'grade_7', 'grade_8', 'grade_9', 'bctest'].includes(q.grade_level || 'junior_high'))
        throw new Error('學段值無效');
      const r = ins.run(
        q.subject_id, q.type, q.difficulty, q.content,
        q.option_a||null, q.option_b||null, q.option_c||null, q.option_d||null,
        q.answer, q.explanation||null, q.source||null, q.tags||null,
        q.grade_level||'junior_high', q.audio_url||null, q.audio_transcript||null
      );
      ids.push(r.lastInsertRowid);
    }
    return ids;
  });

  try {
    const ids = insertAll(questions);
    res.json({ message: `成功儲存 ${ids.length} 道題目`, ids });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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

  // L-2: Transaction 保護提交與明細寫入，同步更新答對/答錯次數
  const saveSubmission = db.transaction(() => {
    const sub = db.prepare(`
      INSERT INTO submissions (exam_id, student_name, student_id, answers, score, total_score)
      VALUES (?,?,?,?,?,?)
    `).run(req.params.id, student_name, student_id||null, JSON.stringify(answers), earnedScore, totalScore);
    const insDetail = db.prepare(`INSERT INTO answer_details (submission_id,question_id,given_answer,is_correct,score_earned) VALUES (?,?,?,?,?)`);
    const updCorrect = db.prepare(`UPDATE questions SET correct_count = correct_count + 1 WHERE id = ?`);
    const updWrong   = db.prepare(`UPDATE questions SET wrong_count   = wrong_count   + 1 WHERE id = ?`);
    details.forEach(d => {
      insDetail.run(sub.lastInsertRowid, d.question_id, d.given_answer, d.is_correct, d.score_earned);
      if (d.is_correct) updCorrect.run(d.question_id);
      else              updWrong.run(d.question_id);
    });
    return sub.lastInsertRowid;
  });
  const submissionId = saveSubmission();

  // 非同步封存超過5次答對的題目並 LLM 自動替換（不阻塞回應）
  setImmediate(() => archiveAndReplace());

  res.json({ submission_id: submissionId, score: earnedScore, total_score: totalScore, percentage: Math.round(earnedScore / totalScore * 100) });
});

// 封存答對 >5 次的題目，並用 LLM 自動生成難度 +1 的替換題
async function archiveAndReplace() {
  const toArchive = db.prepare(`
    SELECT q.*, s.name as subject_name, s.code as subject_code
    FROM questions q JOIN subjects s ON s.id = q.subject_id
    WHERE q.correct_count > 5 AND q.is_archived = 0
  `).all();
  if (!toArchive.length) return;

  const archive = db.prepare(`UPDATE questions SET is_archived = 1 WHERE id = ?`);
  const provider = process.env.LLM_PROVIDER || 'openai';

  for (const q of toArchive) {
    // 先封存
    archive.run(q.id);
    console.log(`[AutoArchive] 題目 #${q.id}（${q.subject_name}，難度${q.difficulty}）答對 >5 次，已封存`);

    // 嘗試 LLM 自動生成替換題
    const newDiff = Math.min(q.difficulty + 1, 5);
    const typeLabel = { choice: '單選題（A/B/C/D）', fill: '填空題', calculation: '計算題', listening: '英語聽力選擇題' }[q.type] || q.type;
    const gradeLabelMap2 = {elementary_6:'國小六年級',junior_high:'升國中（資優班）',grade_7:'國一（七年級）',grade_8:'國二（八年級）',grade_9:'國三（九年級）',bctest:'國中教育會考'};
    const gradeLabel = gradeLabelMap2[q.grade_level] || '升國中（資優班）';
    const prompt = `請出 1 題「${q.subject_name}」${gradeLabel}的${typeLabel}，難度 ${newDiff}/5（1 最易，5 最難）。請勿與以下題目重複：${q.content}`;

    try {
      const generated = await generateQuestions(provider, prompt);
      if (!generated || !generated.length) throw new Error('LLM 回傳空陣列');
      const nq = generated[0];
      db.prepare(`
        INSERT INTO questions (subject_id, type, difficulty, content, option_a, option_b, option_c, option_d, answer, explanation, tags, grade_level, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        q.subject_id, q.type, newDiff,
        nq.content || '', nq.option_a || null, nq.option_b || null, nq.option_c || null, nq.option_d || null,
        nq.answer || '', nq.explanation || null, nq.tags || null, q.grade_level,
        `自動替換（原題 #${q.id}）`
      );
      console.log(`[AutoReplace] 已為題目 #${q.id} 生成難度 ${newDiff} 替換題`);
    } catch (err) {
      console.warn(`[AutoReplace] 題目 #${q.id} LLM 替換失敗：${err.message}`);
    }
  }
}

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

// GET analysis report for a submission
app.get('/api/submissions/:id/analysis', (req, res) => {
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: '找不到作答紀錄' });

  const exam = db.prepare('SELECT title FROM exams WHERE id = ?').get(sub.exam_id);
  const details = db.prepare(`
    SELECT ad.*, q.content, q.answer as correct_answer, q.explanation, q.type,
           q.difficulty, q.subject_id, s.name as subject_name,
           q.option_a, q.option_b, q.option_c, q.option_d
    FROM answer_details ad
    JOIN questions q ON q.id = ad.question_id
    JOIN subjects s ON s.id = q.subject_id
    WHERE ad.submission_id = ?
  `).all(req.params.id);

  const pct = sub.total_score > 0 ? Math.round(sub.score * 100 / sub.total_score) : 0;

  // 各科目統計
  const bySubject = {};
  details.forEach(d => {
    if (!bySubject[d.subject_name]) bySubject[d.subject_name] = { correct: 0, wrong: 0, score: 0, total: 0 };
    bySubject[d.subject_name].total++;
    if (d.is_correct) bySubject[d.subject_name].correct++;
    else bySubject[d.subject_name].wrong++;
    bySubject[d.subject_name].score += d.score_earned;
  });

  // 各難度統計
  const byDifficulty = {};
  for (let i = 1; i <= 5; i++) byDifficulty[i] = { correct: 0, wrong: 0, total: 0 };
  details.forEach(d => {
    const diff = d.difficulty || 1;
    byDifficulty[diff].total++;
    if (d.is_correct) byDifficulty[diff].correct++;
    else byDifficulty[diff].wrong++;
  });

  // 弱點題目（答錯的題目）
  const weakQuestions = details.filter(d => !d.is_correct).map(d => ({
    content: d.content, type: d.type, difficulty: d.difficulty,
    subject_name: d.subject_name, correct_answer: d.correct_answer,
    given_answer: d.given_answer, explanation: d.explanation,
    option_a: d.option_a, option_b: d.option_b, option_c: d.option_c, option_d: d.option_d
  }));

  // 建議文字（依弱點科目和難度）
  const weakSubjects = Object.entries(bySubject)
    .filter(([, v]) => v.wrong > v.correct)
    .map(([name]) => name);
  const avgWrongDiff = weakQuestions.length
    ? (weakQuestions.reduce((s, q) => s + (q.difficulty || 1), 0) / weakQuestions.length).toFixed(1)
    : null;

  let suggestions = [];
  if (weakSubjects.length) suggestions.push(`建議加強：${weakSubjects.join('、')} 的練習。`);
  if (avgWrongDiff) suggestions.push(`答錯題目平均難度為 ${avgWrongDiff}，建議從此難度附近的題目開始複習。`);
  if (pct >= 90) suggestions.push('表現優異！可嘗試更高難度的挑戰題。');
  else if (pct >= 70) suggestions.push('整體表現良好，繼續加油！');
  else suggestions.push('建議重新複習答錯的題目，加強基礎概念。');

  // Rasch ability estimation per subject
  const abilityBySubject = {};
  details.forEach(d => {
    if (!abilityBySubject[d.subject_name]) abilityBySubject[d.subject_name] = [];
    abilityBySubject[d.subject_name].push({ difficulty: d.difficulty, is_correct: d.is_correct });
  });
  const ability_profile = Object.entries(abilityBySubject).map(([name, responses]) => ({
    subject_name: name,
    ability: estimateAbilityRasch(responses),
    sample_size: responses.length,
    pass_rate: Math.round(responses.filter(r => r.is_correct).length / responses.length * 100)
  }));
  const overall_ability = estimateAbilityRasch(details.map(d => ({ difficulty: d.difficulty, is_correct: d.is_correct })));

  res.json({
    submission_id: sub.id,
    student_name: sub.student_name,
    student_id: sub.student_id,
    exam_title: exam?.title || '',
    submitted_at: sub.submitted_at,
    score: sub.score,
    total_score: sub.total_score,
    percentage: pct,
    total_questions: details.length,
    correct_count: details.filter(d => d.is_correct).length,
    wrong_count: details.filter(d => !d.is_correct).length,
    by_subject: bySubject,
    by_difficulty: byDifficulty,
    weak_questions: weakQuestions,
    suggestions,
    ability_profile,
    overall_ability
  });
});


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

// ─── ML Analytics ────────────────────────────────────────────────────────────

// Rasch model: estimate student ability θ from a list of {difficulty, is_correct} responses.
// Maps difficulty 1-5 to logit scale: β = (difficulty - 3) * 1.5
// Returns ability on 1-5 display scale (1 decimal place).
function estimateAbilityRasch(responses) {
  if (!responses || responses.length === 0) return null;
  const items = responses.map(r => ({ beta: (r.difficulty - 3) * 1.5, correct: r.is_correct ? 1 : 0 }));
  const totalCorrect = items.reduce((s, i) => s + i.correct, 0);
  if (totalCorrect === 0) return 1.0;
  if (totalCorrect === items.length) return 5.0;
  let theta = 0;
  for (let iter = 0; iter < 100; iter++) {
    let grad = 0, hess = 0;
    for (const item of items) {
      const p = 1 / (1 + Math.exp(item.beta - theta));
      grad += item.correct - p;
      hess -= p * (1 - p);
    }
    if (Math.abs(hess) < 1e-10) break;
    const delta = -grad / hess;
    theta += delta;
    if (Math.abs(delta) < 1e-6) break;
  }
  theta = Math.max(-4.5, Math.min(4.5, theta));
  return Math.round((theta / 1.5 + 3) * 10) / 10;
}

// GET difficulty calibration: compare labeled vs. empirical difficulty
app.get('/api/analytics/difficulty-calibration', requireAdmin, (req, res) => {
  const { subject_id, grade_level } = req.query;
  const where = ['q.is_archived = 0'];
  const params = [];
  if (subject_id) { where.push('q.subject_id = ?'); params.push(subject_id); }
  if (grade_level) { where.push('q.grade_level = ?'); params.push(grade_level); }
  const questions = db.prepare(`
    SELECT q.id, q.content, q.difficulty as labeled_difficulty,
           q.correct_count, q.wrong_count,
           q.subject_id, s.name as subject_name, q.grade_level,
           (q.correct_count + q.wrong_count) as total_attempts
    FROM questions q JOIN subjects s ON s.id = q.subject_id
    WHERE ${where.join(' AND ')} ORDER BY q.subject_id, q.difficulty
  `).all(...params);

  const result = questions.map(q => {
    let pass_rate = null, empirical_difficulty = null, deviation = null, is_anomalous = false;
    if (q.total_attempts > 0) {
      pass_rate = Math.round(q.correct_count * 100.0 / q.total_attempts * 10) / 10;
      const pr = pass_rate / 100;
      empirical_difficulty = pr >= 0.8 ? 1 : pr >= 0.6 ? 2 : pr >= 0.4 ? 3 : pr >= 0.2 ? 4 : 5;
      deviation = empirical_difficulty - q.labeled_difficulty;
      is_anomalous = Math.abs(deviation) >= 2 && q.total_attempts >= 5;
    }
    return { ...q, pass_rate, empirical_difficulty, deviation, is_anomalous };
  });

  const withData = result.filter(q => q.total_attempts >= 5);
  const anomalous = withData.filter(q => q.is_anomalous);
  const avgDev = withData.length
    ? Math.round(withData.reduce((s, q) => s + Math.abs(q.deviation || 0), 0) / withData.length * 100) / 100
    : 0;
  res.json({ questions: result, summary: { total: result.length, with_data: withData.length, anomalous_count: anomalous.length, avg_deviation: avgDev } });
});

// GET question quality: pass rate + discrimination index
app.get('/api/analytics/question-quality', requireAdmin, (req, res) => {
  const min_attempts = Math.max(1, parseInt(req.query.min_attempts) || 3);
  const { subject_id, grade_level } = req.query;
  const where = ['q.is_archived = 0', `(q.correct_count + q.wrong_count) >= ${min_attempts}`];
  const params = [];
  if (subject_id) { where.push('q.subject_id = ?'); params.push(subject_id); }
  if (grade_level) { where.push('q.grade_level = ?'); params.push(grade_level); }
  const questions = db.prepare(`
    SELECT q.id, q.content, q.difficulty, q.type,
           q.correct_count, q.wrong_count,
           q.subject_id, s.name as subject_name, q.grade_level,
           (q.correct_count + q.wrong_count) as total_attempts
    FROM questions q JOIN subjects s ON s.id = q.subject_id
    WHERE ${where.join(' AND ')} ORDER BY q.subject_id, q.difficulty
  `).all(...params);

  // Fetch all relevant answer_details in one query for discrimination index
  if (questions.length === 0) return res.json({ questions: [], summary: { total: 0, needs_review: 0, avg_pass_rate: 0, avg_discrimination: null } });
  const qIds = questions.map(q => q.id);
  const allAnswers = db.prepare(`
    SELECT ad.question_id, ad.is_correct,
           ROUND(s.score * 100.0 / NULLIF(s.total_score, 0), 2) as pct
    FROM answer_details ad
    JOIN submissions s ON s.id = ad.submission_id
    WHERE ad.question_id IN (${qIds.map(() => '?').join(',')})
    ORDER BY ad.question_id, pct
  `).all(...qIds);

  // Group answers by question_id
  const answerMap = {};
  allAnswers.forEach(a => {
    if (!answerMap[a.question_id]) answerMap[a.question_id] = [];
    answerMap[a.question_id].push(a);
  });

  const result = questions.map(q => {
    const pass_rate = Math.round(q.correct_count * 100.0 / q.total_attempts * 10) / 10;
    const pr = pass_rate / 100;
    const empirical_difficulty = pr >= 0.8 ? 1 : pr >= 0.6 ? 2 : pr >= 0.4 ? 3 : pr >= 0.2 ? 4 : 5;

    // Discrimination index: top 27% vs bottom 27% pass rate difference
    let discrimination_index = null;
    const answers = (answerMap[q.id] || []).sort((a, b) => a.pct - b.pct);
    if (answers.length >= 6) {
      const cutoff = Math.max(1, Math.floor(answers.length * 0.27));
      const low = answers.slice(0, cutoff);
      const high = answers.slice(-cutoff);
      const lowPass = low.reduce((s, a) => s + a.is_correct, 0) / low.length;
      const highPass = high.reduce((s, a) => s + a.is_correct, 0) / high.length;
      discrimination_index = Math.round((highPass - lowPass) * 100) / 100;
    }

    const quality_flags = [];
    if (pr > 0.95) quality_flags.push('太容易（通過率>95%）');
    if (pr < 0.05) quality_flags.push('太困難（通過率<5%）');
    if (discrimination_index !== null && discrimination_index < 0.2) quality_flags.push('鑑別度低（<0.2）');
    if (discrimination_index !== null && discrimination_index < 0) quality_flags.push('負鑑別度');
    if (Math.abs(empirical_difficulty - q.difficulty) >= 2) quality_flags.push(`難度標示異常（標示${q.difficulty}，實際${empirical_difficulty}）`);

    let quality_score = 100 - quality_flags.length * 20;
    if (discrimination_index !== null) quality_score = Math.min(quality_score, Math.round(Math.max(0, discrimination_index) * 100));

    return { ...q, pass_rate, empirical_difficulty, discrimination_index, quality_flags, quality_score: Math.max(0, quality_score), needs_review: quality_flags.length > 0 };
  });

  const withDI = result.filter(q => q.discrimination_index !== null);
  res.json({
    questions: result,
    summary: {
      total: result.length,
      needs_review: result.filter(q => q.needs_review).length,
      avg_pass_rate: result.length ? Math.round(result.reduce((s, q) => s + q.pass_rate, 0) / result.length * 10) / 10 : 0,
      avg_discrimination: withDI.length ? Math.round(withDI.reduce((s, q) => s + q.discrimination_index, 0) / withDI.length * 100) / 100 : null
    }
  });
});

// GET student ability profile using Rasch model (admin)
app.get('/api/analytics/student-ability', requireAdmin, (req, res) => {
  const { student_name, student_id } = req.query;
  if (!student_name && !student_id) return res.status(400).json({ error: '請提供 student_name 或 student_id' });
  const where = ['1=1'];
  const params = [];
  if (student_name) { where.push('student_name = ?'); params.push(student_name); }
  if (student_id)   { where.push('student_id = ?');   params.push(student_id); }
  const subs = db.prepare(`SELECT id FROM submissions WHERE ${where.join(' AND ')}`).all(...params);
  if (!subs.length) return res.status(404).json({ error: '找不到此學生的作答紀錄' });
  const ids = subs.map(s => s.id);
  const details = db.prepare(`
    SELECT ad.is_correct, q.difficulty, q.subject_id, s.name as subject_name
    FROM answer_details ad
    JOIN questions q ON q.id = ad.question_id
    JOIN subjects s ON s.id = q.subject_id
    WHERE ad.submission_id IN (${ids.map(() => '?').join(',')})
  `).all(...ids);

  const bySubject = {};
  details.forEach(d => {
    if (!bySubject[d.subject_id]) bySubject[d.subject_id] = { subject_name: d.subject_name, responses: [] };
    bySubject[d.subject_id].responses.push({ difficulty: d.difficulty, is_correct: d.is_correct });
  });
  const ability_profile = Object.entries(bySubject).map(([sid, data]) => ({
    subject_id: parseInt(sid),
    subject_name: data.subject_name,
    sample_size: data.responses.length,
    ability: estimateAbilityRasch(data.responses),
    correct_count: data.responses.filter(r => r.is_correct).length,
    pass_rate: Math.round(data.responses.filter(r => r.is_correct).length / data.responses.length * 100)
  })).sort((a, b) => a.subject_id - b.subject_id);

  res.json({
    student_name: student_name || '',
    student_id: student_id || '',
    total_responses: details.length,
    exam_count: subs.length,
    overall_ability: estimateAbilityRasch(details.map(d => ({ difficulty: d.difficulty, is_correct: d.is_correct }))),
    ability_profile
  });
});

// GET personalized recommendations
app.get('/api/recommendations', (req, res) => {
  const { student_name, student_id, subject_id, count = 10, grade_level } = req.query;
  const n = Math.min(50, Math.max(1, parseInt(count) || 10));

  if (!student_name && !student_id) {
    // No student context — return random questions
    const w = ['q.is_archived = 0']; const p = [];
    if (grade_level) { w.push('q.grade_level = ?'); p.push(grade_level); }
    if (subject_id)  { w.push('q.subject_id = ?');  p.push(subject_id); }
    const qs = db.prepare(`SELECT q.*, s.name as subject_name FROM questions q JOIN subjects s ON s.id = q.subject_id WHERE ${w.join(' AND ')} ORDER BY RANDOM() LIMIT ?`).all(...p, n);
    return res.json({ recommendations: qs, context: { reason: '無歷史資料，隨機推薦' } });
  }

  const swhere = ['1=1']; const sparams = [];
  if (student_name) { swhere.push('student_name = ?'); sparams.push(student_name); }
  if (student_id)   { swhere.push('student_id = ?');   sparams.push(student_id); }
  const subs = db.prepare(`SELECT id FROM submissions WHERE ${swhere.join(' AND ')}`).all(...sparams);

  if (!subs.length) {
    const w = ['q.is_archived = 0']; const p = [];
    if (grade_level) { w.push('q.grade_level = ?'); p.push(grade_level); }
    const qs = db.prepare(`SELECT q.*, s.name as subject_name FROM questions q JOIN subjects s ON s.id = q.subject_id WHERE ${w.join(' AND ')} ORDER BY RANDOM() LIMIT ?`).all(...p, n);
    return res.json({ recommendations: qs, context: { reason: '無歷史資料，隨機推薦' } });
  }

  const ids = subs.map(s => s.id);
  const details = db.prepare(`
    SELECT ad.is_correct, ad.question_id, q.difficulty, q.subject_id, q.grade_level, s.name as subject_name
    FROM answer_details ad
    JOIN questions q ON q.id = ad.question_id
    JOIN subjects s ON s.id = q.subject_id
    WHERE ad.submission_id IN (${ids.map(() => '?').join(',')})
  `).all(...ids);

  const answeredIds = [...new Set(details.map(d => d.question_id))];
  const bySubject = {};
  details.forEach(d => {
    if (!bySubject[d.subject_id]) bySubject[d.subject_id] = { name: d.subject_name, grade_level: d.grade_level, responses: [], wrong: 0 };
    bySubject[d.subject_id].responses.push({ difficulty: d.difficulty, is_correct: d.is_correct });
    if (!d.is_correct) bySubject[d.subject_id].wrong++;
  });

  // Target: weakest subject or specified
  let targetSubjectId = subject_id ? parseInt(subject_id) : null;
  let targetAbility = 3;
  if (!targetSubjectId) {
    let maxWrong = -1;
    for (const [sid, data] of Object.entries(bySubject)) {
      if (data.wrong > maxWrong) { maxWrong = data.wrong; targetSubjectId = parseInt(sid); }
    }
  }
  if (targetSubjectId && bySubject[targetSubjectId]) {
    targetAbility = estimateAbilityRasch(bySubject[targetSubjectId].responses) || 3;
  }

  const targetDiff = Math.round(Math.min(5, Math.max(1, targetAbility + 0.5)));
  const diffLow = Math.max(1, targetDiff - 1), diffHigh = Math.min(5, targetDiff + 1);
  const excl = answeredIds.length > 0 ? `AND q.id NOT IN (${answeredIds.map(() => '?').join(',')})` : '';
  const excludeParams = answeredIds.length > 0 ? answeredIds : [];

  let sql = `SELECT q.*, s.name as subject_name FROM questions q JOIN subjects s ON s.id = q.subject_id WHERE q.is_archived = 0 AND q.difficulty BETWEEN ? AND ? ${excl}`;
  let params = [diffLow, diffHigh, ...excludeParams];
  if (targetSubjectId) { sql += ' AND q.subject_id = ?'; params.push(targetSubjectId); }
  if (grade_level)     { sql += ' AND q.grade_level = ?'; params.push(grade_level); }
  sql += ' ORDER BY RANDOM() LIMIT ?'; params.push(n);

  let recs = db.prepare(sql).all(...params);

  // Broaden if insufficient
  if (recs.length < n) {
    let sql2 = `SELECT q.*, s.name as subject_name FROM questions q JOIN subjects s ON s.id = q.subject_id WHERE q.is_archived = 0 ${excl}`;
    const p2 = [...excludeParams];
    if (targetSubjectId) { sql2 += ' AND q.subject_id = ?'; p2.push(targetSubjectId); }
    if (grade_level)     { sql2 += ' AND q.grade_level = ?'; p2.push(grade_level); }
    sql2 += ' ORDER BY RANDOM() LIMIT ?'; p2.push(n - recs.length);
    const existing = new Set(recs.map(r => r.id));
    recs = [...recs, ...db.prepare(sql2).all(...p2).filter(r => !existing.has(r.id))];
  }

  const tname = targetSubjectId && bySubject[targetSubjectId] ? bySubject[targetSubjectId].name : '全科目';
  res.json({
    recommendations: recs,
    context: {
      student_name: student_name || '',
      target_subject: tname,
      estimated_ability: Math.round(targetAbility * 10) / 10,
      target_difficulty: targetDiff,
      total_history: details.length,
      reason: `依能力估算值 ${Math.round(targetAbility * 10) / 10}，推薦 ${tname} 難度 ${targetDiff} 附近的題目`
    }
  });
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
