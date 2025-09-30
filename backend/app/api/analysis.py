from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
import asyncio
import logging

from app.models.analysis_models import AnalysisSettings, AnalysisResult
from app.services.youtube_service import YouTubeService
from app.services.analysis_service import AnalysisService

router = APIRouter()
logger = logging.getLogger(__name__)

# 전역 서비스 인스턴스
youtube_service = YouTubeService()
analysis_service = AnalysisService()

# 분석 상태 저장
analysis_status = {
    "is_running": False,
    "progress": 0,
    "current_task": "",
    "error": None,
    "result": None
}

@router.post("/start")
async def start_analysis(settings: AnalysisSettings) -> Dict[str, Any]:
    """분석 시작"""
    global analysis_status
    
    if analysis_status["is_running"]:
        raise HTTPException(status_code=400, detail="이미 분석이 진행 중입니다.")
    
    try:
        # 분석 상태 초기화
        analysis_status = {
            "is_running": True,
            "progress": 0,
            "current_task": "데이터 수집 중...",
            "error": None,
            "result": None
        }
        
        # 백그라운드에서 분석 실행
        asyncio.create_task(_run_analysis_async(settings))
        
        return {
            "message": "분석이 시작되었습니다.",
            "status": "started"
        }
        
    except Exception as e:
        analysis_status["is_running"] = False
        analysis_status["error"] = str(e)
        logger.error(f"분석 시작 실패: {e}")
        raise HTTPException(status_code=500, detail=f"분석 시작 실패: {str(e)}")

@router.get("/status")
async def get_analysis_status() -> Dict[str, Any]:
    """분석 상태 조회"""
    return analysis_status

@router.get("/result")
async def get_analysis_result() -> Dict[str, Any]:
    """분석 결과 조회"""
    if not analysis_status["result"]:
        raise HTTPException(status_code=404, detail="분석 결과가 없습니다.")
    
    return analysis_status["result"]

@router.post("/stop")
async def stop_analysis() -> Dict[str, Any]:
    """분석 중단"""
    global analysis_status
    
    if not analysis_status["is_running"]:
        raise HTTPException(status_code=400, detail="실행 중인 분석이 없습니다.")
    
    analysis_status["is_running"] = False
    analysis_status["current_task"] = "분석이 중단되었습니다."
    
    return {
        "message": "분석이 중단되었습니다.",
        "status": "stopped"
    }

@router.delete("/clear")
async def clear_results() -> Dict[str, Any]:
    """결과 지우기"""
    global analysis_status
    
    analysis_status = {
        "is_running": False,
        "progress": 0,
        "current_task": "",
        "error": None,
        "result": None
    }
    
    return {
        "message": "결과가 지워졌습니다.",
        "status": "cleared"
    }

async def _run_analysis_async(settings: AnalysisSettings):
    """비동기 분석 실행"""
    global analysis_status
    
    try:
        # 1단계: 데이터 수집
        analysis_status["current_task"] = "YouTube 데이터 수집 중..."
        analysis_status["progress"] = 20
        
        logger.info(f"분석 시작 - 설정: {settings.dict()}")
        videos = await youtube_service.collect_data(settings)
        
        logger.info(f"수집된 영상 수: {len(videos) if videos else 0}")
        
        if not videos:
            analysis_status["error"] = "수집된 데이터가 없습니다. 검색 조건을 확인해주세요."
            analysis_status["is_running"] = False
            logger.warning("수집된 데이터가 없음")
            return
        
        # 2단계: 데이터 분석
        analysis_status["current_task"] = "데이터 분석 중..."
        analysis_status["progress"] = 60
        
        result = analysis_service.analyze(videos, settings)
        
        # 3단계: 차트 데이터 생성
        analysis_status["current_task"] = "차트 데이터 생성 중..."
        analysis_status["progress"] = 80
        
        charts_data = analysis_service.create_charts_data(result)
        
        # 결과 저장
        analysis_status["result"] = {
            "videos": [video.dict() for video in result.videos],
            "total_videos": result.total_videos,
            "analysis_date": result.analysis_date.isoformat(),
            "settings": settings.dict(),
            "summary": result.summary,
            "charts": charts_data
        }
        
        # 완료
        analysis_status["current_task"] = "분석 완료"
        analysis_status["progress"] = 100
        analysis_status["is_running"] = False
        
    except Exception as e:
        logger.error(f"분석 실행 중 오류: {e}")
        analysis_status["error"] = str(e)
        analysis_status["is_running"] = False
        analysis_status["current_task"] = f"오류 발생: {str(e)}"

