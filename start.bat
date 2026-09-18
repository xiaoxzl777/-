@echo off
setlocal EnableExtensions
set NOT_READY=
cd /d "%~dp0"
title YouXing - start

rem One-click start: opens three windows for the AI service, the backend and the web front end,
rem then opens the browser once the backend is ready. Close a window to stop that service.
rem Keep this file ASCII only: cmd misreads batch files that contain Chinese characters.
rem Call programs in the current folder with .\ in front, because cmd may be set not to search it.
rem On a new computer, do the setup steps in README.md first.

set WEB_PORT=770
set SERVER_PORT=777
set AI_PORT=7777

rem ---------- check that dependencies and config files are in place ----------
if not exist "ai-service\.venv\Scripts\python.exe" (
  echo [missing] ai-service\.venv - Python virtual environment of the AI service
  set NOT_READY=1
)
if not exist "ai-service\.env" (
  echo [missing] ai-service\.env - config file with the DeepSeek key
  set NOT_READY=1
)
if not exist "tour-server\src\main\resources\application-local.yml" (
  echo [missing] tour-server\src\main\resources\application-local.yml - config file with the MySQL account
  set NOT_READY=1
)
if not exist "tour-web\node_modules" (
  echo [missing] tour-web\node_modules - run npm install in tour-web
  set NOT_READY=1
)

rem ---------- check that the ports are free, for example not started twice ----------
for %%p in (%WEB_PORT% %SERVER_PORT% %AI_PORT%) do (
  netstat -ano | findstr /r /c:":%%p .*LISTENING" >nul && (
    echo [in use] port %%p is already in use - run stop.bat first
    set NOT_READY=1
  )
)

if defined NOT_READY (
  echo.
  echo Fix the items above and run again. The setup steps are in README.md.
  pause
  exit /b 1
)

rem ---------- start the three services, one window each ----------
echo Starting:
echo   AI service / Xiaoxiao   port %AI_PORT%
echo   backend                 port %SERVER_PORT%
echo   web                     port %WEB_PORT%
rem The title is also written into each window's command line, so stop.bat can find the window
rem even after a program such as npm changes the window title.
start "YouXing AI %AI_PORT%" /d "%~dp0ai-service" cmd /k "title YouXing AI %AI_PORT%&& .venv\Scripts\python.exe -m uvicorn app.main:app --port %AI_PORT%"
start "YouXing Server %SERVER_PORT%" /d "%~dp0tour-server" cmd /k "title YouXing Server %SERVER_PORT%&& .\mvnw.cmd spring-boot:run"
start "YouXing Web %WEB_PORT%" /d "%~dp0tour-web" cmd /k "title YouXing Web %WEB_PORT%&& npm run dev"

rem ---------- wait for the backend, then open the browser; give up after 5 minutes ----------
echo.
echo Waiting for the backend. The first run downloads dependencies and takes longer...
set /a TRIES=0
:wait_server
set /a TRIES+=1
if %TRIES% gtr 150 (
  echo The backend is still not up after 5 minutes. Check the errors in the YouXing Server window.
  pause
  exit /b 1
)
rem wait about 2 seconds
ping -n 3 127.0.0.1 >nul
curl --noproxy "*" -s -o nul http://localhost:%SERVER_PORT%/api/user/districts || goto wait_server

start "" http://localhost:%WEB_PORT%
echo.
echo All started: http://localhost:%WEB_PORT%
echo Close the three YouXing windows or run stop.bat to stop the services. This window can be closed now.
pause
