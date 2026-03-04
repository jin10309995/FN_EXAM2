@echo off
echo 🎓 升國中數理資優班考題系統 - 初始化設定
echo.

echo [1/4] 安裝 Node.js 套件...
call npm install
if errorlevel 1 (
  echo     ✗ npm install 失敗，請確認已安裝 Node.js ^(https://nodejs.org^)
  pause
  exit /b 1
)
echo     ✓ 套件安裝完成

echo.
echo [2/4] 產生前端檔案...
call node generate-public.js
echo     ✓ 前端檔案完成

echo.
echo [3/4] 初始化資料庫...
call node -e "require('./database')"
echo     ✓ 資料庫初始化完成

echo.
echo [4/4] 植入範例題目...
call node seed.js
echo     ✓ 範例題目完成

echo.
echo ============================================
echo  設定完成！請執行 start.bat 啟動系統
echo ============================================
pause
