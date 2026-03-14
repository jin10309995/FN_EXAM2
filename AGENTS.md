# Repository Guidelines

## Project Structure & Module Organization
This repository is a single-process Node.js exam platform. Core server logic lives in [`server.js`](/abs/path/C:/D槽/workspace/FN_EXAM/server.js), database setup and migrations live in [`database.js`](/abs/path/C:/D槽/workspace/FN_EXAM/database.js), and LLM integration lives in [`llm.js`](/abs/path/C:/D槽/workspace/FN_EXAM/llm.js). Static frontend pages are served from `public/`. Generated media is stored under `uploads/audio` and `uploads/images`. Data seeding scripts use the `seed*.js` naming pattern. Runtime SQLite files are `exam.db`, `exam.db-shm`, and `exam.db-wal`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm start`: start the Express server on `PORT` or `3000`.
- `npm run dev`: same as start; there is no separate hot-reload workflow.
- `node generate-public.js`: regenerate static HTML in `public/`.
- `node seed.js`: initialize baseline sample data.
- `setup.bat`: Windows-first bootstrap for dependencies, page generation, and seed data.
- `start.bat`: Windows-first launcher for local use.

## Coding Style & Naming Conventions
Use CommonJS modules and 2-space or consistent compact indentation matching the existing files. Prefer descriptive camelCase for variables and functions, uppercase for process-wide constants such as `AUDIO_DIR`, and snake_case only for database column names and JSON fields already defined by the API. Keep route handlers thin where possible and avoid introducing new large blocks into `server.js` without extracting helpers.

## Testing Guidelines
There is currently no automated test framework or `npm test` script. Before opening a PR, manually verify key flows:
- app startup
- exam listing and submission
- admin CRUD for questions and exams
- AI generation only when API keys are configured

If you add tests, keep them isolated from the production `exam.db` file and name them `*.test.js`.

## Commit & Pull Request Guidelines
Recent commits use short Chinese summaries such as `程式調整` and `更新上傳`. Continue using brief, imperative commit messages, but make them more specific when possible, for example `修正公開考試列表權限`. PRs should include a short description, impacted files or flows, manual verification steps, and screenshots for `public/` UI changes.

## Security & Configuration Tips
Store secrets in `.env` and never commit real API keys. `ADMIN_API_KEY`, provider keys, and `ALLOWED_ORIGIN` directly affect runtime behavior. Do not edit or delete `exam.db` casually; back it up before schema or seed changes.
