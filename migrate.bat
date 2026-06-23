@echo off
title D-Control Migrations

cd /d C:\D-Control\backend

call venv\Scripts\activate

python manage.py makemigrations

python manage.py migrate

pause