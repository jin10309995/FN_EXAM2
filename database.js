const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'exam.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS subjects (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    UNIQUE(name, grade_level)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id   INTEGER NOT NULL REFERENCES subjects(id),
    type         TEXT NOT NULL CHECK(type IN ('choice','fill','calculation','listening')),
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

// Migration: add correct_count, wrong_count, is_archived columns to questions if not exists
{
  const qCols = db.prepare("PRAGMA table_info(questions)").all().map(c => c.name);
  if (!qCols.includes('correct_count')) {
    db.exec(`ALTER TABLE questions ADD COLUMN correct_count INTEGER DEFAULT 0`);
  }
  if (!qCols.includes('wrong_count')) {
    db.exec(`ALTER TABLE questions ADD COLUMN wrong_count INTEGER DEFAULT 0`);
  }
  if (!qCols.includes('is_archived')) {
    db.exec(`ALTER TABLE questions ADD COLUMN is_archived INTEGER DEFAULT 0`);
  }
}

// Migration: add audio_url and audio_transcript columns to questions if not exists
{
  const audioCols = db.prepare("PRAGMA table_info(questions)").all().map(c => c.name);
  if (!audioCols.includes('audio_url')) {
    db.exec(`ALTER TABLE questions ADD COLUMN audio_url TEXT`);
  }
  if (!audioCols.includes('audio_transcript')) {
    db.exec(`ALTER TABLE questions ADD COLUMN audio_transcript TEXT`);
  }
}

// Migration: add grade_level column to questions if not exists
const cols = db.prepare("PRAGMA table_info(questions)").all().map(c => c.name);
if (!cols.includes('grade_level')) {
  db.exec(`ALTER TABLE questions ADD COLUMN grade_level TEXT NOT NULL DEFAULT 'junior_high'`);
}

// Migration: add grade_level column to subjects if not exists
const subjectCols = db.prepare("PRAGMA table_info(subjects)").all().map(c => c.name);
if (!subjectCols.includes('grade_level')) {
  db.exec(`ALTER TABLE subjects ADD COLUMN grade_level TEXT NOT NULL DEFAULT 'junior_high'`);
  // 將國小六年級科目標記為 elementary_6
  db.exec(`UPDATE subjects SET grade_level = 'elementary_6' WHERE code IN ('CHN','ENG','SOC','NAT')`);
  // 新增「數學（國小）」科目
  db.prepare(`INSERT OR IGNORE INTO subjects (name, code, grade_level) VALUES ('數學','MATH_E','elementary_6')`).run();
  // 將原本 grade_level='elementary_6' 且 subject_id 指向「數學(MATH)」的題目，改連結到「數學(MATH_E)」
  const mathRow  = db.prepare(`SELECT id FROM subjects WHERE code = 'MATH'`).get();
  const mathERow = db.prepare(`SELECT id FROM subjects WHERE code = 'MATH_E'`).get();
  if (mathRow && mathERow) {
    db.prepare(`UPDATE questions SET subject_id = ? WHERE grade_level = 'elementary_6' AND subject_id = ?`)
      .run(mathERow.id, mathRow.id);
  }
}

// Migration: update questions type CHECK constraint to include 'listening'
{
  const schemaRow = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='questions'`).get();
  if (schemaRow && !schemaRow.sql.includes("'listening'")) {
    db.exec(`PRAGMA foreign_keys = OFF`);
    // legacy_alter_table prevents SQLite from auto-rewriting FK references in other
    // tables when we rename questions → questions_old, avoiding dangling references.
    db.exec(`PRAGMA legacy_alter_table = ON`);
    const migrateConstraint = db.transaction(() => {
      db.exec(`ALTER TABLE questions RENAME TO questions_old`);
      db.exec(`
        CREATE TABLE questions (
          id               INTEGER PRIMARY KEY AUTOINCREMENT,
          subject_id       INTEGER NOT NULL REFERENCES subjects(id),
          type             TEXT NOT NULL CHECK(type IN ('choice','fill','calculation','listening')),
          difficulty       INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 5),
          content          TEXT NOT NULL,
          option_a         TEXT,
          option_b         TEXT,
          option_c         TEXT,
          option_d         TEXT,
          answer           TEXT NOT NULL,
          explanation      TEXT,
          source           TEXT,
          tags             TEXT,
          created_at       TEXT DEFAULT (datetime('now','localtime')),
          updated_at       TEXT DEFAULT (datetime('now','localtime')),
          correct_count    INTEGER DEFAULT 0,
          wrong_count      INTEGER DEFAULT 0,
          is_archived      INTEGER DEFAULT 0,
          audio_url        TEXT,
          audio_transcript TEXT,
          grade_level      TEXT NOT NULL DEFAULT 'junior_high'
        )
      `);
      db.exec(`INSERT INTO questions
        (id, subject_id, type, difficulty, content, option_a, option_b, option_c, option_d,
         answer, explanation, source, tags, created_at, updated_at,
         correct_count, wrong_count, is_archived, audio_url, audio_transcript, grade_level)
        SELECT id, subject_id, type, difficulty, content, option_a, option_b, option_c, option_d,
         answer, explanation, source, tags, created_at, updated_at,
         COALESCE(correct_count, 0), COALESCE(wrong_count, 0), COALESCE(is_archived, 0),
         audio_url, audio_transcript, COALESCE(grade_level, 'junior_high')
        FROM questions_old`);
      db.exec(`DROP TABLE questions_old`);
    });
    migrateConstraint();
    db.exec(`PRAGMA legacy_alter_table = OFF`);
    db.exec(`PRAGMA foreign_keys = ON`);
  }
}

// Migration: fix broken FK references in exam_questions and answer_details caused by
// the previous migration which renamed questions→questions_old without legacy_alter_table,
// causing SQLite to auto-rewrite REFERENCES in dependent tables to "questions_old".
{
  const eqRow = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='exam_questions'`).get();
  if (eqRow && eqRow.sql.includes('"questions_old"')) {
    db.exec(`PRAGMA foreign_keys = OFF`);
    const fixFKs = db.transaction(() => {
      db.exec(`ALTER TABLE exam_questions RENAME TO exam_questions_bak`);
      db.exec(`
        CREATE TABLE exam_questions (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          exam_id     INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
          question_id INTEGER NOT NULL REFERENCES questions(id),
          sort_order  INTEGER NOT NULL DEFAULT 0,
          score       INTEGER NOT NULL DEFAULT 5
        )
      `);
      db.exec(`INSERT INTO exam_questions SELECT * FROM exam_questions_bak`);
      db.exec(`DROP TABLE exam_questions_bak`);

      db.exec(`ALTER TABLE answer_details RENAME TO answer_details_bak`);
      db.exec(`
        CREATE TABLE answer_details (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
          question_id   INTEGER NOT NULL REFERENCES questions(id),
          given_answer  TEXT,
          is_correct    INTEGER,
          score_earned  REAL DEFAULT 0
        )
      `);
      db.exec(`INSERT INTO answer_details SELECT * FROM answer_details_bak`);
      db.exec(`DROP TABLE answer_details_bak`);
    });
    fixFKs();
    db.exec(`PRAGMA foreign_keys = ON`);
  }
}


const insertSubject = db.prepare(`INSERT OR IGNORE INTO subjects (name, code, grade_level) VALUES (?, ?, ?)`);
[
  // 升國中科目
  ['數學',     'MATH',  'junior_high'],
  ['自然科學', 'SCI',   'junior_high'],
  ['物理',     'PHY',   'junior_high'],
  ['化學',     'CHEM',  'junior_high'],
  ['生物',     'BIO',   'junior_high'],
  ['地球科學', 'EARTH', 'junior_high'],
  // 國小六年級科目
  ['國語',     'CHN',   'elementary_6'],
  ['英語',     'ENG',   'elementary_6'],
  ['社會',     'SOC',   'elementary_6'],
  ['自然',     'NAT',   'elementary_6'],
  ['數學',     'MATH_E','elementary_6'],
  // 國一（七年級）科目
  ['國文', 'CHN_7',  'grade_7'],
  ['數學', 'MATH_7', 'grade_7'],
  ['英語', 'ENG_7',  'grade_7'],
  ['自然', 'SCI_7',  'grade_7'],
  ['社會', 'SOC_7',  'grade_7'],
  // 國二（八年級）科目
  ['國文', 'CHN_8',  'grade_8'],
  ['數學', 'MATH_8', 'grade_8'],
  ['英語', 'ENG_8',  'grade_8'],
  ['自然', 'SCI_8',  'grade_8'],
  ['社會', 'SOC_8',  'grade_8'],
  // 國三（九年級）科目
  ['國文', 'CHN_9',  'grade_9'],
  ['數學', 'MATH_9', 'grade_9'],
  ['英語', 'ENG_9',  'grade_9'],
  ['自然', 'SCI_9',  'grade_9'],
  ['社會', 'SOC_9',  'grade_9'],
  // 國中教育會考科目
  ['國文', 'CHN_BC', 'bctest'],
  ['數學', 'MATH_BC','bctest'],
  ['英語', 'ENG_BC', 'bctest'],
  ['自然', 'SCI_BC', 'bctest'],
  ['社會', 'SOC_BC', 'bctest'],
].forEach(([name, code, grade_level]) => insertSubject.run(name, code, grade_level));

module.exports = db;
