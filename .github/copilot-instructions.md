# Copilot 指引

## 專案概覽

升國中數理資優班考題系統 — 國中數理資優班入學考試平台。後端採用 Express.js + SQLite（better-sqlite3），前端使用原生 HTML + Tailwind CSS。

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

### 前端（`generate-public.js` → `public/`）

**請勿直接編輯 `public/` 內的檔案。** 所有前端 HTML 都以樣板字串的形式定義在 `generate-public.js` 中。修改後執行 `node generate-public.js` 重新產生靜態檔案。

前端頁面透過 CDN 使用 Tailwind CSS，並從 `/api/` 端點取得資料。

| 頁面 | 用途 |
|---|---|
| `index.html` | 首頁 — 連結到考卷列表、管理後台與成績 |
| `exam-list.html` | 學生端進行中考卷列表 |
| `exam.html` | 學生作答介面（`?id=<examId>`） |
| `result.html` | 單次提交成績詳情（`?id=<submissionId>`） |
| `results.html` | 管理員查看某份考卷的所有提交（`?exam=<examId>`） |
| `admin.html` | 管理後台 — 題庫 CRUD 與考卷管理 |

### 資料庫結構

| 資料表 | 用途 |
|---|---|
| `subjects` | 科目（啟動時植入） |
| `questions` | 題庫 |
| `exams` | 考卷（含狀態生命週期） |
| `exam_questions` | 考卷 ↔ 題目的關聯表（含排序與每題配分） |
| `submissions` | 學生作答提交紀錄 |
| `answer_details` | 每題作答詳情（對錯、得分） |

考卷狀態生命週期：`draft`（草稿）→ `active`（進行中）→ `closed`（已結束）

### 資料庫 Migration 機制

`database.js` 在每次啟動時自動執行 migration：使用 `PRAGMA table_info(tableName)` 檢測欄位是否存在，若缺少則執行 `ALTER TABLE ADD COLUMN`。新增欄位時沿用此模式，不要手動修改 DB 檔案。

## 重要慣例

### 管理員驗證

受保護的路由使用 `requireAdmin` 中介軟體，會比對請求標頭 `x-api-key` 與 `process.env.ADMIN_API_KEY`。若未設定 `ADMIN_API_KEY`，中介軟體會直接放行（無需驗證 — 適合本機開發）。

### 答案隱藏

`GET /api/exams/:id/take` 是學生端端點 — SQL SELECT 刻意省略 `answer` 與 `explanation` 欄位。`GET /api/exams/:id` 僅限管理員使用，會回傳包含答案的完整題目資料。

### 題目類型

- `choice` — 單選題 A/B/C/D，以不分大小寫的字串比對自動批改
- `fill` — 填空題，以不分大小寫的字串比對自動批改
- `calculation` — 計算題，保留供人工批改（儲存但不自動批改）

難度為 1–5 的整數（由 DB CHECK 限制條件強制執行）。

### 學段（grade_level）

`questions` 與 `subjects` 兩張表都有 `grade_level` 欄位，值為 `elementary_6`（國小六年級）或 `junior_high`（升國中），預設 `junior_high`。科目資料中，`MATH` 是升國中數學；`MATH_E` 是國小數學（兩者名稱同為「數學」，以 `grade_level` 區分）。

`/api/subjects?grade_level=elementary_6`、`/api/questions?grade_level=elementary_6`、`/api/questions/random?grade_level=elementary_6` 均支援此篩選參數。

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
| GET | `/api/subjects` | 否 | 列出所有科目 |
| GET | `/api/questions` | 否 | 分頁題目列表（篩選：subject_id、type、difficulty、search） |
| GET | `/api/questions/random` | 否 | 隨機題目（篩選：subject_id、type、difficulty_min/max、count） |
| GET | `/api/questions/:id` | 否 | 單題詳情 |
| POST | `/api/questions` | ✅ | 新增題目 |
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
| GET | `/api/exams/:id/submissions` | ✅ | 某份考卷的所有提交紀錄 |
| GET | `/api/exams/:id/stats` | ✅ | 考卷統計資料 + 錯誤率最高前 5 題 |

### 環境變數

將 `.env.example` 複製為 `.env`。主要變數：
- `PORT` — 伺服器 port（預設：3000）
- `ADMIN_API_KEY` — 若設定，所有管理員路由都需要 `x-api-key` 標頭
- `ALLOWED_ORIGIN` — CORS 允許的來源（預設：`http://localhost:3000`）
