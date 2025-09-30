@echo off
echo YouTube Analyzer 의존성 설치 중...

echo.
echo 백엔드 의존성 설치...
cd backend
pip install -r requirements.txt

echo.
echo 프론트엔드 의존성 설치...
cd ..\frontend
npm install

echo.
echo 설치 완료!
echo.
echo 실행 방법:
echo 1. start_backend.bat 실행 (백엔드 서버)
echo 2. start_frontend.bat 실행 (프론트엔드)
echo.
pause
