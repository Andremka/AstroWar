@echo off
REM Servidor local para probar el portal de AstroWar (http://localhost:8000)
cd /d "%~dp0"
start "" http://localhost:8000
where py >nul 2>nul && (py -m http.server 8000 & goto :eof)
where python >nul 2>nul && (python -m http.server 8000 & goto :eof)
where npx >nul 2>nul && (npx --yes http-server -p 8000 -c-1 & goto :eof)
echo No se encontro Python ni Node.js. Instala Python desde python.org o usa la extension Live Server de VS Code.
pause
