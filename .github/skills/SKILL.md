---
name: 升國中數理資優班考題系統開發指引 (FN_EXAM)
description: 協助維護與開發基於 Node.js (Express) + SQLite 的線上甄試考題平台，包含前後端、資料庫操作與 LLM 題目生成整合。
---

# 核心目的
定義 Agent 在參與「數理資優班甄試線上考試平台」專案開發時的標準操作規範，確保技術棧、資料庫操作與前後端架構修改的一致性。

# 技術棧規格
- **後端框架**：Node.js (>= 16) + Express.js 4.x
- **資料庫**：SQLite (透過 `better-sqlite3` 操作 `exam.db`)
- **AI 整合**：透過 `llm.js` 模組處理 OpenAI 等大型語言模型的 API 呼叫，用於自動出題功能。
- **前端樣式**：純 HTML + Tailwind CSS (CDN) + 原生 JavaScript
- **主要腳本**：
  - `server.js`: API 路由與靜態檔案服務器
  - `llm.js`: 封裝所有與 LLM (目前使用 OpenAI 等) 互動的邏輯
  - `database.js`: SQLite 資料庫連線與初始化邏輯
  - `generate-public.js`: 前端 HTML 自動產生器
  - `seed.js`: 範例考題植入腳本

# 資源與工作流程

## 1. 資料庫操作 (`exam.db`)
資料庫綱要定義於 `database.js`。主要的資料表有：`subjects`, `questions`, `exams`, `exam_questions`, `submissions`, `answer_details`。
- **原則**：盡量使用參數化查詢 (Parameterized Queries) 防範 SQL Injection。
- **更新邏輯慣例**：**禁止**使用純 `SET 欄位 = ?` 覆蓋全部內容。更新資料時（如 `questions` 或 `exams`），必須使用 SQL 的 `COALESCE(?, 欄位)` 語法來支援部分更新（Partial Updates），讓未傳入的欄位保留原值。
- **變更結構**：若需要更動資料庫 Schema，請務必更新 `database.js` 中的建表語法，並可能需要提供遷移腳本或要求使用者重新初始化 (`setup.bat`)。

## 2. 後端 API 擴充 (`server.js`)
此專案採用輕量級架構，所有 API 實作目前都集中在 `server.js`。
- **寫作原則**：新增路由時應遵循 RESTful 慣例，如果涉及複雜交易，必須使用 `db.transaction` 包裝。
- **LLM 架構要求**：任何 AI 產生的邏輯（如生成題目），應實作於 `llm.js`，`server.js` 僅負責接收請求並呼叫該模組，保持路由檔純靜。生成項目與寫入資料庫應拆分為不同的 API（例如先 `POST /api/generate/questions` 提供預覽，再 `POST /api/questions/batch` 進行批次寫入）。
- **更新**：新增 API 後，請同步更新 `README.md` 的「API 一覽」區塊。

## 3. 前端頁面開發 (`generate-public.js` / `public/`)
前端採用 Server/Build-time 生成 HTML 的特殊流程。真正的 HTML 樣板/字串寫在 `generate-public.js` 中，再匯出至 `public/` 目錄。
- **原則**：**禁止**直接修改 `public/` 內的 HTML 檔案，因為它們是自動生成的。
- **更新流程**：任何前端版面與邏輯變更，必須修改 `generate-public.js`，修改完成後**必須執行** `node generate-public.js` 重新產出頁面。

## 4. 調整流程
每次有動到程式時，則需進行系統測試，測試無誤後，如果涉及系統功能變更，則更新操作手冊內容。

# 自訂約束 (Constraints)
- **禁用複雜前端框架**：不使用 React、Vue 等，保持純 HTML + 原生 JS，樣式使用 Tailwind 實用類別。
- **無縫重啟**：開發或修改 `server.js` 後，須提醒使用者手動重啟 Node 伺服器；前端變動提醒手動執行 `generate-public.js`。
- **資料保護**：不得自動執行會清空原始資料的 `setup.bat`，除非使用者明確要求重設環境。

