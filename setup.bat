@echo off
chcp 65001 >nul
echo Gifted Exam System - Setup
echo.

echo [1/4] Installing Node.js packages...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed. Please make sure Node.js is installed: https://nodejs.org
  pause
  exit /b 1
)
echo [OK] Packages installed.

echo.
echo [2/4] Generating public files...
call node generate-public.js
echo [OK] Public files generated.

echo.
echo [3/4] Initializing database...
call node -e "require('./database')"
echo [OK] Database initialized.

echo.
echo [4/4] Seeding sample data...
call node seed.js
echo [OK] Sample data seeded.

echo.
echo ============================================
echo Setup complete. Run start.bat to start.
echo ============================================
pause
