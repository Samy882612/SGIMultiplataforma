@echo off
cd /d "%~dp0"
echo Iniciando SAPPosStore...
start "SAPPosStore Backend" cmd /k "cd /d "%~dp0" && npm run server"
start "SAPPosStore Frontend" cmd /k "cd /d "%~dp0" && npm run dev -- --port 5174"
echo Backend: http://localhost:4000
echo Frontend: http://localhost:5174
pause
