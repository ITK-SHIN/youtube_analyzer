from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

router = APIRouter()

# 설정 파일 경로
SETTINGS_FILE = "settings.json"

@router.get("/")
async def get_settings() -> Dict[str, Any]:
    """설정 조회"""
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return _get_default_settings()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"설정 조회 실패: {str(e)}")

@router.post("/")
async def save_settings(settings: Dict[str, Any]) -> Dict[str, Any]:
    """설정 저장"""
    try:
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(settings, f, ensure_ascii=False, indent=2)
        
        return {
            "message": "설정이 저장되었습니다.",
            "status": "saved"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"설정 저장 실패: {str(e)}")

@router.post("/reset")
async def reset_settings() -> Dict[str, Any]:
    """설정 초기화"""
    try:
        default_settings = _get_default_settings()
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_settings, f, ensure_ascii=False, indent=2)
        
        return {
            "message": "설정이 초기화되었습니다.",
            "status": "reset"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"설정 초기화 실패: {str(e)}")

@router.get("/export")
async def export_settings() -> Dict[str, Any]:
    """설정 내보내기"""
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                settings = json.load(f)
            
            return {
                "settings": settings,
                "message": "설정 내보내기 완료"
            }
        else:
            raise HTTPException(status_code=404, detail="설정 파일이 없습니다.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"설정 내보내기 실패: {str(e)}")

@router.post("/import")
async def import_settings(settings: Dict[str, Any]) -> Dict[str, Any]:
    """설정 가져오기"""
    try:
        # 설정 검증
        if not _validate_settings(settings):
            raise HTTPException(status_code=400, detail="유효하지 않은 설정입니다.")
        
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(settings, f, ensure_ascii=False, indent=2)
        
        return {
            "message": "설정이 가져와졌습니다.",
            "status": "imported"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"설정 가져오기 실패: {str(e)}")

def _get_default_settings() -> Dict[str, Any]:
    """기본 설정 반환"""
    # 환경 변수에서 API 키 읽기
    api_key = os.getenv("YOUTUBE_API_KEY", "")
    
    return {
        "api_key": api_key,
        "analysis_mode": "both",
        "content_type": "both",
        "search_terms": [],
        "channel_ids": [],
        "days_back": 7,
        "max_videos_per_channel": 10,
        "max_videos_per_search": 50,
        "min_views": 20000,
        "min_views_per_hour": 10,
        "shorts_max_duration": 60,
        "region_code": "KR",
        "language": "ko",
        "show_popular_videos": True
    }

def _validate_settings(settings: Dict[str, Any]) -> bool:
    """설정 유효성 검증"""
    required_fields = [
        "api_key", "analysis_mode", "content_type", 
        "days_back", "max_videos_per_channel", "max_videos_per_search",
        "min_views", "min_views_per_hour", "shorts_max_duration",
        "region_code", "language"
    ]
    
    for field in required_fields:
        if field not in settings:
            return False
    
    # 값 범위 검증
    if settings["days_back"] < 1 or settings["days_back"] > 365:
        return False
    
    if settings["max_videos_per_channel"] < 1 or settings["max_videos_per_channel"] > 1000:
        return False
    
    if settings["max_videos_per_search"] < 1 or settings["max_videos_per_search"] > 1000:
        return False
    
    if settings["min_views"] < 0:
        return False
    
    if settings["min_views_per_hour"] < 0:
        return False
    
    if settings["shorts_max_duration"] < 1 or settings["shorts_max_duration"] > 300:
        return False
    
    return True

