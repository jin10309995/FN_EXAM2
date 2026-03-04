# 🎓 升國中數理資優班考題系統

數理資優班甄試線上考試平台 — 支援題庫管理、線上作答、自動評分與成績統計。

## 系統需求

- [Node.js](https://nodejs.org/) 16 以上版本
- Windows 作業系統（`setup.bat` / `start.bat` 適用）

## 快速開始

```bat
:: 1. 首次安裝（只需執行一次）
setup.bat

:: 2. 啟動伺服器
start.bat

:: 3. 開啟瀏覽器
::    http://localhost:3000
```

`setup.bat` 會自動完成：安裝 npm 套件 → 產生前端頁面 → 初始化資料庫 → 植入範例題目。

## 專案結構

```
project/
├── server.js           # Express 後端主程式（API + 靜態檔案服務）
├── database.js         # SQLite 資料庫初始化與連線
├── seed.js             # 範例題目植入腳本
├── generate-public.js  # 自動產生前端 HTML 頁面
├── exam.db             # SQLite 資料庫檔案
├── public/             # 前端靜態頁面
│   ├── index.html      # 首頁入口
│   ├── exam-list.html  # 考試列表（學生端）
│   ├── exam.html       # 線上作答（學生端）
│   ├── result.html     # 個人成績與解析
│   ├── results.html    # 全班成績查詢
│   └── admin.html      # 後台管理（教師端）
├── setup.bat           # 一鍵初始化腳本
└── start.bat           # 啟動伺服器腳本
```

## 頁面說明

| 頁面 | 角色 | 說明 |
|------|------|------|
| `/` | 所有人 | 首頁入口，導覽至各功能 |
| `/exam-list.html` | 學生 | 選擇已開放的考試 |
| `/exam.html?id=<ID>` | 學生 | 線上作答（倒數計時、自動評分） |
| `/result.html?id=<ID>` | 學生 | 查看個人成績與詳細題目解析 |
| `/results.html` | 教師 | 查詢全班成績排行 |
| `/admin.html` | 教師 | 題庫管理 / 試卷管理 / 成績統計 |

## 題目類型

| 類型 | 代碼 | 評分方式 |
|------|------|----------|
| 選擇題 | `choice` | 自動評分（單選 A/B/C/D） |
| 填充題 | `fill` | 自動評分（文字比對） |
| 計算題 | `calculation` | 預留（人工批改） |

## 科目分類

| 科目 | 代碼 |
|------|------|
| 數學 | MATH |
| 自然科學 | SCI |
| 物理 | PHY |
| 化學 | CHEM |
| 生物 | BIO |
| 地球科學 | EARTH |

## 難度等級

| 等級 | 說明 |
|------|------|
| 1 ★ | 入門 |
| 2 ★★ | 基礎 |
| 3 ★★★ | 中級 |
| 4 ★★★★ | 進階 |
| 5 ★★★★★ | 競賽級 |

## API 一覽

### 科目
```
GET  /api/subjects                  取得所有科目列表
```

### 題庫
```
GET  /api/questions                 查詢題庫（支援篩選與分頁）
     ?subject_id=1&type=choice&difficulty=3&search=關鍵字&page=1&limit=20
GET  /api/questions/random          隨機抽題
     ?subject_id=1&type=choice&difficulty_min=2&difficulty_max=4&count=10
GET  /api/questions/:id             取得單筆題目
POST /api/questions                 新增題目
PUT  /api/questions/:id             編輯題目
DELETE /api/questions/:id           刪除題目
```

### 試卷
```
GET  /api/exams                     取得所有試卷列表（含題數與總分）
GET  /api/exams/:id                 取得試卷詳情（含答案，供管理使用）
GET  /api/exams/:id/take            考生作答用（隱藏答案，僅開放中試卷）
POST /api/exams                     建立試卷
PUT  /api/exams/:id                 更新試卷（含狀態切換：draft/active/closed）
DELETE /api/exams/:id               刪除試卷
```

### 作答與成績
```
POST /api/exams/:id/submit          提交作答，回傳得分與百分比
GET  /api/exams/:id/submissions     取得此試卷所有考生成績列表
GET  /api/exams/:id/stats           試卷統計（平均分、最高分、最易錯題 Top 5）
GET  /api/submissions/:id           取得單筆作答詳情（含每題解析）
```

## 資料庫結構

SQLite 資料庫（`exam.db`）包含以下資料表：

| 資料表 | 說明 |
|--------|------|
| `subjects` | 科目（數學、物理…） |
| `questions` | 題目（內容、選項、答案、解析、標籤） |
| `exams` | 試卷（標題、說明、時長、狀態） |
| `exam_questions` | 試卷題目關聯（排序、配分） |
| `submissions` | 學生作答紀錄 |
| `answer_details` | 每題作答明細（對錯、得分） |

可用 [DB Browser for SQLite](https://sqlitebrowser.org/) 直接開啟 `exam.db` 查看資料。

## 手動執行

```bat
:: 安裝套件
npm install

:: 重新產生前端頁面
node generate-public.js

:: 植入範例題目（數學 + 自然科學共 19 題，並建立一份範例試卷）
node seed.js

:: 啟動伺服器（預設 port 3000）
node server.js

:: 自訂 port
set PORT=8080 && node server.js
```

## 技術棧

| 類別 | 技術 |
|------|------|
| 後端框架 | [Express.js](https://expressjs.com/) 4.x |
| 資料庫 | [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| 前端樣式 | [Tailwind CSS](https://tailwindcss.com/)（CDN） |
| 字型 | Noto Sans TC（Google Fonts） |
