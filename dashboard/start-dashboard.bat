@echo off
REM Starts the dashboard on http://127.0.0.1:3100 (this PC only) and opens it in your browser.
REM Installs dependencies and rebuilds automatically when the code changes. Nothing is installed globally except Node.js if missing.
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

REM Installs dependencies and rebuilds automatically whenever the code has changed.
node scripts\run.mjs start --open || goto :fail
exit /b 0

:fail
echo Something went wrong. See the messages above.
pause
exit /b 1
