# Copilot 指引

## 專案概覽

升國中數理資優班考題系統 — 支援多學段的線上考試平台。後端採用 Express.js + SQLite（better-sqlite3），前端使用原生 HTML + Tailwind CSS。涵蓋升國中資優班、國中各年級（7–9）、國中教育會考（bctest）與全民英檢初級（GEPT）。

## 執行專案

```bat
:: 首次設定
setup.bat

:: 啟動伺服器（預設 port 3000）
npm start
:: 或: node server.js

:: 自訂 port
set PORT=8080 && node server.js

:: 重新產生所有前端 HTML 頁面（修改 generate-public.js 後執行）
node generate-public.js

:: 植入範例題目（19 題 + 1 份考卷）
node seed.js

:: 植入 500 題
node seed500.js

:: 植入國小六年級題目（三個 seed 檔依序執行）
node seed_elementary.js
node seed_elementary_extra.js
node seed_elementary_final.js
```

本專案沒有測試或 lint 腳本。

## 架構

### 後端（`server.js` + `database.js`）

所有 REST API 路由都集中在單一 `server.js` 檔案。`database.js` 在每次啟動時初始化 SQLite schema 並植入科目資料，並直接匯出 `db` 連線物件。

**`better-sqlite3` 是同步的** — 對 DB 呼叫絕對不要使用 `async/await` 或 `.then()`，所有查詢都是阻塞式的。

多步驟寫入必須使用 `db.transaction()`：
```js
const doWork = db.transaction(() => {
  db.prepare('...').run(...);
  db.prepare('...').run(...);
});
doWork();
```

### 前端（`templates/public/` → `public/`）

**請勿直接編輯 `public/` 內的檔案。** 所有前端 HTML 範本存放在 `templates/public/` 目錄下。`generate-public.js` 會將這些檔案複製到 `public/`。修改 HTML 範本後執行 `node generate-public.js` 重新同步靜態檔案。

前端頁面透過 CDN 使用 Tailwind CSS，並從 `/api/` 端點取得資料。

| 頁面 | 用途 |
|---|---|
| `index.html` | 首頁 — 連結到考卷列表、管理後台與成績 |
| `exam-list.html` | 學生端進行中考卷列表 |
| `exam.html` | 學生作答介面（`?id=<examId>`） |
| `result.html` | 單次提交成績詳情（`?id=<submissionId>`） |
| `analysis.html` | 學生作答分析（`?id=<submissionId>`） |
| `results.html` | 管理員查看某份考卷的所有提交（`?exam=<examId>`） |
| `admin.html` | 管理後台 — 題庫 CRUD、考卷管理、人工批改、分析 |
| `ai-generate.html` | AI 出題介面 |

### 資料庫結構

| 資料表 | 用途 |
|---|---|
| `subjects` | 科目（啟動時植入） |
| `questions` | 題庫 |
| `exams` | 考卷（含狀態生命週期） |
| `exam_questions` | 考卷 ↔ 題目的關聯表（含排序與每題配分） |
| `submissions` | 學生作答提交紀錄 |
| `answer_details` | 每題作答詳情（對錯、得分、人工批改欄位） |
| `admins` | 管理員帳號（username、password_hash、role） |
| `admin_sessions` | 管理員登入 session（token_hash、expires_at） |
| `students` | 學生帳號（username、password_hash、student_name） |
| `student_sessions` | 學生登入 session（token_hash、expires_at） |
| `question_versions` | 題目版本歷程（snapshot_json） |

考卷狀態生命週期：`draft`（草稿）→ `active`（進行中）→ `closed`（已結束）

### 資料庫 Migration 機制

`database.js` 在每次啟動時自動執行 migration：使用 `PRAGMA table_info(tableName)` 檢測欄位是否存在，若缺少則執行 `ALTER TABLE ADD COLUMN`。新增欄位時沿用此模式，不要手動修改 DB 檔案。

若需修改 CHECK 約束（例如新增題目類型），需用 `db.transaction()` 搭配 `PRAGMA legacy_alter_table = ON` 做 rename-rebuild-copy 遷移，參考 `database.js` 中 `needsGeptTypes` 的模式。

### LLM 整合（`llm.js`）

支援 OpenAI（`gpt-4o-mini`）、Google Gemini（`gemini-2.5-flash`）、Anthropic Claude（`claude-3-5-haiku-20241022`）。LLM provider 由 `LLM_PROVIDER` 環境變數指定。

`llm.js` 匯出三個函式：
- `generateQuestions(provider, userPrompt)` — 回傳題目物件陣列
- `gradeEssay(provider, questionContent, studentAnswer, rubric, maxScore)` — AI 作文批改，回傳四維度分數
- `generateModelEssay(provider, questionContent, gradeLevel)` — 產生示範作文純文字

LLM 生成題目的格式限制：題目內容不得使用 LaTeX 或 Markdown 數學語法，數學式一律改寫為可讀純文字（如 `3x + 5 = 17`）。

## 重要慣例

### 認證機制

系統採用 **cookie-based session 認證**，管理員與學生各自獨立。

**登入流程（統一端點）**：`POST /api/login` — body `{ username, password }` — 同時支援 admin 與 student 帳號，回傳 `role: 'teacher'` 或 `role: 'student'`，並設定對應的 session cookie。

**管理員認證**：`requireAdmin` 中介層呼叫 `getAdminAuth(req)`，接受 `admin_session` cookie 或 `Authorization: Bearer <token>` header。Token SHA-256 雜湊後與 `admin_sessions` 表比對，並驗證 `expires_at` 與帳號 `is_active`。

**角色限制**：`requireAdminRole('superadmin')` 等可進一步限制特定角色，通用管理員操作使用 `requireAdmin`。

**學生認證**：`requireStudent` 中介層檢查 `student_session` cookie → `student_sessions` 表。`requireStudentAccount` 額外要求必須是帳號密碼登入（非匿名 session）。

**密碼雜湊**：使用 Node.js `crypto.scryptSync`，格式為 `scrypt-v1$N$r$p$<salt_b64>$<key_b64>`。舊版 SHA-256 hex 雜湊在登入成功後自動升級。

> 匿名學生登入 `POST /api/student/login` 已停用（回傳 410）。根路徑 `/` 重導向至 `/login.html`。

### 答案隱藏

`GET /api/exams/:id/take` 是學生端端點 — SQL SELECT 刻意省略 `answer` 與 `explanation` 欄位。`GET /api/exams/:id` 僅限管理員使用，會回傳包含答案的完整題目資料。

### 題目類型

- `choice` — 單選題 A/B/C/D，不分大小寫自動批改
- `true_false` — 是非題，答案只能是 `T` 或 `F`，不分大小寫自動批改
- `fill` — 填空題，不分大小寫自動批改
- `calculation` — 計算題，儲存但不自動批改（供人工批改）
- `listening` — 聽力題，附 `audio_url` 與 `audio_transcript`
- `cloze` — 克漏字
- `reading` — 閱讀理解，附 `passage_content`
- `writing` — 寫作題，支援 AI 批改（`gradeEssay`）與示範作文（`model_essay`）
- `speaking` — 口說題，學生上傳音訊，儲存於 `answer_details.audio_answer_url`

難度為 1–5 的整數（由 DB CHECK 限制條件強制執行）。

### 學段（grade_level）

`questions` 與 `subjects` 兩張表都有 `grade_level` 欄位，有效值為：

| 值 | 說明 |
|---|---|
| `junior_high` | 升國中資優班（預設） |
| `elementary_6` | 國小六年級 |
| `grade_7` | 國一（七年級） |
| `grade_8` | 國二（八年級） |
| `grade_9` | 國三（九年級） |
| `bctest` | 國中教育會考 |
| `gept_elementary` | 全民英檢初級（GEPT） |

科目代碼命名規則：同名科目以學段後綴區分（如 `MATH`、`MATH_E`、`MATH_7`、`MATH_BC`）。`/api/subjects` 與 `/api/questions` 均支援 `?grade_level=` 篩選參數。

### 請求速率限制

- 一般 API：每個 IP 每分鐘 200 次（`/api/` 前綴）
- 提交端點：每個 IP 每 15 分鐘 10 次（`POST /api/exams/:id/submit`）

### 建立／更新考卷的 `question_ids` 格式

建立或更新考卷時，請求本體中的 `question_ids` 接受純 ID 或含配分覆寫的物件：

```js
// 純 ID — 每題預設配分為 5 分
question_ids: [1, 2, 3]

// 含自訂每題配分的物件
question_ids: [{ id: 1, score: 10 }, { id: 2, score: 5 }]

// 混合格式也可接受
```

### API 路由速查表

| 方法 | 路徑 | 需管理員 | 用途 |
|--------|------|-------|---------|
| POST | `/api/login` | 否 | 統一登入（admin + student，回傳 role + cookie） |
| POST | `/api/logout` | ✅ | 管理員登出（清除 session） |
| POST | `/api/student/logout` | 否 | 學生登出 |
| GET | `/api/me` | 否 | 取得目前登入身份 |
| GET | `/api/subjects` | 否 | 列出所有科目 |
| GET | `/api/questions` | 否 | 分頁題目列表（篩選：subject_id、type、difficulty、search、grade_level） |
| GET | `/api/questions/random` | 否 | 隨機題目（篩選：subject_id、type、difficulty_min/max、count、grade_level） |
| GET | `/api/questions/:id` | 否 | 單題詳情 |
| POST | `/api/questions` | ✅ | 新增題目 |
| POST | `/api/questions/batch` | ✅ | 批次匯入題目 |
| PUT | `/api/questions/:id` | ✅ | 更新題目 |
| DELETE | `/api/questions/:id` | ✅ | 刪除題目 |
| GET | `/api/exams` | ✅ | 列出所有考卷（含題數與總分） |
| GET | `/api/exams/:id` | ✅ | 考卷詳情（含答案） |
| GET | `/api/exams/:id/take` | 否 | 學生端作答（僅進行中考卷，不含答案） |
| POST | `/api/exams` | ✅ | 建立考卷 |
| PUT | `/api/exams/:id` | ✅ | 更新考卷（若提供題目列表則完全取代） |
| DELETE | `/api/exams/:id` | ✅ | 刪除考卷及所有提交（在 transaction 中串聯刪除） |
| POST | `/api/exams/:id/submit` | 否 | 提交答案（速率限制：10 次／15 分鐘） |
| GET | `/api/submissions/:id` | 否 | 提交成績及每題詳情 |
| GET | `/api/submissions/:id/analysis` | 否 | 作答分析 |
| GET | `/api/exams/:id/submissions` | ✅ | 某份考卷的所有提交紀錄 |
| GET | `/api/exams/:id/stats` | ✅ | 考卷統計資料 + 錯誤率最高前 5 題 |
| GET | `/api/exams/:id/pending-grading` | ✅ | 待人工批改的答案 |
| PUT | `/api/answer-details/:id/grade` | ✅ | 人工批改給分 |
| POST | `/api/generate/questions` | ✅ | AI 生成題目（需配置 LLM API key） |
| POST | `/api/audio/upload` | ✅ | 上傳聽力音訊（≤50MB，mp3/wav/ogg/m4a/aac/webm） |
| POST | `/api/image/upload` | ✅ | 上傳題目圖片（≤10MB，jpg/png/gif/webp/svg） |

### 環境變數

將 `.env.example` 複製為 `.env`。主要變數：
- `PORT` — 伺服器 port（預設：3000）
- `ADMIN_API_KEY` — **已不再使用**，系統已改為 session-based 認證（保留欄位向下相容）
- `ALLOWED_ORIGIN` — CORS 允許的來源（預設：`http://localhost:3000`）
- `LLM_PROVIDER` — AI 出題使用的 provider：`openai`、`gemini`、`claude`
- `OPENAI_API_KEY` — OpenAI API 金鑰
- `GEMINI_API_KEY` — Google Gemini API 金鑰
- `ANTHROPIC_API_KEY` — Anthropic Claude API 金鑰
