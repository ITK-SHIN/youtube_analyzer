@echo off
echo YouTube Analyzer Backend 시작 중...
cd backend
py -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause