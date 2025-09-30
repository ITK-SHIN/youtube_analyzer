from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class AnalysisMode(str, Enum):
    CHANNEL = "channel"
    KEYWORD = "keyword"
    BOTH = "both"

class ContentType(str, Enum):
    SHORTS = "shorts"
    LONG_FORM = "long_form"
    BOTH = "both"

class AnalysisSettings(BaseModel):
    # 기본 설정
    api_key: str
    analysis_mode: AnalysisMode
    content_type: ContentType
    
    # 검색 설정
    search_terms: Optional[List[str]] = []
    channel_ids: Optional[List[str]] = []
    days_back: int = 7
    
    # 필터링 설정
    max_videos_per_channel: int = 50
    max_videos_per_search: int = 50
    min_views: int = 1000
    min_views_per_hour: int = 10
    
    # 쇼츠 설정
    shorts_max_duration: int = 60  # 초
    
    # 지역/언어 설정
    region_code: str = "KR"
    language: str = "ko"
    
    # 채널별 인기영상 보기
    show_popular_videos: bool = True

class VideoData(BaseModel):
    video_id: str
    title: str
    channel_name: str
    channel_id: str
    upload_date: datetime
    views: int
    views_per_hour: float
    subscribers: int
    views_to_subscribers_ratio: float
    duration: int  # 초
    video_url: str
    thumbnail_url: str
    is_shorts: bool

class AnalysisResult(BaseModel):
    videos: List[VideoData]
    total_videos: int
    analysis_date: datetime
    settings: AnalysisSettings
    summary: Dict[str, Any]

class ExportRequest(BaseModel):
    format: str = "excel"  # excel, json
    filename: Optional[str] = None

