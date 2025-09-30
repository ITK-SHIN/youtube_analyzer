from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from dotenv import load_dotenv

from app.api import analysis, settings, export
from app.services.youtube_service import YouTubeService
from app.services.analysis_service import AnalysisService

load_dotenv()

app = FastAPI(
    title="YouTube Analyzer API",
    description="유튜브 분석 프로그램 백엔드 API",
    version="1.0.0"
)

# CORS 설정 (React 프론트엔드와 통신)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(export.router, prefix="/api/export", tags=["export"])

@app.get("/")
async def root():
    return {"message": "YouTube Analyzer API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

