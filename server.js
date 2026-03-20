require('dotenv').config({ quiet: true });
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const db = require('./database');
const { generateQuestions, gradeEssay, generateModelEssay } = require('./llm');

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

// ─── 圖片上傳目錄 ────────────────────────────────────────────────────────────
const IMAGE_DIR = path.join(__dirname, 'uploads', 'images');
if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGE_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `img_${Date.now()}${ext}`);
  }
});
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp|svg\+xml)$/.test(file.mimetype) ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('只接受圖片檔案（jpg, png, gif, webp, svg）'));
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
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.get('/', (req, res) => res.redirect('/login.html'));
app.get('/login', (req, res) => res.redirect('/login.html'));
app.get('/student', (req, res) => res.redirect('/login.html?role=student'));
app.get('/teacher', (req, res) => res.redirect('/login.html?role=teacher'));
app.get('/student/home', (req, res) => res.redirect('/exam-list.html'));
app.get('/student-home.html', (req, res) => res.redirect('/exam-list.html'));
app.get('/teacher/home', (req, res) => res.redirect('/admin.html'));

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
app.use('/images', express.static(IMAGE_DIR));

// ─── 音訊上傳（老師） ──────────────────────────────────────────────────────────
app.post('/api/audio/upload', requireAdmin, (req, res, next) => {
  upload.single('audio')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: '未收到音訊檔案' });
    const audioUrl = `/audio/${req.file.filename}`;
    res.json({ audio_url: audioUrl, filename: req.file.filename });
  });
});

// POST image upload endpoint (admin only)
app.post('/api/image/upload', requireAdmin, (req, res) => {
  uploadImage.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: '未收到圖片檔案' });
    const imageUrl = `/images/${req.file.filename}`;
    res.json({ image_url: imageUrl, filename: req.file.filename });
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

// ─── 老師金鑰驗證中介層 ──────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const auth = getAdminAuth(req);
  if (auth.ok) {
    req.admin = auth.admin;
    req.adminSession = auth.session;
    return next();
  }
  return res.status(401).json({ error: '尚未登入' });
}

function requireAdminRole(...roles) {
  return (req, res, next) => {
    requireAdmin(req, res, () => {
      const role = req.admin?.role || '';
      if (!roles.includes(role)) {
        return res.status(403).json({ error: '權限不足' });
      }
      next();
    });
  };
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return raw.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const value = decodeURIComponent(part.slice(idx + 1).trim());
    if (key) acc[key] = value;
    return acc;
  }, {});
}

function hashAdminSessionToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function appendSetCookie(res, value) {
  const current = res.getHeader('Set-Cookie');
  if (!current) {
    res.setHeader('Set-Cookie', value);
    return;
  }
  const next = Array.isArray(current) ? current.concat(value) : [current, value];
  res.setHeader('Set-Cookie', next);
}

function setAdminSessionCookie(res, token, expiresAt) {
  const expires = new Date(expiresAt).toUTCString();
  appendSetCookie(res, `admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`);
}

function clearAdminSessionCookie(res) {
  appendSetCookie(res, 'admin_session=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
}

function hashStudentSessionToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function setStudentSessionCookie(res, token, expiresAt) {
  const expires = new Date(expiresAt).toUTCString();
  appendSetCookie(res, `student_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`);
}

function clearStudentSessionCookie(res) {
  appendSetCookie(res, 'student_session=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
}

function getStudentAuth(req) {
  const token = parseCookies(req).student_session || '';
  if (!token) return { ok: false };
  const session = db.prepare(`
    SELECT id, student_name, student_id, expires_at
    FROM student_sessions
    WHERE token_hash = ?
  `).get(hashStudentSessionToken(token));
  if (!session) return { ok: false };
  if (new Date(session.expires_at) <= new Date()) {
    db.prepare(`DELETE FROM student_sessions WHERE id = ?`).run(session.id);
    return { ok: false };
  }
  db.prepare(`UPDATE student_sessions SET last_seen_at = datetime('now','localtime') WHERE id = ?`).run(session.id);
  return {
    ok: true,
    session: { id: session.id, expires_at: session.expires_at },
    student: {
      name: session.student_name,
      student_id: session.student_id || ''
    }
  };
}

function requireStudent(req, res, next) {
  const auth = getStudentAuth(req);
  if (!auth.ok) return res.status(401).json({ error: '請先登入學生帳號' });
  req.student = auth.student;
  req.studentSession = auth.session;
  next();
}

function getStudentIdentity(req, payload = {}) {
  const auth = getStudentAuth(req);
  const name = String(payload.student_name || auth.student?.name || '').trim();
  const studentId = String(payload.student_id || auth.student?.student_id || '').trim();
  return { name, student_id: studentId };
}

function getAdminAuth(req) {
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const cookieToken = parseCookies(req).admin_session || '';
  const token = bearer || cookieToken;
  if (!token) return { ok: false };
  const session = db.prepare(`
    SELECT s.id, s.admin_id, s.expires_at, a.username, a.display_name, a.role, a.is_active
    FROM admin_sessions s
    JOIN admins a ON a.id = s.admin_id
    WHERE s.token_hash = ?
  `).get(hashAdminSessionToken(token));
  if (!session) return { ok: false };
  if (!session.is_active) return { ok: false };
  if (new Date(session.expires_at) <= new Date()) {
    db.prepare(`DELETE FROM admin_sessions WHERE id = ?`).run(session.id);
    return { ok: false };
  }
  db.prepare(`UPDATE admin_sessions SET last_seen_at = datetime('now','localtime') WHERE id = ?`).run(session.id);
  return {
    ok: true,
    session: { id: session.id, expires_at: session.expires_at },
    admin: {
      id: session.admin_id,
      username: session.username,
      display_name: session.display_name,
      role: session.role
    }
  };
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password || '')).digest('hex');
}

app.post('/api/admin/session', requireAdmin, (req, res) => {
  res.json({
    success: true,
    auth_mode: 'session',
    admin: req.admin || null,
    expires_at: req.adminSession?.expires_at || null
  });
});

app.post('/api/student/login', (req, res) => {
  const { student_name, student_id } = req.body || {};
  const name = String(student_name || '').trim();
  const studentId = String(student_id || '').trim();
  if (!name) return res.status(400).json({ error: '請提供學生姓名' });
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString();
  db.prepare(`
    INSERT INTO student_sessions (student_name, student_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(name, studentId || null, hashStudentSessionToken(token), expiresAt);
  setStudentSessionCookie(res, token, expiresAt);
  res.json({
    success: true,
    student: { name, student_id: studentId },
    expires_at: expiresAt
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const loginName = String(username || '').trim();
  if (!loginName || !password) return res.status(400).json({ error: '請提供帳號與密碼' });

  const admin = db.prepare(`
    SELECT id, username, password_hash, display_name, role, is_active
    FROM admins
    WHERE username = ?
  `).get(loginName);
  if (admin && admin.is_active && admin.password_hash === hashPassword(password)) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString();
    db.prepare(`
      INSERT INTO admin_sessions (admin_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `).run(admin.id, hashAdminSessionToken(token), expiresAt);
    setAdminSessionCookie(res, token, expiresAt);
    clearStudentSessionCookie(res);
    return res.json({
      success: true,
      role: 'teacher',
      redirect_to: '/admin.html',
      profile: {
        name: admin.display_name || admin.username,
        username: admin.username
      },
      expires_at: expiresAt
    });
  }

  const student = db.prepare(`
    SELECT id, username, password_hash, student_name, student_id, is_active
    FROM students
    WHERE username = ?
  `).get(loginName);
  if (student && student.is_active && student.password_hash === hashPassword(password)) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString();
    db.prepare(`
      INSERT INTO student_sessions (student_name, student_id, token_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(student.student_name, student.student_id || null, hashStudentSessionToken(token), expiresAt);
    setStudentSessionCookie(res, token, expiresAt);
    clearAdminSessionCookie(res);
    return res.json({
      success: true,
      role: 'student',
      redirect_to: '/exam-list.html',
      profile: {
        name: student.student_name,
        username: student.username,
        student_id: student.student_id || ''
      },
      expires_at: expiresAt
    });
  }

  return res.status(401).json({ error: '帳號或密碼錯誤' });
});

app.get('/api/student/me', requireStudent, (req, res) => {
  res.json({ success: true, student: req.student, session: req.studentSession });
});

app.post('/api/student/logout', requireStudent, (req, res) => {
  if (req.studentSession?.id) {
    db.prepare(`DELETE FROM student_sessions WHERE id = ?`).run(req.studentSession.id);
  }
  clearStudentSessionCookie(res);
  res.json({ success: true });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '請提供帳號與密碼' });
  const admin = db.prepare(`
    SELECT id, username, password_hash, display_name, role, is_active
    FROM admins
    WHERE username = ?
  `).get(String(username).trim());
  if (!admin || !admin.is_active || admin.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: '帳號或密碼錯誤' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString();
  db.prepare(`
    INSERT INTO admin_sessions (admin_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).run(admin.id, hashAdminSessionToken(token), expiresAt);
  setAdminSessionCookie(res, token, expiresAt);
  res.json({
    success: true,
    admin: {
      id: admin.id,
      username: admin.username,
      display_name: admin.display_name,
      role: admin.role
    },
    expires_at: expiresAt
  });
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin || null, session: req.adminSession || null });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  if (req.adminSession?.id) {
    db.prepare(`DELETE FROM admin_sessions WHERE id = ?`).run(req.adminSession.id);
  }
  clearAdminSessionCookie(res);
  res.json({ success: true });
});

app.get('/api/admin/accounts', requireAdmin, (req, res) => {
  const admins = db.prepare(`
    SELECT id, username, display_name, role, is_active, created_at, updated_at
    FROM admins
    ORDER BY id ASC
  `).all();
  const students = db.prepare(`
    SELECT id, username, student_name, student_id, is_active, created_at, updated_at
    FROM students
    ORDER BY id ASC
  `).all();
  res.json({
    success: true,
    current_admin_id: req.admin?.id || null,
    admins,
    students
  });
});

app.post('/api/admin/accounts/admins', requireAdmin, (req, res) => {
  const { username, password, display_name, is_active = 1 } = req.body || {};
  const loginName = String(username || '').trim();
  const pwd = String(password || '');
  if (!loginName || !pwd) return res.status(400).json({ error: '請提供帳號與密碼' });
  const exists = db.prepare(`SELECT id FROM admins WHERE username = ?`).get(loginName);
  if (exists) return res.status(409).json({ error: '帳號已存在' });
  const result = db.prepare(`
    INSERT INTO admins (username, password_hash, display_name, role, is_active)
    VALUES (?, ?, ?, ?, ?)
  `).run(loginName, hashPassword(pwd), String(display_name || '').trim() || loginName, 'teacher', is_active ? 1 : 0);
  const created = db.prepare(`
    SELECT id, username, display_name, role, is_active, created_at, updated_at
    FROM admins
    WHERE id = ?
  `).get(result.lastInsertRowid);
  res.json({ success: true, admin: created });
});

app.put('/api/admin/accounts/admins/:id', requireAdmin, (req, res) => {
  const accountId = Number(req.params.id);
  const { display_name, is_active, password } = req.body || {};
  const existing = db.prepare(`SELECT * FROM admins WHERE id = ?`).get(accountId);
  if (!existing) return res.status(404).json({ error: '找不到老師帳號' });
  if (existing.id === req.admin?.id && is_active === 0) {
    return res.status(400).json({ error: '不可停用目前登入的老師帳號' });
  }
  db.prepare(`
    UPDATE admins
    SET display_name = ?,
        role = ?,
        is_active = ?,
        password_hash = CASE WHEN ? <> '' THEN ? ELSE password_hash END,
        updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(
    String(display_name || '').trim() || existing.display_name || existing.username,
    'teacher',
    typeof is_active === 'undefined' ? existing.is_active : (is_active ? 1 : 0),
    String(password || ''),
    hashPassword(password || ''),
    accountId
  );
  const updated = db.prepare(`
    SELECT id, username, display_name, role, is_active, created_at, updated_at
    FROM admins
    WHERE id = ?
  `).get(accountId);
  res.json({ success: true, admin: updated });
});

app.post('/api/admin/accounts/students', requireAdmin, (req, res) => {
  const { username, password, student_name, student_id, is_active = 1 } = req.body || {};
  const loginName = String(username || '').trim();
  const pwd = String(password || '');
  const studentName = String(student_name || '').trim();
  if (!loginName || !pwd || !studentName) {
    return res.status(400).json({ error: '請提供學生帳號、密碼與姓名' });
  }
  const exists = db.prepare(`SELECT id FROM students WHERE username = ?`).get(loginName);
  if (exists) return res.status(409).json({ error: '學生帳號已存在' });
  const result = db.prepare(`
    INSERT INTO students (username, password_hash, student_name, student_id, is_active)
    VALUES (?, ?, ?, ?, ?)
  `).run(loginName, hashPassword(pwd), studentName, String(student_id || '').trim() || null, is_active ? 1 : 0);
  const created = db.prepare(`
    SELECT id, username, student_name, student_id, is_active, created_at, updated_at
    FROM students
    WHERE id = ?
  `).get(result.lastInsertRowid);
  res.json({ success: true, student: created });
});

app.put('/api/admin/accounts/students/:id', requireAdmin, (req, res) => {
  const accountId = Number(req.params.id);
  const { student_name, student_id, is_active, password } = req.body || {};
  const existing = db.prepare(`SELECT * FROM students WHERE id = ?`).get(accountId);
  if (!existing) return res.status(404).json({ error: '找不到學生帳號' });
  db.prepare(`
    UPDATE students
    SET student_name = ?,
        student_id = ?,
        is_active = ?,
        password_hash = CASE WHEN ? <> '' THEN ? ELSE password_hash END,
        updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(
    String(student_name || '').trim() || existing.student_name,
    String(student_id || '').trim() || null,
    typeof is_active === 'undefined' ? existing.is_active : (is_active ? 1 : 0),
    String(password || ''),
    hashPassword(password || ''),
    accountId
  );
  const updated = db.prepare(`
    SELECT id, username, student_name, student_id, is_active, created_at, updated_at
    FROM students
    WHERE id = ?
  `).get(accountId);
  res.json({ success: true, student: updated });
});

function normalizeExamQuestionIds(questionIds) {
  const seen = new Set();
  const normalized = [];

  for (const item of Array.isArray(questionIds) ? questionIds : []) {
    const rawId = item && typeof item === 'object' ? item.id : item;
    const rawScore = item && typeof item === 'object' ? item.score : null;
    const id = parseInt(rawId, 10);
    if (!Number.isInteger(id) || seen.has(id)) continue;
    seen.add(id);
    normalized.push({
      id,
      score: Math.max(1, parseInt(rawScore, 10) || 5)
    });
  }

  return normalized;
}

function normalizeQuestionContent(content) {
  return String(content || '')
    .replace(/\$+/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .toLowerCase()
    .trim();
}

function buildContentHash(content) {
  return crypto.createHash('sha1').update(normalizeQuestionContent(content)).digest('hex');
}

function datetimeNow() {
  return new Date().toISOString();
}

function getAdminActor(req) {
  return req?.admin?.username || req.headers['x-admin-user'] || 'admin';
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeFlags(flags) {
  return JSON.stringify(Array.from(new Set((flags || []).filter(Boolean))));
}

function validateQuestionShape(question) {
  const q = question || {};
  const errors = [];
  if (!q.subject_id) errors.push('缺少 subject_id');
  if (!q.type) errors.push('缺少題型');
  if (!q.difficulty || Number(q.difficulty) < 1 || Number(q.difficulty) > 5) errors.push('難度需介於 1 到 5');
  if (!q.content || !String(q.content).trim()) errors.push('題目內容不可空白');
  const nonAutoTypes = ['writing', 'speaking'];
  if (!nonAutoTypes.includes(q.type) && !String(q.answer || '').trim()) errors.push('答案不可空白');
  if (['choice', 'listening', 'reading'].includes(q.type)) {
    const opts = [q.option_a, q.option_b, q.option_c, q.option_d].filter(v => String(v || '').trim());
    if (opts.length < 2) errors.push('選擇型題目至少需要 2 個選項');
  }
  if (q.type === 'true_false') {
    const normalized = String(q.answer || '').trim().toUpperCase();
    if (!['T', 'F', 'TRUE', 'FALSE'].includes(normalized)) errors.push('是非題答案需為 T 或 F');
  }
  if (q.type === 'listening' && !String(q.audio_transcript || '').trim()) errors.push('聽力題需提供逐字稿');
  return errors;
}

function findDuplicateQuestion({ content, grade_level, excludeId = null }) {
  const normalizedContent = normalizeQuestionContent(content);
  if (!normalizedContent) return null;
  const hash = buildContentHash(content);
  const params = [hash, normalizedContent];
  let sql = `
    SELECT q.id, q.grade_level, q.content, q.is_archived
    FROM questions q
    WHERE (q.content_hash = ? OR q.normalized_content = ?)
  `;
  if (grade_level) {
    sql += ` AND q.grade_level = ?`;
    params.push(grade_level);
  }
  if (excludeId) {
    sql += ` AND q.id <> ?`;
    params.push(excludeId);
  }
  sql += ` ORDER BY q.is_archived, q.id LIMIT 1`;
  return db.prepare(sql).get(...params) || null;
}

function computeQuestionGovernance(question, statsOverride = null) {
  const q = question || {};
  const totalAttempts = statsOverride?.total_attempts ?? ((q.correct_count || 0) + (q.wrong_count || 0));
  const passRate = totalAttempts > 0 ? (q.correct_count || 0) / totalAttempts : null;
  const flags = [];
  let reviewStatus = 'approved';
  if (totalAttempts >= 10 && passRate !== null) {
    if (passRate >= 0.95) flags.push('pass_rate_too_high');
    if (passRate <= 0.05) flags.push('pass_rate_too_low');
  }
  if (statsOverride?.discrimination_index !== null && statsOverride?.discrimination_index !== undefined) {
    if (statsOverride.discrimination_index < 0) flags.push('negative_discrimination');
    else if (statsOverride.discrimination_index < 0.2) flags.push('low_discrimination');
  }
  if (statsOverride?.empirical_difficulty && Math.abs(statsOverride.empirical_difficulty - (q.difficulty || 0)) >= 2) {
    flags.push('difficulty_mismatch');
  }
  if (flags.length) reviewStatus = 'needs_review';
  const qualityScore = statsOverride?.quality_score ?? Math.max(0, 100 - flags.length * 20);
  return { reviewStatus, qualityFlags: flags, qualityScore };
}

function persistQuestionGovernance(questionId, governance, extra = {}) {
  db.prepare(`
    UPDATE questions
    SET review_status = ?,
        quality_flags = ?,
        quality_score = ?,
        archived_reason = COALESCE(?, archived_reason),
        archived_at = COALESCE(?, archived_at),
        archived_by = COALESCE(?, archived_by),
        updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(
    governance.reviewStatus || 'approved',
    serializeFlags(governance.qualityFlags),
    governance.qualityScore ?? null,
    extra.archived_reason ?? null,
    extra.archived_at ?? null,
    extra.archived_by ?? null,
    questionId
  );
}

function snapshotQuestion(question) {
  if (!question) return null;
  return {
    subject_id: question.subject_id,
    type: question.type,
    difficulty: question.difficulty,
    content: question.content,
    option_a: question.option_a,
    option_b: question.option_b,
    option_c: question.option_c,
    option_d: question.option_d,
    answer: question.answer,
    explanation: question.explanation,
    source: question.source,
    tags: question.tags,
    grade_level: question.grade_level,
    audio_url: question.audio_url,
    audio_transcript: question.audio_transcript,
    image_url: question.image_url,
    passage_id: question.passage_id,
    passage_content: question.passage_content,
    normalized_content: question.normalized_content,
    content_hash: question.content_hash,
    review_status: question.review_status,
    quality_flags: question.quality_flags,
    quality_score: question.quality_score,
    is_archived: question.is_archived,
    archived_reason: question.archived_reason,
    archived_at: question.archived_at,
    archived_by: question.archived_by
  };
}

function logQuestionVersion(questionId, action, snapshot, changedBy) {
  if (!snapshot) return;
  const versionNo = (db.prepare(`SELECT COALESCE(MAX(version_no), 0) + 1 AS n FROM question_versions WHERE question_id = ?`).get(questionId)?.n) || 1;
  db.prepare(`
    INSERT INTO question_versions (question_id, version_no, action, changed_by, snapshot_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(questionId, versionNo, action, changedBy || null, JSON.stringify(snapshot));
}

function computeSnapshotDiff(fromSnapshot, toSnapshot) {
  const from = fromSnapshot || {};
  const to = toSnapshot || {};
  const keys = Array.from(new Set([...Object.keys(from), ...Object.keys(to)]));
  return keys
    .filter((key) => JSON.stringify(from[key] ?? null) !== JSON.stringify(to[key] ?? null))
    .map((key) => ({ field: key, from: from[key] ?? null, to: to[key] ?? null }));
}

function performReviewAction(questionId, action, actor, payload = {}) {
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
  if (!question) return { ok: false, status: 404, error: '找不到題目' };
  if (action === 'approve') {
    persistQuestionGovernance(question.id, { reviewStatus: 'approved', qualityFlags: [], qualityScore: question.quality_score ?? 100 });
    const updated = db.prepare('SELECT * FROM questions WHERE id = ?').get(question.id);
    logQuestionVersion(question.id, 'review_approve', snapshotQuestion(updated), actor);
    return { ok: true, message: '題目已核准' };
  }
  if (action === 'archive') {
    logQuestionVersion(question.id, 'before_archive', snapshotQuestion(question), actor);
    db.prepare(`
      UPDATE questions
      SET is_archived = 1,
          review_status = 'approved',
          archived_reason = ?,
          archived_at = datetime('now','localtime'),
          archived_by = ?,
          updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(payload.reason || '品質審查封存', actor, question.id);
    const updated = db.prepare('SELECT * FROM questions WHERE id = ?').get(question.id);
    logQuestionVersion(question.id, 'archive', snapshotQuestion(updated), actor);
    return { ok: true, message: '題目已封存' };
  }
  if (action === 'adjust_difficulty') {
    const nextDifficulty = Math.min(5, Math.max(1, parseInt(payload.difficulty, 10) || question.difficulty));
    logQuestionVersion(question.id, 'before_adjust_difficulty', snapshotQuestion(question), actor);
    db.prepare(`
      UPDATE questions
      SET difficulty = ?, review_status = 'approved', updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(nextDifficulty, question.id);
    const updated = db.prepare('SELECT * FROM questions WHERE id = ?').get(question.id);
    logQuestionVersion(question.id, 'adjust_difficulty', snapshotQuestion(updated), actor);
    return { ok: true, message: '難度已更新' };
  }
  return { ok: false, status: 400, error: '不支援的審查動作' };
}

function upsertQuestionPayload(raw, { existing = null, actor = 'system' } = {}) {
  const merged = {
    ...(existing || {}),
    ...(raw || {})
  };
  const errors = validateQuestionShape(merged);
  if (errors.length) return { ok: false, status: 400, error: errors.join('；') };

  const normalizedContent = normalizeQuestionContent(merged.content);
  const contentHash = buildContentHash(merged.content);
  const duplicate = findDuplicateQuestion({
    content: merged.content,
    grade_level: merged.grade_level || 'junior_high',
    excludeId: existing?.id || null
  });
  if (duplicate) {
    return { ok: false, status: 409, error: `偵測到重覆題目，題號 #${duplicate.id}` };
  }

  return {
    ok: true,
    record: {
      subject_id: parseInt(merged.subject_id, 10),
      type: merged.type,
      difficulty: parseInt(merged.difficulty, 10),
      content: String(merged.content).trim(),
      option_a: merged.option_a || null,
      option_b: merged.option_b || null,
      option_c: merged.option_c || null,
      option_d: merged.option_d || null,
      answer: ['writing', 'speaking'].includes(merged.type) ? (merged.answer || '人工批改') : String(merged.answer).trim(),
      explanation: merged.explanation || null,
      source: merged.source || null,
      tags: merged.tags || null,
      grade_level: merged.grade_level || 'junior_high',
      audio_url: merged.audio_url || null,
      audio_transcript: merged.audio_transcript || null,
      image_url: merged.image_url || null,
      passage_id: merged.passage_id || null,
      passage_content: merged.passage_content || null,
      normalized_content: normalizedContent,
      content_hash: contentHash,
      review_status: merged.review_status || 'approved',
      archived_by: merged.is_archived ? actor : null,
      archived_reason: merged.archived_reason || null,
      archived_at: merged.is_archived ? new Date().toISOString() : null
    }
  };
}

function backfillQuestionGovernance() {
  const rows = db.prepare(`
    SELECT id, content, correct_count, wrong_count, difficulty
    FROM questions
    WHERE normalized_content IS NULL OR content_hash IS NULL OR review_status IS NULL
  `).all();
  if (!rows.length) return;
  const update = db.prepare(`
    UPDATE questions
    SET normalized_content = ?,
        content_hash = ?,
        review_status = COALESCE(review_status, ?),
        quality_flags = COALESCE(quality_flags, ?),
        quality_score = COALESCE(quality_score, ?)
    WHERE id = ?
  `);
  const tx = db.transaction((items) => {
    for (const row of items) {
      const governance = computeQuestionGovernance(row);
      update.run(
        normalizeQuestionContent(row.content),
        buildContentHash(row.content),
        governance.reviewStatus,
        serializeFlags(governance.qualityFlags),
        governance.qualityScore,
        row.id
      );
    }
  });
  tx(rows);
}

function examAvailability(exam, req = null) {
  const now = new Date();
  if (!exam) return { ok: false, code: 404, error: '找不到試卷' };
  if (exam.status !== 'active') return { ok: false, code: 404, error: '試卷不存在或尚未開放' };
  if (exam.starts_at && new Date(exam.starts_at) > now) return { ok: false, code: 403, error: '考試尚未開始' };
  if (exam.ends_at && new Date(exam.ends_at) < now) return { ok: false, code: 403, error: '考試已截止' };
  if (exam.access_code) {
    if (!req) return { ok: true };
    const code = req?.query?.access_code || req?.body?.access_code || '';
    if (String(code) !== String(exam.access_code)) {
      return { ok: false, code: 403, error: '考試存取碼錯誤', requires_access_code: true };
    }
  }
  return { ok: true };
}

function summarizeExamForPublic(exam) {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    duration_min: exam.duration_min,
    status: exam.status,
    question_count: exam.question_count || 0,
    total_score: exam.total_score || 0,
    writing_count: exam.writing_count || 0,
    starts_at: exam.starts_at || null,
    ends_at: exam.ends_at || null,
    requires_access_code: !!exam.access_code
  };
}

function submissionAccessClause(token) {
  return token ? { ok: true } : { ok: false, code: 403, error: '缺少查詢碼' };
}

backfillQuestionGovernance();

function dedupeQuestionsByContent(questions) {
  const seenIds = new Set();
  const seenContent = new Set();
  const result = [];

  for (const question of questions || []) {
    if (!question) continue;
    if (question.id != null && seenIds.has(question.id)) continue;
    const normalizedContent = normalizeQuestionContent(question.content);
    if (normalizedContent && seenContent.has(normalizedContent)) continue;

    if (question.id != null) seenIds.add(question.id);
    if (normalizedContent) seenContent.add(normalizedContent);
    result.push(question);
  }

  return result;
}

// ─── Random Questions ────────────────────────────────────────────────────────
app.get('/api/questions/random', (req, res) => {
  const { subject_id, type, difficulty_min, difficulty_max, grade_level, count = 10, weighted, exclude_ids = '' } = req.query;
  const where = ['q.is_archived = 0'];
  const params = [];
  if (subject_id)     { where.push('q.subject_id = ?');   params.push(subject_id); }
  if (type)           { where.push('q.type = ?');         params.push(type); }
  if (difficulty_min) { where.push('q.difficulty >= ?');  params.push(difficulty_min); }
  if (difficulty_max) { where.push('q.difficulty <= ?');  params.push(difficulty_max); }
  if (grade_level)    { where.push('q.grade_level = ?');  params.push(grade_level); }
  const excludeIds = String(exclude_ids)
    .split(',')
    .map((id) => parseInt(id, 10))
    .filter((id) => Number.isInteger(id));
  if (excludeIds.length) {
    where.push(`q.id NOT IN (${excludeIds.map(() => '?').join(',')})`);
    params.push(...excludeIds);
  }
  const w = 'WHERE ' + where.join(' AND ');
  // 加權隨機：依 wrong_count + dont_know_count×2 指數分佈加權，不會的題目比答錯更優先
  const orderBy = weighted === '1'
    ? '-LOG(ABS(CAST(RANDOM() AS REAL) / 9223372036854775807)) / (q.wrong_count + q.dont_know_count * 2 + 1)'
    : 'RANDOM()';
  const rows = db.prepare(`
    SELECT DISTINCT q.*, s.name as subject_name FROM questions q
    JOIN subjects s ON s.id = q.subject_id
    ${w} ORDER BY ${orderBy} LIMIT ?
  `).all(...params, Math.max(parseInt(count) * 5, parseInt(count)));
  const data = dedupeQuestionsByContent(rows).slice(0, parseInt(count));
  res.json(data);
});

// ─── Questions ───────────────────────────────────────────────────────────────
app.get('/api/questions', (req, res) => {
  const { subject_id, type, difficulty, search, grade_level, include_archived, page = 1, limit = 20, review_status } = req.query;
  const where = [];
  const params = [];
  if (!include_archived) { where.push('q.is_archived = 0'); }
  if (subject_id)  { where.push('q.subject_id = ?'); params.push(subject_id); }
  if (type)        { where.push('q.type = ?');       params.push(type); }
  if (difficulty)  { where.push('q.difficulty = ?'); params.push(difficulty); }
  if (search)      { where.push('(q.content LIKE ? OR q.tags LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (grade_level) { where.push('q.grade_level = ?'); params.push(grade_level); }
  if (review_status) { where.push('q.review_status = ?'); params.push(review_status); }

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
  if (req.body.grade_level && !['elementary_6', 'junior_high', 'grade_7', 'grade_8', 'grade_9', 'bctest', 'gept_elementary'].includes(req.body.grade_level))
    return res.status(400).json({ error: '學段值無效' });
  const prepared = upsertQuestionPayload(req.body, { actor: getAdminActor(req) });
  if (!prepared.ok) return res.status(prepared.status).json({ error: prepared.error });
  const q = prepared.record;
  const r = db.prepare(`
    INSERT INTO questions (
      subject_id,type,difficulty,content,option_a,option_b,option_c,option_d,answer,explanation,source,tags,
      grade_level,audio_url,audio_transcript,image_url,passage_id,passage_content,normalized_content,content_hash,
      review_status,archived_reason,archived_at,archived_by
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    q.subject_id, q.type, q.difficulty, q.content, q.option_a, q.option_b, q.option_c, q.option_d,
    q.answer, q.explanation, q.source, q.tags, q.grade_level, q.audio_url, q.audio_transcript,
    q.image_url, q.passage_id, q.passage_content, q.normalized_content, q.content_hash,
    q.review_status, q.archived_reason, q.archived_at, q.archived_by
  );
  const inserted = db.prepare('SELECT * FROM questions WHERE id = ?').get(r.lastInsertRowid);
  logQuestionVersion(r.lastInsertRowid, 'create', snapshotQuestion(inserted), getAdminActor(req));
  res.json({ id: r.lastInsertRowid, message: '題目新增成功' });
});

app.put('/api/questions/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '找不到題目' });
  if (req.body.type && !['choice', 'true_false', 'fill', 'calculation', 'listening', 'cloze', 'reading', 'writing', 'speaking'].includes(req.body.type))
    return res.status(400).json({ error: '題型值無效' });
  if (req.body.grade_level && !['elementary_6', 'junior_high', 'grade_7', 'grade_8', 'grade_9', 'bctest', 'gept_elementary'].includes(req.body.grade_level))
    return res.status(400).json({ error: '學段值無效' });
  const prepared = upsertQuestionPayload(req.body, { existing, actor: getAdminActor(req) });
  if (!prepared.ok) return res.status(prepared.status).json({ error: prepared.error });
  const q = prepared.record;
  logQuestionVersion(existing.id, 'before_update', snapshotQuestion(existing), getAdminActor(req));
  const r = db.prepare(`
    UPDATE questions SET
      subject_id=?, type=?, difficulty=?, content=?,
      option_a=?, option_b=?, option_c=?, option_d=?,
      answer=?, explanation=?, source=?, tags=?, grade_level=?,
      audio_url=?, audio_transcript=?, image_url=?, passage_id=?, passage_content=?,
      normalized_content=?, content_hash=?, review_status=?,
      updated_at=datetime('now','localtime')
    WHERE id=?
  `).run(
    q.subject_id, q.type, q.difficulty, q.content,
    q.option_a, q.option_b, q.option_c, q.option_d,
    q.answer, q.explanation, q.source, q.tags,
    q.grade_level, q.audio_url, q.audio_transcript, q.image_url, q.passage_id, q.passage_content,
    q.normalized_content, q.content_hash, q.review_status, req.params.id
  );
  const updated = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  logQuestionVersion(existing.id, 'update', snapshotQuestion(updated), getAdminActor(req));
  res.json({ message: '題目更新成功' });
});

app.get('/api/question-review-queue', requireAdmin, (req, res) => {
  const { grade_level, subject_id, review_status = 'needs_review', include_archived = '0' } = req.query;
  const where = [];
  const params = [];
  if (review_status && review_status !== 'all') { where.push(`q.review_status = ?`); params.push(review_status); }
  if (grade_level) { where.push('q.grade_level = ?'); params.push(grade_level); }
  if (subject_id) { where.push('q.subject_id = ?'); params.push(subject_id); }
  if (include_archived !== '1') { where.push('q.is_archived = 0'); }
  const rows = db.prepare(`
    SELECT q.*, s.name AS subject_name
    FROM questions q
    JOIN subjects s ON s.id = q.subject_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY q.quality_score ASC NULLS FIRST, q.updated_at DESC
    LIMIT 200
  `).all(...params).map(row => ({ ...row, quality_flags: parseJsonArray(row.quality_flags) }));
  res.json(rows);
});

app.get('/api/question-review-history', requireAdmin, (req, res) => {
  const { question_id, changed_by, action, limit = 100 } = req.query;
  const where = ['1=1'];
  const params = [];
  if (question_id) { where.push('qv.question_id = ?'); params.push(question_id); }
  if (changed_by) { where.push('qv.changed_by = ?'); params.push(changed_by); }
  if (action) { where.push('qv.action = ?'); params.push(action); }
  const rows = db.prepare(`
    SELECT qv.id, qv.question_id, qv.version_no, qv.action, qv.changed_by, qv.created_at,
           q.content AS current_content, s.name AS subject_name
    FROM question_versions qv
    LEFT JOIN questions q ON q.id = qv.question_id
    LEFT JOIN subjects s ON s.id = q.subject_id
    WHERE ${where.join(' AND ')}
    ORDER BY qv.id DESC
    LIMIT ?
  `).all(...params, Math.min(500, Math.max(1, parseInt(limit, 10) || 100)));
  res.json(rows);
});

app.get('/api/questions/:id/versions', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT id, question_id, version_no, action, changed_by, created_at, snapshot_json
    FROM question_versions
    WHERE question_id = ?
    ORDER BY version_no DESC, id DESC
  `).all(req.params.id).map(row => ({
    ...row,
    snapshot: JSON.parse(row.snapshot_json || '{}')
  }));
  res.json(rows);
});

app.get('/api/questions/:id/version-diff', requireAdmin, (req, res) => {
  const fromId = parseInt(req.query.from_version_id, 10);
  const toId = parseInt(req.query.to_version_id, 10);
  if (!fromId || !toId) return res.status(400).json({ error: '缺少版本比較參數' });
  const versions = db.prepare(`
    SELECT id, version_no, action, changed_by, created_at, snapshot_json
    FROM question_versions
    WHERE question_id = ? AND id IN (?, ?)
  `).all(req.params.id, fromId, toId);
  if (versions.length !== 2) return res.status(404).json({ error: '找不到要比較的版本' });
  const fromVersion = versions.find(v => v.id === fromId);
  const toVersion = versions.find(v => v.id === toId);
  const fromSnapshot = JSON.parse(fromVersion.snapshot_json || '{}');
  const toSnapshot = JSON.parse(toVersion.snapshot_json || '{}');
  res.json({
    from_version: { ...fromVersion, snapshot: fromSnapshot },
    to_version: { ...toVersion, snapshot: toSnapshot },
    changes: computeSnapshotDiff(fromSnapshot, toSnapshot)
  });
});

app.post('/api/questions/:id/restore-version', requireAdmin, (req, res) => {
  const versionId = parseInt(req.body?.version_id, 10);
  if (!versionId) return res.status(400).json({ error: '缺少 version_id' });
  const version = db.prepare(`
    SELECT *
    FROM question_versions
    WHERE id = ? AND question_id = ?
  `).get(versionId, req.params.id);
  if (!version) return res.status(404).json({ error: '找不到版本資料' });
  const existing = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '找不到原題目' });
  const snapshot = JSON.parse(version.snapshot_json || '{}');
  const prepared = upsertQuestionPayload(snapshot, { existing, actor: getAdminActor(req) });
  if (!prepared.ok) return res.status(prepared.status).json({ error: prepared.error });
  const q = prepared.record;
  const actor = getAdminActor(req);
  logQuestionVersion(existing.id, 'before_restore', snapshotQuestion(existing), actor);
  db.prepare(`
    UPDATE questions SET
      subject_id=?, type=?, difficulty=?, content=?,
      option_a=?, option_b=?, option_c=?, option_d=?,
      answer=?, explanation=?, source=?, tags=?, grade_level=?,
      audio_url=?, audio_transcript=?, image_url=?, passage_id=?, passage_content=?,
      normalized_content=?, content_hash=?, review_status=?, quality_flags=?, quality_score=?,
      is_archived=?, archived_reason=?, archived_at=?, archived_by=?,
      updated_at=datetime('now','localtime')
    WHERE id=?
  `).run(
    q.subject_id, q.type, q.difficulty, q.content,
    q.option_a, q.option_b, q.option_c, q.option_d,
    q.answer, q.explanation, q.source, q.tags,
    q.grade_level, q.audio_url, q.audio_transcript, q.image_url, q.passage_id, q.passage_content,
    q.normalized_content, q.content_hash, snapshot.review_status || q.review_status,
    typeof snapshot.quality_flags === 'string' ? snapshot.quality_flags : serializeFlags(parseJsonArray(snapshot.quality_flags)),
    snapshot.quality_score ?? null,
    snapshot.is_archived ? 1 : 0,
    snapshot.archived_reason || null,
    snapshot.archived_at || null,
    snapshot.archived_by || null,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  logQuestionVersion(existing.id, 'restore', snapshotQuestion(updated), actor);
  res.json({ success: true, message: '題目版本已回復' });
});

app.post('/api/questions/:id/review-action', requireAdmin, async (req, res) => {
  const actor = getAdminActor(req);
  const result = performReviewAction(req.params.id, req.body?.action, actor, req.body || {});
  if (!result.ok) return res.status(result.status).json({ error: result.error });
  return res.json({ success: true, message: result.message });
});

app.post('/api/questions/review-actions/batch', requireAdmin, (req, res) => {
  const questionIds = Array.isArray(req.body?.question_ids) ? req.body.question_ids.map(id => parseInt(id, 10)).filter(Number.isInteger) : [];
  const action = req.body?.action;
  if (!questionIds.length) return res.status(400).json({ error: '缺少 question_ids' });
  const actor = getAdminActor(req);
  const summary = { success_ids: [], failed: [] };
  const tx = db.transaction(() => {
    for (const questionId of questionIds) {
      const result = performReviewAction(questionId, action, actor, req.body || {});
      if (result.ok) summary.success_ids.push(questionId);
      else summary.failed.push({ question_id: questionId, error: result.error });
    }
  });
  tx();
  res.json({
    success: true,
    action,
    success_count: summary.success_ids.length,
    failed_count: summary.failed.length,
    ...summary
  });
});

app.delete('/api/questions/:id', requireAdmin, (req, res) => {
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!question) return res.status(404).json({ error: '找不到題目' });
  logQuestionVersion(question.id, 'delete', snapshotQuestion(question), getAdminActor(req));
  const r = db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  res.json({ message: '題目刪除成功' });
});

// ─── Exams ───────────────────────────────────────────────────────────────────
app.get('/api/public/exams', (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, COUNT(eq.id) as question_count,
           SUM(eq.score) as total_score,
           COUNT(CASE WHEN q.type IN ('writing','speaking') THEN 1 END) as writing_count
    FROM exams e
    LEFT JOIN exam_questions eq ON eq.exam_id = e.id
    LEFT JOIN questions q ON q.id = eq.question_id
    WHERE e.status = 'active'
    GROUP BY e.id
    ORDER BY COALESCE(e.starts_at, e.created_at) DESC, e.id DESC
  `).all();
  const visible = rows
    .filter(exam => examAvailability(exam).ok)
    .map(summarizeExamForPublic);
  res.json(visible);
});

app.get('/api/student/exams', requireStudent, (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, COUNT(eq.id) as question_count,
           SUM(eq.score) as total_score,
           COUNT(CASE WHEN q.type IN ('writing','speaking') THEN 1 END) as writing_count
    FROM exams e
    LEFT JOIN exam_questions eq ON eq.exam_id = e.id
    LEFT JOIN questions q ON q.id = eq.question_id
    GROUP BY e.id ORDER BY e.id DESC
  `).all();
  const visible = rows
    .filter(exam => examAvailability(exam).ok)
    .map(summarizeExamForPublic);
  res.json({ student: req.student, exams: visible });
});

app.get('/api/exams', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, COUNT(eq.id) as question_count,
           SUM(eq.score) as total_score,
           COUNT(CASE WHEN q.type IN ('writing','speaking') THEN 1 END) as writing_count
    FROM exams e
    LEFT JOIN exam_questions eq ON eq.exam_id = e.id
    LEFT JOIN questions q ON q.id = eq.question_id
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

function getPublicExamPayload(req, res) {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  const availability = examAvailability(exam, req);
  if (!availability.ok) {
    res.status(availability.code).json({ error: availability.error, requires_access_code: availability.requires_access_code || false });
    return null;
  }
  const questions = db.prepare(`
    SELECT eq.sort_order, eq.score, q.id, q.type, q.content, q.subject_id,
           q.option_a, q.option_b, q.option_c, q.option_d, q.difficulty,
           q.audio_url, q.audio_transcript, q.image_url, q.passage_id, q.passage_content,
           s.name as subject_name
    FROM exam_questions eq
    JOIN questions q ON q.id = eq.question_id
    JOIN subjects s ON s.id = q.subject_id
    WHERE eq.exam_id = ? ORDER BY eq.sort_order
  `).all(req.params.id);
  return { ...summarizeExamForPublic(exam), questions: dedupeQuestionsByContent(questions) };
}

app.get('/api/public/exams/:id', (req, res) => {
  const payload = getPublicExamPayload(req, res);
  if (!payload) return;
  res.json(payload);
});

// GET exam for students (hides answers)
app.get('/api/exams/:id/take', (req, res) => {
  const payload = getPublicExamPayload(req, res);
  if (!payload) return;
  res.json(payload);
});

app.get('/api/public/exams/:id/take', (req, res) => {
  const payload = getPublicExamPayload(req, res);
  if (!payload) return;
  res.json(payload);
});

app.post('/api/public/exams/:id/session', (req, res) => {
  const { access_code } = req.body || {};
  const { name: student_name, student_id } = getStudentIdentity(req, req.body || {});
  if (!student_name) return res.status(400).json({ error: '缺少 student_name' });
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  const availability = examAvailability(exam, { ...req, body: { access_code } });
  if (!availability.ok) return res.status(availability.code).json({ error: availability.error, requires_access_code: availability.requires_access_code || false });

  const existing = db.prepare(`
    SELECT *
    FROM submissions
    WHERE exam_id = ?
      AND status = 'in_progress'
      AND (
        (? <> '' AND student_id = ?)
        OR (? <> '' AND student_name = ?)
      )
    ORDER BY id DESC
    LIMIT 1
  `).get(req.params.id, String(student_id || ''), String(student_id || ''), String(student_name || ''), String(student_name || ''));

  if (existing && exam.allow_resume) {
    return res.json({
      resumed: true,
      submission_id: existing.id,
      lookup_token: existing.lookup_token,
      answers: JSON.parse(existing.answers || '{}'),
      started_at: existing.started_at,
      last_seen_at: existing.last_seen_at,
      status: existing.status
    });
  }

  const priorAttempts = db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM submissions
    WHERE exam_id = ?
      AND status = 'submitted'
      AND (
        (? <> '' AND student_id = ?)
        OR (? <> '' AND student_name = ?)
      )
  `).get(req.params.id, String(student_id || ''), String(student_id || ''), String(student_name || ''), String(student_name || '')).cnt;
  if ((exam.max_attempts || 0) > 0 && priorAttempts >= exam.max_attempts) {
    return res.status(403).json({ error: '已達此試卷可作答次數上限' });
  }

  const lookupToken = crypto.randomBytes(12).toString('hex');
  const created = db.prepare(`
    INSERT INTO submissions (exam_id, student_name, student_id, answers, score, total_score, lookup_token, started_at, last_seen_at, status)
    VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, 'in_progress')
  `).run(req.params.id, student_name, student_id || null, '{}', lookupToken, datetimeNow(), datetimeNow());
  res.json({
    resumed: false,
    submission_id: created.lastInsertRowid,
    lookup_token: lookupToken,
    answers: {},
    started_at: datetimeNow(),
    status: 'in_progress'
  });
});

app.post('/api/exams', requireAdmin, (req, res) => {
  const {
    title, description, duration_min = 40, status = 'active', question_ids,
    starts_at = null, ends_at = null, access_code = null, max_attempts = 0, allow_resume = 1
  } = req.body;
  if (!title) return res.status(400).json({ error: '試卷標題為必填' });
  if (!['draft', 'active', 'closed'].includes(status))
    return res.status(400).json({ error: '狀態值無效' });
  const normalizedQuestionIds = normalizeExamQuestionIds(question_ids);
  // L-2: Transaction 保護多步驟寫入
  const createExam = db.transaction(() => {
    const exam = db.prepare(`
      INSERT INTO exams (title, description, duration_min, status, starts_at, ends_at, access_code, max_attempts, allow_resume)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(
      title, description||null, duration_min, status,
      starts_at || null, ends_at || null, access_code || null,
      Math.max(0, parseInt(max_attempts, 10) || 0),
      allow_resume ? 1 : 0
    );
    if (normalizedQuestionIds.length) {
      const ins = db.prepare(`INSERT INTO exam_questions (exam_id,question_id,sort_order,score) VALUES (?,?,?,?)`);
      normalizedQuestionIds.forEach((qid, i) => ins.run(exam.lastInsertRowid, qid.id, i + 1, qid.score));
    }
    return exam.lastInsertRowid;
  });
  const id = createExam();
  res.json({ id, message: '試卷建立成功' });
});

app.put('/api/exams/:id', requireAdmin, (req, res) => {
  const { title, description, duration_min, status, question_ids, starts_at, ends_at, access_code, max_attempts, allow_resume } = req.body;
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: '找不到試卷' });
  const normalizedQuestionIds = question_ids ? normalizeExamQuestionIds(question_ids) : null;
  // L-2: Transaction 保護；使用 COALESCE 支援部分欄位更新
  const updateExam = db.transaction(() => {
    db.prepare(`
      UPDATE exams SET
        title=COALESCE(?,title), description=COALESCE(?,description),
        duration_min=COALESCE(?,duration_min), status=COALESCE(?,status),
        starts_at=?, ends_at=?, access_code=?, max_attempts=?, allow_resume=?
      WHERE id=?
    `).run(
      title||null, description||null, duration_min||null, status||null,
      starts_at === undefined ? exam.starts_at : (starts_at || null),
      ends_at === undefined ? exam.ends_at : (ends_at || null),
      access_code === undefined ? exam.access_code : (access_code || null),
      max_attempts === undefined ? exam.max_attempts : Math.max(0, parseInt(max_attempts, 10) || 0),
      allow_resume === undefined ? exam.allow_resume : (allow_resume ? 1 : 0),
      req.params.id
    );
    if (normalizedQuestionIds) {
      db.prepare(`DELETE FROM exam_questions WHERE exam_id = ?`).run(req.params.id);
      const ins = db.prepare(`INSERT INTO exam_questions (exam_id,question_id,sort_order,score) VALUES (?,?,?,?)`);
      normalizedQuestionIds.forEach((qid, i) => ins.run(req.params.id, qid.id, i + 1, qid.score));
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
      count = 5, grade_level = 'junior_high', hint = '', essay_topic = ''
    } = req.body;

    if (!subject_id) return res.status(400).json({ error: '必須指定科目 subject_id' });

    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subject_id);
    if (!subject) return res.status(404).json({ error: '找不到指定科目' });

    const isEssaySubject = subject.code.startsWith('ESSAY');
    const typeLabel = { choice: '單選題（A/B/C/D）', true_false: '是非題（T/F）', fill: '填空題', calculation: '計算題', listening: '英語聽力選擇題', cloze: 'GEPT 段落填空', reading: 'GEPT 閱讀理解', writing: isEssaySubject ? '國文作文' : 'GEPT 寫作', speaking: 'GEPT 口說' }[type] || type;
    const gradeLabelMap = {elementary_6:'國小六年級',junior_high:'升國中（資優班）',grade_7:'國一（七年級）',grade_8:'國二（八年級）',grade_9:'國三（九年級）',bctest:'國中教育會考',gept_elementary:'全民英檢初級'};
    const gradeLabel = gradeLabelMap[grade_level] || '升國中（資優班）';

    let userPrompt;
    if (isEssaySubject && type === 'writing') {
      userPrompt = `請出 ${count} 道適合${gradeLabel}學生的國文作文題目，難度 ${difficulty}/5（1 最易，5 最難）。
題目必須是繁體中文，請勿要求學生用英文寫作。
${essay_topic ? `作文主題限定為：「${essay_topic}」，所有題目必須圍繞此主題設計，不得跑題。\n` : ''}每道題目請包含：
- content: 作文題目說明（繁體中文，明確描述寫作主題、體裁（記敘文/說明文/議論文等）、字數要求與需涵蓋的要點）
- answer: 評分規準（例如：「至少200字，主題明確，結構完整，語言流暢」）
- explanation: 出題說明（說明此題的評量目標與批改重點）
- tags: 作文類型標籤，逗號分隔（例如：「記敘文,寫景,抒情」）
- option_a, option_b, option_c, option_d: 一律填 null（作文題無選項）
${hint ? `補充要求：${hint}` : ''}
${essay_topic ? '' : '請確保題目主題多元（生活經驗、自然景物、人物描寫、議題思考等），'}符合${gradeLabel}的學習程度與語文能力。`;
    } else {
      userPrompt = `請出 ${count} 題「${subject.name}」${gradeLabel}的${typeLabel}，難度 ${difficulty}/5（1 最易，5 最難）。
請使用自然、可直接顯示的繁體中文純文字，不要使用 LaTeX、不要使用 Markdown 數學語法，也不要使用特殊數學排版符號。
若有數學條件，請改寫成一般文字，例如「A不等於0」、「三位數 ABC」、「x平方」。
${hint ? `補充要求：${hint}` : ''}`;
    }

    const generated = dedupeQuestionsByContent(await generateQuestions(provider, userPrompt));
    const preview = [];
    for (const q of generated.slice(0, count * 2)) {
      const candidate = {
        subject_id,
        subject_name: subject.name,
        type,
        difficulty: parseInt(difficulty, 10),
        grade_level,
        content: q.content || '',
        option_a: q.option_a || null,
        option_b: q.option_b || null,
        option_c: q.option_c || null,
        option_d: q.option_d || null,
        answer: q.answer || '',
        explanation: q.explanation || null,
        tags: q.tags || null,
        audio_transcript: q.audio_transcript || null,
        validation_errors: validateQuestionShape({
          ...q,
          subject_id,
          type,
          difficulty,
          grade_level
        })
      };
      const duplicate = findDuplicateQuestion({ content: candidate.content, grade_level });
      candidate.is_duplicate = !!duplicate;
      if (duplicate) candidate.validation_errors.push(`與既有題目 #${duplicate.id} 重覆`);
      preview.push(candidate);
      if (preview.length >= count) break;
    }

    res.json({
      provider,
      count: preview.length,
      questions: preview,
      summary: {
        valid_count: preview.filter(q => !q.validation_errors.length).length,
        duplicate_count: preview.filter(q => q.is_duplicate).length
      }
    });
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
      (subject_id,type,difficulty,content,option_a,option_b,option_c,option_d,answer,explanation,source,tags,grade_level,
       audio_url,audio_transcript,image_url,passage_id,passage_content,normalized_content,content_hash,review_status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insertAll = db.transaction((items) => {
    const ids = [];
    for (const q of items) {
      if (!['elementary_6', 'junior_high', 'grade_7', 'grade_8', 'grade_9', 'bctest', 'gept_elementary'].includes(q.grade_level || 'junior_high'))
        throw new Error('學段值無效');
      const prepared = upsertQuestionPayload(q, { actor: getAdminActor(req) });
      if (!prepared.ok) throw new Error(prepared.error);
      const item = prepared.record;
      const r = ins.run(
        item.subject_id, item.type, item.difficulty, item.content,
        item.option_a, item.option_b, item.option_c, item.option_d,
        item.answer, item.explanation, item.source, item.tags,
        item.grade_level, item.audio_url, item.audio_transcript, item.image_url, item.passage_id, item.passage_content,
        item.normalized_content, item.content_hash, item.review_status
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
app.put('/api/public/submissions/:id/progress', (req, res) => {
  const { lookup_token, answers } = req.body || {};
  if (!lookup_token) return res.status(400).json({ error: '缺少查詢碼' });
  const submission = db.prepare(`SELECT * FROM submissions WHERE id = ?`).get(req.params.id);
  if (!submission) return res.status(404).json({ error: '找不到作答 session' });
  if (submission.lookup_token !== lookup_token) return res.status(403).json({ error: '查詢碼錯誤' });
  if (submission.status !== 'in_progress') return res.status(400).json({ error: '此作答已完成，無法再更新進度' });
  const now = datetimeNow();
  db.prepare(`
    UPDATE submissions
    SET answers = ?, last_seen_at = ?
    WHERE id = ?
  `).run(JSON.stringify(answers || {}), now, req.params.id);
  res.json({ success: true, last_seen_at: now });
});

app.post('/api/exams/:id/submit', submitLimiter, (req, res) => {
  const { answers, access_code, submission_id, lookup_token } = req.body;
  const { name: student_name, student_id } = getStudentIdentity(req, req.body || {});
  if (!student_name || !answers) return res.status(400).json({ error: '缺少必要資料' });

  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
  const availability = examAvailability(exam, { ...req, body: { access_code } });
  if (!availability.ok) return res.status(availability.code).json({ error: availability.error });
  const existingSubmission = submission_id
    ? db.prepare(`SELECT * FROM submissions WHERE id = ? AND exam_id = ?`).get(submission_id, req.params.id)
    : null;
  if (existingSubmission) {
    if (existingSubmission.lookup_token !== lookup_token) return res.status(403).json({ error: '查詢碼錯誤' });
    if (existingSubmission.status === 'submitted') return res.status(400).json({ error: '此作答已經繳交' });
  }
  const priorAttempts = db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM submissions
    WHERE exam_id = ?
      AND status = 'submitted'
      AND (
        (? <> '' AND student_id = ?)
        OR (? <> '' AND student_name = ?)
      )
  `).get(req.params.id, String(student_id || ''), String(student_id || ''), String(student_name || ''), String(student_name || '')).cnt;
  if ((exam.max_attempts || 0) > 0 && priorAttempts >= exam.max_attempts && !existingSubmission) {
    return res.status(403).json({ error: '已達此試卷可作答次數上限' });
  }

  const questions = db.prepare(`
    SELECT eq.question_id, eq.score, q.answer, q.type
    FROM exam_questions eq JOIN questions q ON q.id = eq.question_id
    WHERE eq.exam_id = ?
  `).all(req.params.id);

  const DONT_KNOW = '__dont_know__';
  const MANUAL_GRADE_TYPES = ['writing', 'speaking'];

  let totalScore = 0;
  let earnedScore = 0;
  const details = questions.map(q => {
    totalScore += q.score;
    const given = (answers[q.question_id] || '').toString().trim();
    const isDontKnow = given === DONT_KNOW;
    const isManual = MANUAL_GRADE_TYPES.includes(q.type);
    const correct = q.answer.toString().trim();

    let isCorrect, scoreEarned, gradingStatus;
    if (isDontKnow) {
      isCorrect = 0; scoreEarned = 0; gradingStatus = 'auto';
    } else if (isManual) {
      // 寫作/口說由人工批改
      isCorrect = null; scoreEarned = 0; gradingStatus = 'pending';
    } else if (q.type === 'cloze') {
      // 段落填空：答案用 | 分隔，逐格比對
      const correctParts = correct.split('|').map(s => s.trim().toLowerCase());
      const givenParts = given.split('|').map(s => s.trim().toLowerCase());
      const allCorrect = correctParts.every((cp, i) => cp === (givenParts[i] || ''));
      isCorrect = allCorrect ? 1 : 0;
      scoreEarned = isCorrect ? q.score : 0;
      gradingStatus = 'auto';
    } else {
      isCorrect = given.toLowerCase() === correct.toLowerCase() ? 1 : 0;
      scoreEarned = isCorrect ? q.score : 0;
      gradingStatus = 'auto';
    }
    earnedScore += scoreEarned;
    return { question_id: q.question_id, given_answer: given, is_correct: isCorrect, score_earned: scoreEarned, is_dont_know: isDontKnow, grading_status: gradingStatus };
  });

  // L-2: Transaction 保護提交與明細寫入，同步更新答對/答錯/不會次數
  const saveSubmission = db.transaction(() => {
    const now = datetimeNow();
    let submissionRowId;
    let persistedLookupToken;
    if (existingSubmission) {
      db.prepare(`DELETE FROM answer_details WHERE submission_id = ?`).run(existingSubmission.id);
      db.prepare(`
        UPDATE submissions
        SET student_name = ?, student_id = ?, answers = ?, score = ?, total_score = ?, last_seen_at = ?, status = 'submitted'
        WHERE id = ?
      `).run(student_name, student_id || null, JSON.stringify(answers), earnedScore, totalScore, now, existingSubmission.id);
      submissionRowId = existingSubmission.id;
      persistedLookupToken = existingSubmission.lookup_token;
    } else {
      persistedLookupToken = crypto.randomBytes(12).toString('hex');
      const sub = db.prepare(`
        INSERT INTO submissions (exam_id, student_name, student_id, answers, score, total_score, lookup_token, started_at, last_seen_at, status)
        VALUES (?,?,?,?,?,?,?,?,?,?)
      `).run(
        req.params.id, student_name, student_id||null, JSON.stringify(answers), earnedScore, totalScore,
        persistedLookupToken, now, now, 'submitted'
      );
      submissionRowId = sub.lastInsertRowid;
    }
    const insDetail   = db.prepare(`INSERT INTO answer_details (submission_id,question_id,given_answer,is_correct,score_earned,grading_status) VALUES (?,?,?,?,?,?)`);
    const updCorrect  = db.prepare(`UPDATE questions SET correct_count    = correct_count    + 1 WHERE id = ?`);
    const updWrong    = db.prepare(`UPDATE questions SET wrong_count      = wrong_count      + 1 WHERE id = ?`);
    const updDontKnow = db.prepare(`UPDATE questions SET dont_know_count  = dont_know_count  + 1 WHERE id = ?`);
    details.forEach(d => {
      insDetail.run(submissionRowId, d.question_id, d.given_answer, d.is_correct, d.score_earned, d.grading_status);
      if (d.is_correct === 1) updCorrect.run(d.question_id);
      else if (d.is_dont_know) updDontKnow.run(d.question_id);
      else if (d.grading_status !== 'pending') updWrong.run(d.question_id);
    });
    return { id: submissionRowId, lookup_token: persistedLookupToken };
  });
  const submissionId = saveSubmission();

  // 非同步重新評估題目品質（不阻塞回應）
  setImmediate(() => archiveAndReplace());

  res.json({
    submission_id: submissionId.id,
    lookup_token: submissionId.lookup_token,
    score: earnedScore,
    total_score: totalScore,
    percentage: Math.round(earnedScore / totalScore * 100)
  });
});

app.post('/api/public/audio/upload', (req, res, next) => {
  upload.single('audio')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: '未收到音訊檔案' });
    const audioUrl = `/audio/${req.file.filename}`;
    res.json({ audio_url: audioUrl, filename: req.file.filename });
  });
});

// 重新評估高作答題目的品質，改為送審而不是直接封存
async function archiveAndReplace() {
  const toArchive = db.prepare(`
    SELECT q.*, s.name as subject_name, s.code as subject_code
    FROM questions q JOIN subjects s ON s.id = q.subject_id
    WHERE q.is_archived = 0
      AND (q.correct_count + q.wrong_count) >= 10
      AND (q.correct_count >= 8 OR q.wrong_count >= 8)
  `).all();
  if (!toArchive.length) return;

  for (const q of toArchive) {
    const totalAttempts = (q.correct_count || 0) + (q.wrong_count || 0);
    const passRate = totalAttempts > 0 ? (q.correct_count || 0) / totalAttempts : 0;
    const empiricalDifficulty = passRate >= 0.8 ? 1 : passRate >= 0.6 ? 2 : passRate >= 0.4 ? 3 : passRate >= 0.2 ? 4 : 5;
    const governance = computeQuestionGovernance(q, {
      total_attempts: totalAttempts,
      empirical_difficulty: empiricalDifficulty,
      quality_score: Math.max(0, 100 - (Math.abs(empiricalDifficulty - q.difficulty) >= 2 ? 20 : 0) - (passRate >= 0.95 || passRate <= 0.05 ? 20 : 0))
    });
    if (governance.reviewStatus !== 'needs_review') continue;
    persistQuestionGovernance(q.id, governance);
    console.log(`[QualityReview] 題目 #${q.id}（${q.subject_name}，難度${q.difficulty}）已列入審查清單`);
  }
}

// GET submission result
app.get('/api/submissions/lookup', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: '缺少查詢碼' });
  const row = db.prepare(`
    SELECT s.id, s.exam_id, s.student_name, s.student_id, s.score, s.total_score, s.submitted_at, s.status,
           e.title AS exam_title
    FROM submissions s
    JOIN exams e ON e.id = s.exam_id
    WHERE s.lookup_token = ?
    ORDER BY s.id DESC
    LIMIT 1
  `).get(String(token));
  if (!row) return res.status(404).json({ error: '找不到符合的作答紀錄' });
  res.json(row);
});

app.get('/api/student/submissions', requireStudent, (req, res) => {
  const studentName = String(req.student?.name || '').trim();
  const studentId = String(req.student?.student_id || '').trim();
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
  if (!studentName && !studentId) return res.json({ submissions: [] });
  const rows = studentId
    ? db.prepare(`
      SELECT s.id, s.exam_id, s.student_name, s.student_id, s.score, s.total_score,
             s.submitted_at, s.status, s.lookup_token, e.title AS exam_title
      FROM submissions s
      JOIN exams e ON e.id = s.exam_id
      WHERE s.status = 'submitted'
        AND s.student_id = ?
      ORDER BY s.submitted_at DESC, s.id DESC
      LIMIT ?
    `).all(studentId, limit)
    : db.prepare(`
      SELECT s.id, s.exam_id, s.student_name, s.student_id, s.score, s.total_score,
             s.submitted_at, s.status, s.lookup_token, e.title AS exam_title
      FROM submissions s
      JOIN exams e ON e.id = s.exam_id
      WHERE s.status = 'submitted'
        AND s.student_name = ?
      ORDER BY s.submitted_at DESC, s.id DESC
      LIMIT ?
    `).all(studentName, limit);
  res.json({
    student: req.student,
    submissions: rows
  });
});

app.get('/api/submissions/:id', (req, res) => {
  const token = String(req.query.token || '');
  if (!token) return res.status(403).json({ error: '缺少查詢碼' });
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: '找不到作答紀錄' });
  if (sub.lookup_token !== token) return res.status(403).json({ error: '查詢碼錯誤' });
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
  const token = String(req.query.token || '');
  if (!token) return res.status(403).json({ error: '缺少查詢碼' });
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: '找不到作答紀錄' });
  if (sub.lookup_token !== token) return res.status(403).json({ error: '查詢碼錯誤' });

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
  const gradedDetails = details.filter(d => d.grading_status !== 'pending');
  const pendingDetails = details.filter(d => d.grading_status === 'pending');

  // 各科目統計
  const bySubject = {};
  gradedDetails.forEach(d => {
    if (!bySubject[d.subject_name]) bySubject[d.subject_name] = { correct: 0, wrong: 0, score: 0, total: 0, pending: 0 };
    bySubject[d.subject_name].total++;
    if (d.is_correct) bySubject[d.subject_name].correct++;
    else bySubject[d.subject_name].wrong++;
    bySubject[d.subject_name].score += d.score_earned;
  });
  pendingDetails.forEach(d => {
    if (!bySubject[d.subject_name]) bySubject[d.subject_name] = { correct: 0, wrong: 0, score: 0, total: 0, pending: 0 };
    bySubject[d.subject_name].pending++;
  });

  // 各難度統計
  const byDifficulty = {};
  for (let i = 1; i <= 5; i++) byDifficulty[i] = { correct: 0, wrong: 0, total: 0, pending: 0 };
  gradedDetails.forEach(d => {
    const diff = d.difficulty || 1;
    byDifficulty[diff].total++;
    if (d.is_correct) byDifficulty[diff].correct++;
    else byDifficulty[diff].wrong++;
  });
  pendingDetails.forEach(d => {
    const diff = d.difficulty || 1;
    byDifficulty[diff].pending++;
  });

  // 弱點題目（答錯的題目）
  const weakQuestions = gradedDetails.filter(d => !d.is_correct).map(d => ({
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
  if (pendingDetails.length) suggestions.push(`另有 ${pendingDetails.length} 題寫作或口說題待老師批改，分析結果暫未納入這些題目。`);

  // Rasch ability estimation per subject
  const abilityBySubject = {};
  gradedDetails.forEach(d => {
    if (!abilityBySubject[d.subject_name]) abilityBySubject[d.subject_name] = [];
    abilityBySubject[d.subject_name].push({ difficulty: d.difficulty, is_correct: d.is_correct });
  });
  const ability_profile = Object.entries(abilityBySubject).map(([name, responses]) => ({
    subject_name: name,
    ability: estimateAbilityRasch(responses),
    sample_size: responses.length,
    pass_rate: Math.round(responses.filter(r => r.is_correct).length / responses.length * 100)
  }));
  const overall_ability = estimateAbilityRasch(gradedDetails.map(d => ({ difficulty: d.difficulty, is_correct: d.is_correct })));

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
    graded_questions: gradedDetails.length,
    pending_count: pendingDetails.length,
    correct_count: gradedDetails.filter(d => d.is_correct).length,
    wrong_count: gradedDetails.filter(d => !d.is_correct && d.given_answer !== '__dont_know__').length,
    dont_know_count: details.filter(d => d.given_answer === '__dont_know__').length,
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

// GET answer_details pending manual grading for an exam
app.get('/api/exams/:id/pending-grading', requireAdmin, (req, res) => {
  const { type } = req.query;
  const validType = ['writing', 'speaking'].includes(type) ? type : null;
  const status = req.query.status === 'graded' ? 'graded' : 'pending';
  const rows = db.prepare(`
    SELECT ad.id, ad.submission_id, ad.question_id, ad.given_answer, ad.grading_status,
           ad.rubric_score, ad.reviewer_notes, ad.audio_answer_url,
           ad.ai_score, ad.ai_notes,
           ad.dim_content, ad.dim_structure, ad.dim_language, ad.dim_norms,
           q.content, q.type, q.answer, q.explanation, q.model_essay, eq.score as max_score,
           s.student_name, s.student_id, s.submitted_at
    FROM answer_details ad
    JOIN questions q ON q.id = ad.question_id
    JOIN exam_questions eq ON eq.question_id = ad.question_id AND eq.exam_id = ?
    JOIN submissions s ON s.id = ad.submission_id
    WHERE s.exam_id = ? AND ad.grading_status = ?
      AND (? IS NULL OR q.type = ?)
    ORDER BY s.submitted_at DESC
  `).all(req.params.id, req.params.id, status, validType, validType);
  res.json(rows);
});

// PUT grade a specific answer_detail (manual grading for writing/speaking)
app.put('/api/answer-details/:id/grade', requireAdmin, (req, res) => {
  const { rubric_score, reviewer_notes, dim_content, dim_structure, dim_language, dim_norms } = req.body;
  if (rubric_score === undefined || rubric_score === null) return res.status(400).json({ error: '缺少 rubric_score' });
  const ad = db.prepare('SELECT * FROM answer_details WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: '找不到作答明細' });
  const eq = db.prepare('SELECT score FROM exam_questions WHERE question_id = ? AND exam_id = (SELECT exam_id FROM submissions WHERE id = ?)').get(ad.question_id, ad.submission_id);
  const maxScore = eq ? eq.score : 0;
  const finalScore = Math.min(Math.max(parseFloat(rubric_score) || 0, 0), maxScore);
  const nextIsCorrect = finalScore >= maxScore ? 1 : 0;
  db.transaction(() => {
    const decCorrect = db.prepare(`UPDATE questions SET correct_count = CASE WHEN correct_count > 0 THEN correct_count - 1 ELSE 0 END WHERE id = ?`);
    const decWrong = db.prepare(`UPDATE questions SET wrong_count = CASE WHEN wrong_count > 0 THEN wrong_count - 1 ELSE 0 END WHERE id = ?`);
    const incCorrect = db.prepare(`UPDATE questions SET correct_count = correct_count + 1 WHERE id = ?`);
    const incWrong = db.prepare(`UPDATE questions SET wrong_count = wrong_count + 1 WHERE id = ?`);
    if (ad.grading_status === 'graded') {
      if (ad.is_correct === 1) decCorrect.run(ad.question_id);
      else if (ad.is_correct === 0) decWrong.run(ad.question_id);
    }
    db.prepare(`UPDATE answer_details SET grading_status='graded', rubric_score=?, reviewer_notes=?, is_correct=?, score_earned=?,
      dim_content=?, dim_structure=?, dim_language=?, dim_norms=? WHERE id=?`)
      .run(finalScore, reviewer_notes || null, nextIsCorrect, finalScore,
        dim_content ?? null, dim_structure ?? null, dim_language ?? null, dim_norms ?? null,
        req.params.id);
    if (nextIsCorrect === 1) incCorrect.run(ad.question_id);
    else incWrong.run(ad.question_id);
    // Update submission score
    const totals = db.prepare(`SELECT SUM(COALESCE(rubric_score, score_earned)) as earned FROM answer_details WHERE submission_id=?`).get(ad.submission_id);
    db.prepare(`UPDATE submissions SET score=? WHERE id=?`).run(totals.earned || 0, ad.submission_id);
  })();
  res.json({ success: true, score_earned: finalScore });
});

// POST AI grade a writing answer_detail
app.post('/api/answer-details/:id/ai-grade', requireAdmin, async (req, res) => {
  const ad = db.prepare('SELECT * FROM answer_details WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: '找不到作答明細' });
  const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(ad.question_id);
  if (!q) return res.status(404).json({ error: '找不到題目' });
  const eq = db.prepare('SELECT score FROM exam_questions WHERE question_id = ? AND exam_id = (SELECT exam_id FROM submissions WHERE id = ?)').get(ad.question_id, ad.submission_id);
  const maxScore = eq ? eq.score : 10;
  const validProviders = ['openai', 'gemini', 'claude'];
  const provider = validProviders.includes(req.body?.provider) ? req.body.provider : (process.env.LLM_PROVIDER || 'gemini');
  try {
    const { score, notes, dim_content, dim_structure, dim_language, dim_norms } = await gradeEssay(provider, q.content, ad.given_answer || '', q.answer || '', maxScore);
    db.prepare('UPDATE answer_details SET ai_score=?, ai_notes=?, dim_content=?, dim_structure=?, dim_language=?, dim_norms=? WHERE id=?')
      .run(score, notes, dim_content, dim_structure, dim_language, dim_norms, req.params.id);
    res.json({ success: true, ai_score: score, ai_notes: notes, dim_content, dim_structure, dim_language, dim_norms });
  } catch (e) {
    res.status(500).json({ error: 'AI 批改失敗：' + e.message });
  }
});

// POST AI generate model essay for a question
app.post('/api/questions/:id/model-essay', requireAdmin, async (req, res) => {
  const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!q) return res.status(404).json({ error: '找不到題目' });
  const validProviders = ['openai', 'gemini', 'claude'];
  const provider = validProviders.includes(req.body?.provider) ? req.body.provider : (process.env.LLM_PROVIDER || 'gemini');
  try {
    const essay = await generateModelEssay(provider, q.content, q.grade_level || 'grade_7');
    db.prepare('UPDATE questions SET model_essay=? WHERE id=?').run(essay, req.params.id);
    res.json({ success: true, model_essay: essay });
  } catch (e) {
    res.status(500).json({ error: 'AI 範文產生失敗：' + e.message });
  }
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

app.get('/api/students/wrong-book', requireAdmin, (req, res) => {
  const { student_name, student_id, grade_level } = req.query;
  if (!student_name && !student_id) return res.status(400).json({ error: '請提供 student_name 或 student_id' });
  const where = ['1=1'];
  const params = [];
  if (student_name) { where.push('s.student_name = ?'); params.push(student_name); }
  if (student_id) { where.push('s.student_id = ?'); params.push(student_id); }
  if (grade_level) { where.push('q.grade_level = ?'); params.push(grade_level); }
  const rows = db.prepare(`
    SELECT q.id, q.content, q.answer, q.explanation, q.difficulty, q.grade_level, sub.name AS subject_name,
           COUNT(*) AS wrong_count,
           MAX(s.submitted_at) AS last_wrong_at
    FROM answer_details ad
    JOIN submissions s ON s.id = ad.submission_id
    JOIN questions q ON q.id = ad.question_id
    JOIN subjects sub ON sub.id = q.subject_id
    WHERE ad.is_correct = 0 AND ${where.join(' AND ')}
    GROUP BY q.id
    ORDER BY wrong_count DESC, last_wrong_at DESC
    LIMIT 200
  `).all(...params);
  res.json(rows);
});

function toCsv(rows) {
  if (!rows.length) return '';
  const columns = Object.keys(rows[0]);
  const escapeCell = (value) => {
    const text = value == null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [columns.join(','), ...rows.map(row => columns.map(col => escapeCell(row[col])).join(','))].join('\n');
}

app.get('/api/export/questions.csv', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT q.id, s.name AS subject_name, q.grade_level, q.type, q.difficulty, q.review_status,
           q.quality_score, q.is_archived, q.archived_reason, q.content
    FROM questions q
    JOIN subjects s ON s.id = q.subject_id
    ORDER BY q.grade_level, q.subject_id, q.id
  `).all();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=\"question-bank.csv\"');
  res.send('\uFEFF' + toCsv(rows));
});

app.get('/api/export/exams/:id/stats.csv', requireAdmin, (req, res) => {
  const exam = db.prepare('SELECT title FROM exams WHERE id = ?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: '找不到試卷' });
  const rows = db.prepare(`
    SELECT student_name, student_id, score, total_score,
           ROUND(score * 100.0 / NULLIF(total_score,0), 1) AS percentage,
           submitted_at
    FROM submissions
    WHERE exam_id = ?
    ORDER BY submitted_at DESC
  `).all(req.params.id);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=\"exam-${req.params.id}-stats.csv\"`);
  res.send('\uFEFF' + toCsv(rows));
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
    const qs = db.prepare(`SELECT q.*, s.name as subject_name FROM questions q JOIN subjects s ON s.id = q.subject_id WHERE ${w.join(' AND ')} ORDER BY RANDOM() LIMIT ?`).all(...p, n * 5);
    const uniqueQs = dedupeQuestionsByContent(qs).slice(0, n);
    return res.json({ recommendations: uniqueQs, context: { reason: '無歷史資料，隨機推薦' } });
  }

  const swhere = ['1=1']; const sparams = [];
  if (student_name) { swhere.push('student_name = ?'); sparams.push(student_name); }
  if (student_id)   { swhere.push('student_id = ?');   sparams.push(student_id); }
  const subs = db.prepare(`SELECT id FROM submissions WHERE ${swhere.join(' AND ')}`).all(...sparams);

  if (!subs.length) {
    const w = ['q.is_archived = 0']; const p = [];
    if (grade_level) { w.push('q.grade_level = ?'); p.push(grade_level); }
    const qs = db.prepare(`SELECT q.*, s.name as subject_name FROM questions q JOIN subjects s ON s.id = q.subject_id WHERE ${w.join(' AND ')} ORDER BY RANDOM() LIMIT ?`).all(...p, n * 5);
    return res.json({ recommendations: dedupeQuestionsByContent(qs).slice(0, n), context: { reason: '無歷史資料，隨機推薦' } });
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

  let recs = dedupeQuestionsByContent(db.prepare(sql).all(...params));

  // Broaden if insufficient
  if (recs.length < n) {
    let sql2 = `SELECT q.*, s.name as subject_name FROM questions q JOIN subjects s ON s.id = q.subject_id WHERE q.is_archived = 0 ${excl}`;
    const p2 = [...excludeParams];
    if (targetSubjectId) { sql2 += ' AND q.subject_id = ?'; p2.push(targetSubjectId); }
    if (grade_level)     { sql2 += ' AND q.grade_level = ?'; p2.push(grade_level); }
    sql2 += ' ORDER BY RANDOM() LIMIT ?'; p2.push(n - recs.length);
    const existing = new Set(recs.map(r => r.id));
    recs = dedupeQuestionsByContent([...recs, ...db.prepare(sql2).all(...p2).filter(r => !existing.has(r.id))]);
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
app.listen(PORT, () => console.log(`\n升國中數理資優班考題系統\n   http://localhost:${PORT}\n`))
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n錯誤：Port ${PORT} 已被其他程式佔用。`);
      console.error(`   請先關閉佔用 port 的程式，或改用其他 port：`);
      console.error(`   set PORT=8080 && node server.js\n`);
    } else {
      console.error(`\n伺服器啟動失敗：${err.message}\n`);
    }
    process.exit(1);
  });
