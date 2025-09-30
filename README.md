# YouTube Analyzer - 유튜브 분석 프로그램

Python FastAPI 백엔드 + React 프론트엔드로 구성된 유튜브 분석 프로그램입니다.

## 🚀 주요 기능

### 분석 기능
- **시간당 조회수 그래프**: 영상의 시간대별 조회수 분석
- **실행 모드**: 채널 / 키워드 / 둘 다 선택 가능
- **콘텐츠 타입**: 쇼츠 / 롱폼 / 둘 다 선택 가능
- **기간 설정**: 최근 몇일간의 영상 분석
- **필터링**: 최소 조회수, 시간당 조회수 등 다양한 필터

### 데이터 관리
- **엑셀 내보내기**: 분석 결과를 엑셀 파일로 저장
- **작업 저장/불러오기**: JSON 형태로 작업 상태 저장
- **실시간 분석**: 진행 상황 실시간 모니터링
- **결과 정렬**: 조회수, 구독자수 등 다양한 기준으로 정렬

### UI 기능
- **현대적인 웹 인터페이스**: React + Ant Design
- **반응형 디자인**: 다양한 화면 크기 지원
- **실시간 업데이트**: 분석 진행 상황 실시간 표시
- **직관적인 사용법**: 쉬운 설정과 분석 실행

## 📁 프로젝트 구조

```
analyzer-youtube/
├── backend/                 # Python FastAPI 백엔드
│   ├── app/
│   │   ├── main.py         # FastAPI 메인 앱
│   │   ├── models/         # 데이터 모델
│   │   ├── services/       # 비즈니스 로직
│   │   └── api/           # API 엔드포인트
│   ├── requirements.txt
│   └── env.example
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   └── services/      # API 서비스
│   ├── package.json
│   └── public/
└── README.md
```

## 🛠️ 설치 및 실행

### 1. 백엔드 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp env.example .env
# .env 파일에서 YouTube API 키 설정

# 서버 실행
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 프론트엔드 설정

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

### 3. 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## 🔑 YouTube API 키 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. YouTube Data API v3 활성화
4. API 키 생성
5. 백엔드 `.env` 파일에 API 키 설정

## 📊 사용법

### 1. 분석 설정
- **API 키 입력**: YouTube API 키 설정
- **실행 모드 선택**: 채널/키워드/둘 다
- **콘텐츠 타입**: 쇼츠/롱폼/둘 다
- **검색 조건**: 검색어 또는 채널 ID 입력
- **필터 설정**: 최소 조회수, 시간당 조회수 등

### 2. 분석 실행
- **시작하기**: 분석 시작
- **중단하기**: 분석 중단
- **결과 지우기**: 현재 결과 삭제

### 3. 결과 확인
- **결과 페이지**: 분석 결과 테이블 확인
- **정렬/검색**: 다양한 기준으로 결과 정렬
- **엑셀 다운로드**: 결과를 엑셀 파일로 저장

### 4. 데이터 관리
- **작업 저장**: 현재 분석 결과 JSON으로 저장
- **작업 불러오기**: 이전 분석 결과 불러오기
- **설정 관리**: 분석 설정 저장/불러오기

## 🎯 주요 기능 상세

### 분석 설정
- **시간당 조회수**: 영상 업로드 후 시간당 평균 조회수 계산
- **채널별 분석**: 특정 채널의 영상들 분석
- **키워드 분석**: 특정 키워드로 검색된 영상들 분석
- **콘텐츠 타입**: 쇼츠(60초 이하)와 롱폼 구분
- **지역/언어**: 특정 국가와 언어의 콘텐츠 분석

### 결과 표시
- **영상 정보**: 제목, 채널명, 업로드일, 조회수 등
- **통계 정보**: 시간당 조회수, 구독자 대비 조회수 비율
- **시각화**: 시간대별 조회수 그래프, 채널별 통계
- **정렬/필터**: 다양한 기준으로 결과 정렬 및 검색

### 데이터 내보내기
- **엑셀 파일**: 분석 결과를 엑셀 형태로 저장
- **JSON 파일**: 작업 상태를 JSON으로 저장/불러오기
- **차트 데이터**: 시각화를 위한 차트 데이터 제공

## 🔧 기술 스택

### 백엔드
- **FastAPI**: 고성능 Python 웹 프레임워크
- **YouTube Data API v3**: YouTube 데이터 수집
- **Pandas**: 데이터 분석 및 처리
- **Matplotlib/Seaborn**: 데이터 시각화
- **OpenPyXL**: 엑셀 파일 생성

### 프론트엔드
- **React 18**: 현대적인 UI 라이브러리
- **Ant Design**: 엔터프라이즈급 UI 컴포넌트
- **Recharts**: 차트 및 그래프 시각화
- **Axios**: HTTP 클라이언트
- **React Router**: 페이지 라우팅

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 발생하거나 기능 요청이 있으시면 GitHub Issues를 통해 알려주세요.
