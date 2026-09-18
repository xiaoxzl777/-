@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Stop YouXing

rem Stops everything started by start.bat or deploy.bat:
rem nginx, and the windows of the AI service, the backend and the web pages together with the programs in them.
rem Keep this file ASCII only and call programs in the current folder with .\ in front (see start.bat).

rem nginx for Windows keeps running after its window is closed, so tell it to stop
if exist "deploy\nginx\logs\nginx.pid" (
  echo Stopping nginx...
  pushd deploy\nginx
  .\nginx.exe -s stop -c ../nginx.conf
  popd
)

rem close the service windows opened by start.bat and deploy.bat, together with the programs in them.
rem The windows are found by the "title YouXing ..." part of their command line, not by the window title,
rem because programs such as npm change the window title.
echo Closing the service windows...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'cmd.exe' -and $_.CommandLine -match 'title YouXing (AI|Server|Web) ' } | ForEach-Object { taskkill /T /F /PID $_.ProcessId | Out-Null }"

rem give the programs a moment to let go of the ports, then check
ping -n 3 127.0.0.1 >nul
set LEFT=
for %%p in (770 777 7777) do (
  netstat -ano | findstr /r /c:":%%p .*LISTENING" >nul && (
    echo [still in use] port %%p
    set LEFT=1
  )
)
echo.
if defined LEFT (
  echo Some ports are still in use. Wait a few seconds and run stop.bat again, or find the program with netstat -ano.
) else (
  echo All stopped.
)
pause
