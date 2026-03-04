const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'exam.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS subjects (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS questions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id   INTEGER NOT NULL REFERENCES subjects(id),
    type         TEXT NOT NULL CHECK(type IN ('choice','fill','calculation')),
    difficulty   INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 5),
    content      TEXT NOT NULL,
    option_a     TEXT,
    option_b     TEXT,
    option_c     TEXT,
    option_d     TEXT,
    answer       TEXT NOT NULL,
    explanation  TEXT,
    source       TEXT,
    tags         TEXT,
    created_at   TEXT DEFAULT (datetime('now','localtime')),
    updated_at   TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS exams (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    description  TEXT,
    duration_min INTEGER NOT NULL DEFAULT 60,
    status       TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','closed')),
    created_at   TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS exam_questions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id     INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id),
    sort_order  INTEGER NOT NULL DEFAULT 0,
    score       INTEGER NOT NULL DEFAULT 5
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id     INTEGER NOT NULL REFERENCES exams(id),
    student_name TEXT NOT NULL,
    student_id  TEXT,
    answers     TEXT NOT NULL,
    score       REAL,
    total_score REAL,
    submitted_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS answer_details (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    question_id   INTEGER NOT NULL REFERENCES questions(id),
    given_answer  TEXT,
    is_correct    INTEGER,
    score_earned  REAL DEFAULT 0
  );
`);

// Seed subjects
const insertSubject = db.prepare(`INSERT OR IGNORE INTO subjects (name, code) VALUES (?, ?)`);
[
  ['數學', 'MATH'],
  ['自然科學', 'SCI'],
  ['物理', 'PHY'],
  ['化學', 'CHEM'],
  ['生物', 'BIO'],
  ['地球科學', 'EARTH'],
].forEach(([name, code]) => insertSubject.run(name, code));

module.exports = db;
