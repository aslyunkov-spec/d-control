@echo off
title D-Control Update

cd /d C:\D-Control

git pull

cd backend

call venv\Scripts\activate

python manage.py migrate

pause