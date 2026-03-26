const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const db = new Database(path.join(__dirname, 'exam.db'));

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
    type         TEXT NOT NULL CHECK(type IN ('choice','true_false','fill','calculation','listening')),
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
    student_account_id INTEGER,
    student_session_id INTEGER,
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

  CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name  TEXT,
    role          TEXT NOT NULL DEFAULT 'admin',
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT DEFAULT (datetime('now','localtime')),
    updated_at    TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    student_name  TEXT NOT NULL,
    student_id    TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT DEFAULT (datetime('now','localtime')),
    updated_at    TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id    INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now','localtime')),
    last_seen_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS student_sessions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    student_id   TEXT,
    student_account_id INTEGER,
    token_hash   TEXT NOT NULL UNIQUE,
    expires_at   TEXT NOT NULL,
    created_at   TEXT DEFAULT (datetime('now','localtime')),
    last_seen_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS question_versions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id   INTEGER NOT NULL,
    version_no    INTEGER NOT NULL,
    action        TEXT NOT NULL,
    changed_by    TEXT,
    snapshot_json TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now','localtime'))
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

// Migration: add dont_know_count column to questions if not exists
{
  const dkCols = db.prepare("PRAGMA table_info(questions)").all().map(c => c.name);
  if (!dkCols.includes('dont_know_count')) {
    db.exec(`ALTER TABLE questions ADD COLUMN dont_know_count INTEGER DEFAULT 0`);
  }
}

// Migration: add GEPT-specific columns to questions if not exists
{
  const gCols = db.prepare("PRAGMA table_info(questions)").all().map(c => c.name);
  if (!gCols.includes('image_url')) {
    db.exec(`ALTER TABLE questions ADD COLUMN image_url TEXT`);
  }
  if (!gCols.includes('passage_id')) {
    db.exec(`ALTER TABLE questions ADD COLUMN passage_id INTEGER`);
  }
  if (!gCols.includes('passage_content')) {
    db.exec(`ALTER TABLE questions ADD COLUMN passage_content TEXT`);
  }
}

// Migration: add GEPT-specific columns to answer_details if not exists
{
  const adCols = db.prepare("PRAGMA table_info(answer_details)").all().map(c => c.name);
  if (!adCols.includes('grading_status')) {
    db.exec(`ALTER TABLE answer_details ADD COLUMN grading_status TEXT DEFAULT 'auto'`);
  }
  if (!adCols.includes('rubric_score')) {
    db.exec(`ALTER TABLE answer_details ADD COLUMN rubric_score REAL`);
  }
  if (!adCols.includes('reviewer_notes')) {
    db.exec(`ALTER TABLE answer_details ADD COLUMN reviewer_notes TEXT`);
  }
  if (!adCols.includes('audio_answer_url')) {
    db.exec(`ALTER TABLE answer_details ADD COLUMN audio_answer_url TEXT`);
  }
  if (!adCols.includes('ai_score')) {
    db.exec(`ALTER TABLE answer_details ADD COLUMN ai_score REAL`);
  }
  if (!adCols.includes('ai_notes')) {
    db.exec(`ALTER TABLE answer_details ADD COLUMN ai_notes TEXT`);
  }
  if (!adCols.includes('dim_content')) {
    db.exec(`ALTER TABLE answer_details ADD COLUMN dim_content INTEGER`);
  }
  if (!adCols.includes('dim_structure')) {
    db.exec(`ALTER TABLE answer_details ADD COLUMN dim_structure INTEGER`);
  }
  if (!adCols.includes('dim_language')) {
    db.exec(`ALTER TABLE answer_details ADD COLUMN dim_language INTEGER`);
  }
  if (!adCols.includes('dim_norms')) {
    db.exec(`ALTER TABLE answer_details ADD COLUMN dim_norms INTEGER`);
  }
}

// Migration: add model_essay to questions
{
  const qCols = db.prepare('PRAGMA table_info(questions)').all().map(c => c.name);
  if (!qCols.includes('model_essay')) {
    db.exec(`ALTER TABLE questions ADD COLUMN model_essay TEXT`);
  }
  if (!qCols.includes('normalized_content')) {
    db.exec(`ALTER TABLE questions ADD COLUMN normalized_content TEXT`);
  }
  if (!qCols.includes('content_hash')) {
    db.exec(`ALTER TABLE questions ADD COLUMN content_hash TEXT`);
  }
  if (!qCols.includes('review_status')) {
    db.exec(`ALTER TABLE questions ADD COLUMN review_status TEXT DEFAULT 'approved'`);
  }
  if (!qCols.includes('quality_flags')) {
    db.exec(`ALTER TABLE questions ADD COLUMN quality_flags TEXT`);
  }
  if (!qCols.includes('quality_score')) {
    db.exec(`ALTER TABLE questions ADD COLUMN quality_score REAL`);
  }
  if (!qCols.includes('archived_reason')) {
    db.exec(`ALTER TABLE questions ADD COLUMN archived_reason TEXT`);
  }
  if (!qCols.includes('archived_at')) {
    db.exec(`ALTER TABLE questions ADD COLUMN archived_at TEXT`);
  }
  if (!qCols.includes('archived_by')) {
    db.exec(`ALTER TABLE questions ADD COLUMN archived_by TEXT`);
  }
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

// Migration: add exam operation control columns
{
  const examCols = db.prepare("PRAGMA table_info(exams)").all().map(c => c.name);
  if (!examCols.includes('starts_at')) {
    db.exec(`ALTER TABLE exams ADD COLUMN starts_at TEXT`);
  }
  if (!examCols.includes('ends_at')) {
    db.exec(`ALTER TABLE exams ADD COLUMN ends_at TEXT`);
  }
  if (!examCols.includes('access_code')) {
    db.exec(`ALTER TABLE exams ADD COLUMN access_code TEXT`);
  }
  if (!examCols.includes('max_attempts')) {
    db.exec(`ALTER TABLE exams ADD COLUMN max_attempts INTEGER DEFAULT 0`);
  }
  if (!examCols.includes('allow_resume')) {
    db.exec(`ALTER TABLE exams ADD COLUMN allow_resume INTEGER DEFAULT 1`);
  }
}

// Migration: add submission sharing / session columns
{
  const subCols = db.prepare("PRAGMA table_info(submissions)").all().map(c => c.name);
  if (!subCols.includes('student_account_id')) {
    db.exec(`ALTER TABLE submissions ADD COLUMN student_account_id INTEGER`);
  }
  if (!subCols.includes('student_session_id')) {
    db.exec(`ALTER TABLE submissions ADD COLUMN student_session_id INTEGER`);
  }
  if (!subCols.includes('lookup_token')) {
    db.exec(`ALTER TABLE submissions ADD COLUMN lookup_token TEXT`);
  }
  if (!subCols.includes('started_at')) {
    db.exec(`ALTER TABLE submissions ADD COLUMN started_at TEXT`);
  }
  if (!subCols.includes('last_seen_at')) {
    db.exec(`ALTER TABLE submissions ADD COLUMN last_seen_at TEXT`);
  }
  if (!subCols.includes('status')) {
    db.exec(`ALTER TABLE submissions ADD COLUMN status TEXT DEFAULT 'submitted'`);
  }
  if (!subCols.includes('short_code')) {
    db.exec(`ALTER TABLE submissions ADD COLUMN short_code TEXT`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_submissions_short_code ON submissions(short_code)`);
  }
}

// Migration: add student_account_id to student_sessions for account-bound ownership
{
  const ssCols = db.prepare("PRAGMA table_info(student_sessions)").all().map(c => c.name);
  if (!ssCols.includes('student_account_id')) {
    db.exec(`ALTER TABLE student_sessions ADD COLUMN student_account_id INTEGER`);
  }
}

// Migration: backfill account-bound ownership for legacy sessions/submissions
{
  const backfillStudentOwner = db.transaction(() => {
    // 1) Fill student_sessions.student_account_id by unique student_id.
    db.exec(`
      UPDATE student_sessions
      SET student_account_id = (
        SELECT st.id
        FROM students st
        WHERE st.student_id = student_sessions.student_id
        LIMIT 1
      )
      WHERE student_account_id IS NULL
        AND student_id IS NOT NULL
        AND TRIM(student_id) <> ''
        AND (
          SELECT COUNT(*)
          FROM students st2
          WHERE st2.student_id = student_sessions.student_id
        ) = 1
    `);

    // 2) Fill remaining sessions by unique student_name when student_id is empty.
    db.exec(`
      UPDATE student_sessions
      SET student_account_id = (
        SELECT st.id
        FROM students st
        WHERE st.student_name = student_sessions.student_name
        LIMIT 1
      )
      WHERE student_account_id IS NULL
        AND (student_id IS NULL OR TRIM(student_id) = '')
        AND (
          SELECT COUNT(*)
          FROM students st2
          WHERE st2.student_name = student_sessions.student_name
        ) = 1
    `);

    // 3) Fill submissions from already-bound session ownership.
    db.exec(`
      UPDATE submissions
      SET student_account_id = (
        SELECT ss.student_account_id
        FROM student_sessions ss
        WHERE ss.id = submissions.student_session_id
        LIMIT 1
      )
      WHERE student_account_id IS NULL
        AND student_session_id IS NOT NULL
    `);

    // 4) Fill remaining submissions by unique student_id.
    db.exec(`
      UPDATE submissions
      SET student_account_id = (
        SELECT st.id
        FROM students st
        WHERE st.student_id = submissions.student_id
        LIMIT 1
      )
      WHERE student_account_id IS NULL
        AND student_id IS NOT NULL
        AND TRIM(student_id) <> ''
        AND (
          SELECT COUNT(*)
          FROM students st2
          WHERE st2.student_id = submissions.student_id
        ) = 1
    `);

    // 5) Fill remaining submissions by unique student_name when student_id is empty.
    db.exec(`
      UPDATE submissions
      SET student_account_id = (
        SELECT st.id
        FROM students st
        WHERE st.student_name = submissions.student_name
        LIMIT 1
      )
      WHERE student_account_id IS NULL
        AND (student_id IS NULL OR TRIM(student_id) = '')
        AND (
          SELECT COUNT(*)
          FROM students st2
          WHERE st2.student_name = submissions.student_name
        ) = 1
    `);

    // 6) For account-owned submissions without session_id, attach latest account session.
    db.exec(`
      UPDATE submissions
      SET student_session_id = (
        SELECT ss.id
        FROM student_sessions ss
        WHERE ss.student_account_id = submissions.student_account_id
        ORDER BY ss.id DESC
        LIMIT 1
      )
      WHERE student_account_id IS NOT NULL
        AND student_session_id IS NULL
    `);
  });
  backfillStudentOwner();
}

// Migration: harden student ownership data integrity
{
  // 1) Enforce student_id uniqueness for non-empty IDs.
  const duplicateStudentIds = db.prepare(`
    SELECT student_id, COUNT(*) AS c
    FROM students
    WHERE student_id IS NOT NULL AND TRIM(student_id) <> ''
    GROUP BY student_id
    HAVING COUNT(*) > 1
  `).all();
  if (duplicateStudentIds.length === 0) {
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_id_unique_nonempty
      ON students(student_id)
      WHERE student_id IS NOT NULL AND TRIM(student_id) <> ''
    `);
  } else {
    console.warn(`[Migration] skip idx_students_student_id_unique_nonempty: found ${duplicateStudentIds.length} duplicate student_id groups`);
  }

  // 2) Remove invalid student_sessions that cannot map to a valid student account.
  db.exec(`
    DELETE FROM student_sessions
    WHERE student_account_id IS NULL
       OR student_account_id NOT IN (SELECT id FROM students)
  `);

  // 3) Rebuild student_sessions to enforce NOT NULL + FK on student_account_id.
  {
    const ssCols = db.prepare(`PRAGMA table_info(student_sessions)`).all();
    const ssAccountCol = ssCols.find(c => c.name === 'student_account_id');
    const ssFks = db.prepare(`PRAGMA foreign_key_list(student_sessions)`).all();
    const ssHasAccountFk = ssFks.some(f => f.from === 'student_account_id' && f.table === 'students');
    const ssNeedsRebuild = !ssAccountCol || ssAccountCol.notnull !== 1 || !ssHasAccountFk;
    if (ssNeedsRebuild) {
      db.exec(`PRAGMA foreign_keys = OFF`);
      db.exec(`PRAGMA legacy_alter_table = ON`);
      const rebuildStudentSessions = db.transaction(() => {
        db.exec(`ALTER TABLE student_sessions RENAME TO student_sessions_old`);
        db.exec(`
          CREATE TABLE student_sessions (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name       TEXT NOT NULL,
            student_id         TEXT,
            student_account_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            token_hash         TEXT NOT NULL UNIQUE,
            expires_at         TEXT NOT NULL,
            created_at         TEXT DEFAULT (datetime('now','localtime')),
            last_seen_at       TEXT DEFAULT (datetime('now','localtime'))
          )
        `);
        db.exec(`
          INSERT INTO student_sessions
            (id, student_name, student_id, student_account_id, token_hash, expires_at, created_at, last_seen_at)
          SELECT id, student_name, student_id, student_account_id, token_hash, expires_at, created_at, last_seen_at
          FROM student_sessions_old
        `);
        db.exec(`DROP TABLE student_sessions_old`);
      });
      rebuildStudentSessions();
      db.exec(`PRAGMA legacy_alter_table = OFF`);
      db.exec(`PRAGMA foreign_keys = ON`);
    }
  }

  // 4) Normalize submissions data before strict constraints.
  db.exec(`
    UPDATE submissions
    SET status = 'submitted'
    WHERE status IS NULL OR TRIM(status) = '' OR status NOT IN ('in_progress','submitted')
  `);
  db.exec(`
    UPDATE submissions
    SET student_account_id = (
      SELECT ss.student_account_id
      FROM student_sessions ss
      WHERE ss.id = submissions.student_session_id
      LIMIT 1
    )
    WHERE student_account_id IS NULL
      AND student_session_id IS NOT NULL
  `);
  db.exec(`
    UPDATE submissions
    SET student_session_id = NULL
    WHERE student_session_id IS NOT NULL
      AND student_session_id NOT IN (SELECT id FROM student_sessions)
  `);
  db.exec(`
    UPDATE submissions
    SET student_session_id = (
      SELECT ss.id
      FROM student_sessions ss
      WHERE ss.student_account_id = submissions.student_account_id
      ORDER BY ss.id DESC
      LIMIT 1
    )
    WHERE student_account_id IS NOT NULL
      AND student_session_id IS NULL
  `);

  // 5) Rebuild submissions with stronger constraints when data is clean.
  {
    const invalidSubmissionOwnerCount = db.prepare(`
      SELECT COUNT(*) AS c
      FROM submissions s
      LEFT JOIN students st ON st.id = s.student_account_id
      WHERE s.student_account_id IS NULL OR st.id IS NULL
    `).get().c;

    const subSchema = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='submissions'`).get();
    const subSql = String(subSchema?.sql || '');
    const subCols = db.prepare(`PRAGMA table_info(submissions)`).all();
    const subStatusCol = subCols.find(c => c.name === 'status');
    const subAccountCol = subCols.find(c => c.name === 'student_account_id');
    const subFks = db.prepare(`PRAGMA foreign_key_list(submissions)`).all();
    const subHasAccountFk = subFks.some(f => f.from === 'student_account_id' && f.table === 'students');
    const subHasSessionFk = subFks.some(f => f.from === 'student_session_id' && f.table === 'student_sessions');
    const subHasStatusCheck = /CHECK\s*\(\s*status\s+IN\s*\('in_progress','submitted'\)\s*\)/i.test(subSql);
    const subNeedsRebuild =
      !subStatusCol || subStatusCol.notnull !== 1 ||
      !subAccountCol || subAccountCol.notnull !== 1 ||
      !subHasAccountFk || !subHasSessionFk || !subHasStatusCheck;

    if (subNeedsRebuild) {
      if (invalidSubmissionOwnerCount > 0) {
        console.warn(`[Migration] skip submissions integrity hardening: found ${invalidSubmissionOwnerCount} rows without valid student_account_id`);
      } else {
        db.exec(`PRAGMA foreign_keys = OFF`);
        db.exec(`PRAGMA legacy_alter_table = ON`);
        const rebuildSubmissions = db.transaction(() => {
          db.exec(`ALTER TABLE submissions RENAME TO submissions_old`);
          db.exec(`
            CREATE TABLE submissions (
              id                 INTEGER PRIMARY KEY AUTOINCREMENT,
              exam_id            INTEGER NOT NULL REFERENCES exams(id),
              student_name       TEXT NOT NULL,
              student_id         TEXT,
              answers            TEXT NOT NULL,
              score              REAL,
              total_score        REAL,
              submitted_at       TEXT DEFAULT (datetime('now','localtime')),
              lookup_token       TEXT,
              started_at         TEXT,
              last_seen_at       TEXT,
              status             TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('in_progress','submitted')),
              student_account_id INTEGER NOT NULL REFERENCES students(id),
              student_session_id INTEGER REFERENCES student_sessions(id) ON DELETE SET NULL
            )
          `);
          db.exec(`
            INSERT INTO submissions
              (id, exam_id, student_name, student_id, answers, score, total_score, submitted_at, lookup_token, started_at, last_seen_at, status, student_account_id, student_session_id)
            SELECT id, exam_id, student_name, student_id, answers, score, total_score, submitted_at, lookup_token, started_at, last_seen_at,
                   COALESCE(NULLIF(TRIM(status), ''), 'submitted'),
                   student_account_id, student_session_id
            FROM submissions_old
          `);
          db.exec(`DROP TABLE submissions_old`);
        });
        rebuildSubmissions();
        db.exec(`PRAGMA legacy_alter_table = OFF`);
        db.exec(`PRAGMA foreign_keys = ON`);
      }
    }
  }
}

// Migration: update questions type CHECK constraint to include 'true_false', 'listening', GEPT types
{
  const schemaRow = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='questions'`).get();
  const needsGeptTypes = schemaRow && !schemaRow.sql.includes("'cloze'");
  const needsTrueFalse = schemaRow && !schemaRow.sql.includes("'true_false'");
  const needsListening = schemaRow && !schemaRow.sql.includes("'listening'");
  if (needsTrueFalse || needsListening || needsGeptTypes) {
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
          type             TEXT NOT NULL CHECK(type IN ('choice','true_false','fill','calculation','listening','cloze','reading','writing','speaking')),
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
          grade_level      TEXT NOT NULL DEFAULT 'junior_high',
          dont_know_count  INTEGER DEFAULT 0,
          image_url        TEXT,
          passage_id       INTEGER,
          passage_content  TEXT
        )
      `);
      db.exec(`INSERT INTO questions
        (id, subject_id, type, difficulty, content, option_a, option_b, option_c, option_d,
         answer, explanation, source, tags, created_at, updated_at,
         correct_count, wrong_count, is_archived, audio_url, audio_transcript, grade_level,
         dont_know_count, image_url, passage_id, passage_content)
        SELECT id, subject_id, type, difficulty, content, option_a, option_b, option_c, option_d,
         answer, explanation, source, tags, created_at, updated_at,
         COALESCE(correct_count, 0), COALESCE(wrong_count, 0), COALESCE(is_archived, 0),
         audio_url, audio_transcript, COALESCE(grade_level, 'junior_high'),
         COALESCE(dont_know_count, 0), image_url, passage_id, passage_content
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

// Migration: add ON DELETE CASCADE to submissions.exam_id if missing
{
  const subFks = db.prepare(`PRAGMA foreign_key_list(submissions)`).all();
  const examFk = subFks.find(f => f.from === 'exam_id' && f.table === 'exams');
  if (!examFk || examFk.on_delete !== 'CASCADE') {
    db.exec(`PRAGMA foreign_keys = OFF`);
    db.exec(`PRAGMA legacy_alter_table = ON`);
    const rebuildSubmissionsExamCascade = db.transaction(() => {
      db.exec(`ALTER TABLE submissions RENAME TO submissions_old`);
      db.exec(`
        CREATE TABLE submissions (
          id                 INTEGER PRIMARY KEY AUTOINCREMENT,
          exam_id            INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
          student_name       TEXT NOT NULL,
          student_id         TEXT,
          answers            TEXT NOT NULL,
          score              REAL,
          total_score        REAL,
          submitted_at       TEXT DEFAULT (datetime('now','localtime')),
          lookup_token       TEXT,
          started_at         TEXT,
          last_seen_at       TEXT,
          status             TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('in_progress','submitted')),
          student_account_id INTEGER NOT NULL REFERENCES students(id),
          student_session_id INTEGER REFERENCES student_sessions(id) ON DELETE SET NULL
        )
      `);
      db.exec(`
        INSERT INTO submissions
          (id, exam_id, student_name, student_id, answers, score, total_score,
           submitted_at, lookup_token, started_at, last_seen_at, status,
           student_account_id, student_session_id)
        SELECT id, exam_id, student_name, student_id, answers, score, total_score,
               submitted_at, lookup_token, started_at, last_seen_at, status,
               student_account_id, student_session_id
        FROM submissions_old
      `);
      db.exec(`DROP TABLE submissions_old`);
    });
    rebuildSubmissionsExamCascade();
    db.exec(`PRAGMA legacy_alter_table = OFF`);
    db.exec(`PRAGMA foreign_keys = ON`);
  }
}

// Migration: add tolerance column to questions (for calculation-type numeric grading)
{
  const cols = db.prepare('PRAGMA table_info(questions)').all().map(c => c.name);
  if (!cols.includes('tolerance')) {
    db.exec('ALTER TABLE questions ADD COLUMN tolerance REAL');
  }
}

// Migration: add randomize_questions and randomize_options to exams
{
  const cols = db.prepare('PRAGMA table_info(exams)').all().map(c => c.name);
  if (!cols.includes('randomize_questions')) {
    db.exec('ALTER TABLE exams ADD COLUMN randomize_questions INTEGER NOT NULL DEFAULT 0');
  }
  if (!cols.includes('randomize_options')) {
    db.exec('ALTER TABLE exams ADD COLUMN randomize_options INTEGER NOT NULL DEFAULT 0');
  }
}

// Migration: add UNIQUE INDEX on questions(content) to prevent duplicate questions
{
  const idxExists = db.prepare(
    `SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_questions_content_unique'`
  ).get();
  if (!idxExists) {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_content_unique ON questions(content)`);
  }
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_answer_details_submission
  ON answer_details(submission_id);
  CREATE INDEX IF NOT EXISTS idx_answer_details_question
  ON answer_details(question_id);
  CREATE INDEX IF NOT EXISTS idx_exam_questions_exam
  ON exam_questions(exam_id);
  CREATE INDEX IF NOT EXISTS idx_questions_grade_subject_archived
  ON questions(grade_level, subject_id, is_archived);
  CREATE INDEX IF NOT EXISTS idx_questions_content_hash
  ON questions(content_hash);
  CREATE INDEX IF NOT EXISTS idx_questions_review_status
  ON questions(review_status, is_archived);
  CREATE INDEX IF NOT EXISTS idx_exams_status_window
  ON exams(status, starts_at, ends_at);
  CREATE INDEX IF NOT EXISTS idx_submissions_exam_student
  ON submissions(exam_id, student_name, student_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_exam_owner
  ON submissions(exam_id, student_account_id, student_session_id, status);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_lookup_token
  ON submissions(lookup_token);
  CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_exp
  ON admin_sessions(token_hash, expires_at);
  CREATE INDEX IF NOT EXISTS idx_student_sessions_token_exp
  ON student_sessions(token_hash, expires_at);
  CREATE INDEX IF NOT EXISTS idx_student_sessions_account
  ON student_sessions(student_account_id, expires_at);
  CREATE INDEX IF NOT EXISTS idx_question_versions_question
  ON question_versions(question_id, version_no DESC);
`);

const PASSWORD_HASH_SCHEME = 'scrypt-v1';
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(String(password || ''), salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM
  });
  return `${PASSWORD_HASH_SCHEME}$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

{
  const adminCount = db.prepare(`SELECT COUNT(*) AS c FROM admins`).get().c;
  if (adminCount === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin1234';
    db.prepare(`
      INSERT INTO admins (username, password_hash, display_name, role)
      VALUES (?, ?, ?, 'teacher')
    `).run(username, hashPassword(password), '老師帳號');
  }
}

{
  const studentCount = db.prepare(`SELECT COUNT(*) AS c FROM students`).get().c;
  if (studentCount === 0) {
    const username = process.env.STUDENT_USERNAME || 'student';
    const password = process.env.STUDENT_PASSWORD || 'student1234';
    const studentName = process.env.STUDENT_NAME || '示範學生';
    const studentId = process.env.STUDENT_ID || 'S001';
    db.prepare(`
      INSERT INTO students (username, password_hash, student_name, student_id)
      VALUES (?, ?, ?, ?)
    `).run(username, hashPassword(password), studentName, studentId);
  }
}

{
  const rows = db.prepare(`
    SELECT id, content, correct_count, wrong_count
    FROM questions
    WHERE normalized_content IS NULL OR content_hash IS NULL OR review_status IS NULL
  `).all();
  if (rows.length) {
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
        const totalAttempts = (row.correct_count || 0) + (row.wrong_count || 0);
        const passRate = totalAttempts > 0 ? (row.correct_count || 0) / totalAttempts : null;
        const needsReview = passRate !== null && totalAttempts >= 10 && (passRate >= 0.95 || passRate <= 0.05);
        update.run(
          normalizeQuestionContent(row.content),
          buildContentHash(row.content),
          needsReview ? 'needs_review' : 'approved',
          JSON.stringify(needsReview ? ['pass_rate_outlier'] : []),
          needsReview ? 80 : 100,
          row.id
        );
      }
    });
    tx(rows);
  }
}

const insertSubject = db.prepare(`INSERT OR IGNORE INTO subjects (name, code, grade_level) VALUES (?, ?, ?)`);
[
  ['數學',     'MATH',  'junior_high'],
  ['自然科學', 'SCI',   'junior_high'],
  ['物理',     'PHY',   'junior_high'],
  ['化學',     'CHEM',  'junior_high'],
  ['生物',     'BIO',   'junior_high'],
  ['地球科學', 'EARTH', 'junior_high'],
  // 注意：升國中資優班聚焦數理，不設英文聽力科目
  // 國小六年級科目
  ['國語',     'CHN',   'elementary_6'],
  ['英語',     'ENG',   'elementary_6'],
  ['社會',     'SOC',   'elementary_6'],
  ['自然',     'NAT',   'elementary_6'],
  ['數學',     'MATH_E','elementary_6'],
  ['英文聽力', 'ENG_LISTEN_6', 'elementary_6'],
  ['作文',     'ESSAY_6', 'elementary_6'],
  // 國一（七年級）科目
  ['國文', 'CHN_7',  'grade_7'],
  ['數學', 'MATH_7', 'grade_7'],
  ['英語', 'ENG_7',  'grade_7'],
  ['自然', 'SCI_7',  'grade_7'],
  ['社會', 'SOC_7',  'grade_7'],
  ['英文聽力', 'ENG_LISTEN_7', 'grade_7'],
  ['作文', 'ESSAY_7', 'grade_7'],
  // 國二（八年級）科目
  ['國文', 'CHN_8',  'grade_8'],
  ['數學', 'MATH_8', 'grade_8'],
  ['英語', 'ENG_8',  'grade_8'],
  ['自然', 'SCI_8',  'grade_8'],
  ['社會', 'SOC_8',  'grade_8'],
  ['英文聽力', 'ENG_LISTEN_8', 'grade_8'],
  ['作文', 'ESSAY_8', 'grade_8'],
  // 國三（九年級）科目
  ['國文', 'CHN_9',  'grade_9'],
  ['數學', 'MATH_9', 'grade_9'],
  ['英語', 'ENG_9',  'grade_9'],
  ['自然', 'SCI_9',  'grade_9'],
  ['社會', 'SOC_9',  'grade_9'],
  ['英文聽力', 'ENG_LISTEN_9', 'grade_9'],
  ['作文', 'ESSAY_9', 'grade_9'],
  // 國中教育會考科目
  ['國文', 'CHN_BC', 'bctest'],
  ['數學', 'MATH_BC','bctest'],
  ['英語', 'ENG_BC', 'bctest'],
  ['自然', 'SCI_BC', 'bctest'],
  ['社會', 'SOC_BC', 'bctest'],
  ['英文聽力', 'ENG_LISTEN_BC', 'bctest'],
  ['作文', 'ESSAY_BC', 'bctest'],
  // 全民英檢初級（GEPT Elementary）科目
  ['聽力', 'GEPT_LISTEN', 'gept_elementary'],
  ['閱讀', 'GEPT_READ',   'gept_elementary'],
  ['寫作', 'GEPT_WRITE',  'gept_elementary'],
  ['口說', 'GEPT_SPEAK',  'gept_elementary'],
].forEach(([name, code, grade_level]) => insertSubject.run(name, code, grade_level));

module.exports = db;
