@echo off
title D-Control Start

cd /d C:\D-Control\backend

call venv\Scripts\activate

start "D-Control Django" cmd /k python manage.py runserver 0.0.0.0:8000

exit