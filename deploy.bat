@echo off
setlocal EnableExtensions
set NOT_READY=
cd /d "%~dp0"
title YouXing - deploy

rem Deploy mode: build the web pages and the backend jar, then run everything the way it runs on a server.
rem   the browser talks to nginx on 770, which serves the built pages from tour-web\dist
rem   and forwards /api to the backend on 777; the backend calls the AI service on 7777.
rem nginx runs in the background, and run stop.bat to stop everything.
rem Only one of start.bat and deploy.bat can run at a time: both use port 770.
rem Keep this file ASCII only and call programs in the current folder with .\ in front (see start.bat).

set WEB_PORT=770
set SERVER_PORT=777
set AI_PORT=7777
set NGINX_VERSION=1.30.5

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

rem ---------- check that the ports are free, for example start.bat is not running ----------
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

rem ---------- nginx: download the official Windows build the first time ----------
if not exist "deploy\nginx\nginx.exe" (
  echo Downloading nginx %NGINX_VERSION% from nginx.org ...
  curl -fL -o "deploy\nginx.zip" https://nginx.org/download/nginx-%NGINX_VERSION%.zip || goto download_failed
  rem use the tar that comes with Windows: it can unzip, the tar from Git cannot
  "%SystemRoot%\System32\tar.exe" -xf "deploy\nginx.zip" -C deploy || goto download_failed
  ren "deploy\nginx-%NGINX_VERSION%" nginx || goto download_failed
  del "deploy\nginx.zip"
)

rem ---------- build the web pages and the backend jar ----------
echo Building the web pages...
pushd tour-web
call npm run build || goto build_failed
popd
echo Building the backend jar...
pushd tour-server
call .\mvnw.cmd -q package -DskipTests || goto build_failed
popd

rem ---------- start the services ----------
echo.
echo Starting:
echo   AI service / Xiaoxiao   port %AI_PORT%   own window
echo   backend jar             port %SERVER_PORT%    own window
echo   nginx                   port %WEB_PORT%    in the background
rem The title is also written into each window's command line, so stop.bat can find the window
rem even after a program such as npm changes the window title.
start "YouXing AI %AI_PORT%" /d "%~dp0ai-service" cmd /k "title YouXing AI %AI_PORT%&& .venv\Scripts\python.exe -m uvicorn app.main:app --port %AI_PORT%"
start "YouXing Server %SERVER_PORT%" /d "%~dp0tour-server" cmd /k "title YouXing Server %SERVER_PORT%&& java -jar target\tour-server-1.0.0.jar"
rem nginx for Windows keeps running after its window is closed, so start it without a window and stop it with stop.bat.
rem It must start in deploy\nginx: nginx takes the folder it starts in as the base of the relative paths in nginx.conf.
powershell -NoProfile -Command "Start-Process -FilePath '%~dp0deploy\nginx\nginx.exe' -ArgumentList '-c','../nginx.conf' -WorkingDirectory '%~dp0deploy\nginx' -WindowStyle Hidden"

rem ---------- wait until an API call through nginx works, then open the browser; give up after 5 minutes ----------
echo.
echo Waiting for the backend...
set /a TRIES=0
:wait_server
set /a TRIES+=1
if %TRIES% gtr 150 (
  echo Still not up after 5 minutes. Check the errors in the YouXing Server window and in deploy\nginx\logs\error.log.
  pause
  exit /b 1
)
rem wait about 2 seconds
ping -n 3 127.0.0.1 >nul
curl --noproxy "*" -fs -o nul http://localhost:%WEB_PORT%/api/user/districts || goto wait_server

start "" http://localhost:%WEB_PORT%
echo.
echo All started: http://localhost:%WEB_PORT%
echo Run stop.bat to stop everything. This window can be closed now.
pause
exit /b 0

:download_failed
echo.
echo Could not download nginx. Download nginx-%NGINX_VERSION%.zip from https://nginx.org/en/download.html,
echo unzip it into the deploy folder, rename the folder to nginx, and run again.
pause
exit /b 1

:build_failed
popd
echo.
echo Build failed. See the errors above.
pause
exit /b 1
