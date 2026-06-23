@echo off
title D-Control Restart

taskkill /FI "WINDOWTITLE eq D-Control Django*" /F

timeout /t 2 >nul

cd /d C:\D-Control\backend

call venv\Scripts\activate

start "D-Control Django" cmd /k python manage.py runserver 0.0.0.0:8000

exit