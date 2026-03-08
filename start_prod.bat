@echo off
echo ==============================================
echo Building HBOX Frontend for Production...
echo ==============================================
cd frontend
call npm install
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Frontend build failed.
    exit /b %ERRORLEVEL%
)
cd ..

echo ==============================================
echo Starting HBOX Production Server...
echo ==============================================
cd backend
call npm install
set NODE_ENV=production
node index.js
