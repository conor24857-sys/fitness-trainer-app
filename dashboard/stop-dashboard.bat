@echo off
REM Stops whatever is listening on port 3100 (the dashboard).
for /f "tokens=5" %%p in ('netstat -ano ^| findstr "127.0.0.1:3100" ^| findstr LISTENING') do taskkill /PID %%p /F
