@echo off
rem Double-click to start the dev mode. All the logic is in run.py next to this file.
rem run.py only needs the Python standard library; the Python in ai-service\.venv is used because it is there after setup.
set PY=%~dp0..\ai-service\.venv\Scripts\python.exe
if not exist "%PY%" (
  echo ai-service\.venv is missing. Do the setup steps in README.md first.
  pause
  exit /b 1
)
"%PY%" "%~dp0run.py" dev
pause
