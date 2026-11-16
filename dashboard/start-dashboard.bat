@echo off
REM Starts the dashboard on http://127.0.0.1:3100 (this PC only) and opens it in your browser.
REM First run installs dependencies into this folder and builds the app. Nothing is installed globally.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Installing Node.js LTS with winget ^(Windows' built-in installer^)...
  echo This is a normal system-wide install of Node.js. Windows may ask for permission.
  winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
)
where node >nul 2>nul
if errorlevel 1 (
  echo Could not install Node.js automatically. Install the LTS version from https://nodejs.org and run this again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies into this folder...
  call npm ci --no-fund --no-audit || goto :fail
)
if not exist .next\BUILD_ID (
  echo Building...
  call npm run build || goto :fail
)

start "" "http://127.0.0.1:3100"
call npm start
exit /b 0

:fail
echo Something went wrong. See the messages above.
pause
exit /b 1
