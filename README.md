# 升學與英語考題系統

這是一套以 Node.js + Express + SQLite 建立的單體式線上考試平台，支援題庫管理、試卷管理、學生作答、自動評分、人工批改、學習分析，以及 LLM 輔助出題。系統目前同時涵蓋升國中資優班、國中各年級、會考題型與 GEPT 初級英語題型。

## 技術棧

- Backend: Express 4
- Database: SQLite (`better-sqlite3`)
- Frontend: 靜態 HTML + Tailwind CSS CDN
- AI: OpenAI / Gemini / Claude
- Uploads: `multer`

## 專案結構

```text
FN_EXAM/
├── server.js                # API、靜態檔案服務、評分與分析主程式
├── database.js              # SQLite schema 與 migration
├── llm.js                   # LLM provider 封裝
├── generate-public.js       # 產生 public/*.html
├── public/                  # 前端頁面
│   ├── index.html
│   ├── exam-list.html
│   ├── exam.html
│   ├── result.html
│   ├── results.html
│   ├── analysis.html
│   ├── admin.html
│   └── ai-generate.html
├── uploads/                 # 音訊與圖片上傳
├── seed*.js                 # 題庫與範例資料植入腳本
├── exam.db                  # SQLite 資料庫
├── setup.bat
└── start.bat
```

## 主要功能

- 題庫管理：新增、編輯、刪除、篩選、批次匯入
- 試卷管理：建立試卷、配分、切換 `draft / active / closed`
- 線上作答：倒數計時、即時提交、自動評分
- 題型支援：`choice`、`fill`、`calculation`、`listening`、`cloze`、`reading`、`writing`、`speaking`
- 人工批改：針對寫作與口說題進行 review 與補分
- 學習分析：作答分析、難度校準、題目品質、能力估計、推薦題目
- AI 出題：管理端可呼叫 LLM 生成題目預覽後再存入資料庫
- 媒體上傳：支援聽力音訊與題目圖片

## 快速開始

### Windows

```bat
setup.bat
start.bat
```

### 手動執行

```bat
npm install
node generate-public.js
node seed.js
node server.js
```

預設網址：`http://localhost:3000`

## 環境變數

請參考 `.env.example`，常用設定如下：

```env
PORT=3000
ADMIN_API_KEY=your_admin_key
ALLOWED_ORIGIN=http://localhost:3000
LLM_PROVIDER=openai
OPENAI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
```

## 主要頁面

- `/`：首頁
- `/exam-list.html`：考試列表
- `/exam.html?id=<examId>`：作答頁
- `/result.html?id=<submissionId>`：個人成績
- `/analysis.html?id=<submissionId>`：作答分析
- `/results.html`：考試成績查詢
- `/admin.html`：題庫、試卷、分析與批改管理
- `/ai-generate.html`：AI 出題頁

## API 概覽

- Subjects: `GET /api/subjects`
- Questions: `GET/POST/PUT/DELETE /api/questions`
- Batch & random: `POST /api/questions/batch`, `GET /api/questions/random`
- Exams: `GET/POST/PUT/DELETE /api/exams`, `GET /api/exams/:id/take`
- Submission: `POST /api/exams/:id/submit`, `GET /api/submissions/:id`
- Analysis: `GET /api/submissions/:id/analysis`, `GET /api/exams/:id/stats`
- Manual grading: `GET /api/exams/:id/pending-grading`, `PUT /api/answer-details/:id/grade`
- Analytics: difficulty calibration, question quality, student ability
- AI & media: `POST /api/generate/questions`, `POST /api/audio/upload`, `POST /api/image/upload`

## 資料庫摘要

核心資料表包含：

- `subjects`
- `questions`
- `exams`
- `exam_questions`
- `submissions`
- `answer_details`

其中 `questions` 已包含 `grade_level`、音訊、圖片、文章內容、作答統計等欄位；`answer_details` 亦支援人工批改狀態與 reviewer notes。

## 注意事項

- 本專案目前為單體架構，適合單機或小型部署。
- 資料庫為本機 SQLite，進行 schema 或 seed 調整前請先備份 `exam.db`。
- 管理 API 以 `x-api-key` 保護，部署時請務必設定 `ADMIN_API_KEY`。
- 若要使用 AI 出題，需先配置對應 provider API key。
