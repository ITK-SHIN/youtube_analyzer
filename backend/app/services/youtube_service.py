import os
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from typing import List, Dict, Any
import asyncio
from datetime import datetime, timedelta
import logging

from app.models.analysis_models import AnalysisSettings, VideoData

logger = logging.getLogger(__name__)

class YouTubeService:
    def __init__(self):
        self.youtube = None
        
    def initialize(self, api_key: str):
        """YouTube API 초기화"""
        try:
            self.youtube = build('youtube', 'v3', developerKey=api_key)
            return True
        except Exception as e:
            logger.error(f"YouTube API 초기화 실패: {e}")
            return False
    
    async def collect_data(self, settings: AnalysisSettings) -> List[VideoData]:
        """설정에 따라 데이터 수집"""
        if not self.youtube:
            if not self.initialize(settings.api_key):
                raise Exception("YouTube API 초기화 실패")
        
        videos = []
        
        # 디버깅을 위한 설정 정보 로깅
        logger.info(f"=== 데이터 수집 시작 ===")
        logger.info(f"analysis_mode: {settings.analysis_mode}")
        logger.info(f"search_terms: {settings.search_terms}")
        logger.info(f"channel_ids: {settings.channel_ids}")
        logger.info(f"search_terms 길이: {len(settings.search_terms) if settings.search_terms else 0}")
        logger.info(f"channel_ids 길이: {len(settings.channel_ids) if settings.channel_ids else 0}")
        
        try:
            # 채널 모드 또는 둘 다 모드
            if settings.analysis_mode in ["channel", "both"] and settings.channel_ids and len(settings.channel_ids) > 0:
                logger.info("채널 영상 수집 시작")
                channel_videos = await self._get_channel_videos(settings)
                videos.extend(channel_videos)
                logger.info(f"채널 영상 {len(channel_videos)}개 수집 완료")
            
            # 키워드 모드 또는 둘 다 모드
            if settings.analysis_mode in ["keyword", "both"] and settings.search_terms and len(settings.search_terms) > 0:
                logger.info("키워드 영상 수집 시작")
                keyword_videos = await self._get_keyword_videos(settings)
                videos.extend(keyword_videos)
                logger.info(f"키워드 영상 {len(keyword_videos)}개 수집 완료")
            
            # 검색어와 채널 ID가 모두 없는 경우 전체 인기 영상 수집
            has_search_terms = settings.search_terms and len(settings.search_terms) > 0
            has_channel_ids = settings.channel_ids and len(settings.channel_ids) > 0
            
            logger.info(f"has_search_terms: {has_search_terms}")
            logger.info(f"has_channel_ids: {has_channel_ids}")
            
            if not has_search_terms and not has_channel_ids:
                logger.info("검색어와 채널 ID가 모두 없음. 트렌딩 영상 수집 시작")
                trending_videos = await self._get_trending_videos(settings)
                videos.extend(trending_videos)
                logger.info(f"트렌딩 영상 {len(trending_videos)}개 수집 완료")
            else:
                logger.info("검색어 또는 채널 ID가 있음. 트렌딩 영상 수집 건너뜀")
            
            logger.info(f"수집된 총 영상 수: {len(videos)}")
            
            # 중복 제거
            unique_videos = self._remove_duplicates(videos)
            logger.info(f"중복 제거 후 영상 수: {len(unique_videos)}")
            
            # 필터링 적용
            filtered_videos = self._apply_filters(unique_videos, settings)
            logger.info(f"필터링 후 영상 수: {len(filtered_videos)}")
            
            return filtered_videos
            
        except Exception as e:
            logger.error(f"데이터 수집 중 오류: {e}")
            raise
    
    async def _get_channel_videos(self, settings: AnalysisSettings) -> List[VideoData]:
        """채널별 영상 수집"""
        videos = []
        
        for channel_id in settings.channel_ids:
            try:
                # 채널 정보 가져오기
                channel_info = self.youtube.channels().list(
                    part='snippet,statistics',
                    id=channel_id
                ).execute()
                
                if not channel_info['items']:
                    continue
                    
                channel_data = channel_info['items'][0]
                channel_name = channel_data['snippet']['title']
                subscribers = int(channel_data['statistics'].get('subscriberCount', 0))
                
                # 채널의 최근 영상들 가져오기
                search_response = self.youtube.search().list(
                    part='snippet',
                    channelId=channel_id,
                    type='video',
                    order='date',
                    maxResults=settings.max_videos_per_channel,
                    publishedAfter=self._get_date_filter(settings.days_back)
                ).execute()
                
                # 각 영상의 상세 정보 가져오기
                for item in search_response['items']:
                    video_id = item['id']['videoId']
                    video_data = await self._get_video_details(video_id, channel_name, subscribers, settings)
                    if video_data:
                        videos.append(video_data)
                        
            except HttpError as e:
                logger.error(f"채널 {channel_id} 데이터 수집 실패: {e}")
                continue
                
        return videos
    
    async def _get_keyword_videos(self, settings: AnalysisSettings) -> List[VideoData]:
        """키워드별 영상 수집"""
        videos = []
        
        for keyword in settings.search_terms:
            try:
                search_response = self.youtube.search().list(
                    part='snippet',
                    q=keyword,
                    type='video',
                    order='relevance',
                    maxResults=settings.max_videos_per_search,
                    publishedAfter=self._get_date_filter(settings.days_back),
                    regionCode=settings.region_code
                ).execute()
                
                # 각 영상의 상세 정보 가져오기
                for item in search_response['items']:
                    video_id = item['id']['videoId']
                    channel_id = item['snippet']['channelId']
                    
                    # 채널 정보 가져오기
                    channel_info = self.youtube.channels().list(
                        part='snippet,statistics',
                        id=channel_id
                    ).execute()
                    
                    if not channel_info['items']:
                        continue
                        
                    channel_data = channel_info['items'][0]
                    channel_name = channel_data['snippet']['title']
                    subscribers = int(channel_data['statistics'].get('subscriberCount', 0))
                    
                    video_data = await self._get_video_details(video_id, channel_name, subscribers, settings)
                    if video_data:
                        videos.append(video_data)
                        
            except HttpError as e:
                logger.error(f"키워드 '{keyword}' 검색 실패: {e}")
                continue
                
        return videos
    
    async def _get_trending_videos(self, settings: AnalysisSettings) -> List[VideoData]:
        """트렌딩/인기 영상 수집"""
        videos = []
        
        # 인기 키워드들로 검색
        trending_keywords = ["music", "funny", "gaming", "news", "sports", "tech", "cooking", "travel"]
        
        try:
            for keyword in trending_keywords[:3]:  # 처음 3개 키워드만 사용
                logger.info(f"키워드 '{keyword}'로 트렌딩 영상 검색 시작")
                
                search_response = self.youtube.search().list(
                    part='snippet',
                    type='video',
                    q=keyword,  # 키워드 검색
                    order='relevance',
                    maxResults=min(settings.max_videos_per_search // 3, 20),  # 키워드당 20개씩
                    publishedAfter=self._get_date_filter(settings.days_back),
                    regionCode=settings.region_code
                ).execute()
                
                logger.info(f"키워드 '{keyword}' 검색 결과: {len(search_response.get('items', []))}개")
                
                if not search_response.get('items'):
                    logger.warning(f"키워드 '{keyword}' 검색 결과가 없습니다.")
                    continue
                
                # 각 영상의 상세 정보 가져오기
                for i, item in enumerate(search_response['items']):
                    try:
                        video_id = item['id']['videoId']
                        channel_id = item['snippet']['channelId']
                        
                        logger.info(f"영상 {i+1}/{len(search_response['items'])} 처리 중: {video_id}")
                        
                        # 채널 정보 가져오기
                        channel_info = self.youtube.channels().list(
                            part='snippet,statistics',
                            id=channel_id
                        ).execute()
                        
                        if not channel_info.get('items'):
                            logger.warning(f"채널 정보를 찾을 수 없음: {channel_id}")
                            continue
                            
                        channel_data = channel_info['items'][0]
                        channel_name = channel_data['snippet']['title']
                        subscribers = int(channel_data['statistics'].get('subscriberCount', 0))
                        
                        video_data = await self._get_video_details(video_id, channel_name, subscribers, settings)
                        if video_data:
                            videos.append(video_data)
                            logger.info(f"영상 추가: {video_data.title} (조회수: {video_data.views})")
                        else:
                            logger.warning(f"영상 상세 정보 수집 실패: {video_id}")
                            
                    except Exception as e:
                        logger.error(f"영상 {video_id} 처리 실패: {e}")
                        continue
                        
        except HttpError as e:
            logger.error(f"트렌딩 영상 수집 실패: {e}")
        except Exception as e:
            logger.error(f"트렌딩 영상 수집 중 예상치 못한 오류: {e}")
            
        logger.info(f"총 {len(videos)}개의 트렌딩 영상 수집 완료")
        return videos
    
    async def _get_video_details(self, video_id: str, channel_name: str, subscribers: int, settings: AnalysisSettings) -> VideoData:
        """영상 상세 정보 가져오기"""
        try:
            video_response = self.youtube.videos().list(
                part='snippet,statistics,contentDetails',
                id=video_id
            ).execute()
            
            if not video_response['items']:
                return None
                
            video = video_response['items'][0]
            
            # 기본 정보
            title = video['snippet']['title']
            upload_date = datetime.fromisoformat(video['snippet']['publishedAt'].replace('Z', '+00:00'))
            views = int(video['statistics'].get('viewCount', 0))
            duration = self._parse_duration(video['contentDetails']['duration'])
            
            # 시간당 조회수 계산
            hours_since_upload = (datetime.now(upload_date.tzinfo) - upload_date).total_seconds() / 3600
            views_per_hour = views / max(hours_since_upload, 1)
            
            # 구독자 대비 조회수 비율
            views_to_subscribers_ratio = views / max(subscribers, 1)
            
            # 쇼츠 여부 확인
            is_shorts = duration <= settings.shorts_max_duration
            
            # 콘텐츠 타입 필터링
            if settings.content_type == "shorts" and not is_shorts:
                return None
            elif settings.content_type == "long_form" and is_shorts:
                return None
            
            return VideoData(
                video_id=video_id,
                title=title,
                channel_name=channel_name,
                channel_id=video['snippet']['channelId'],
                upload_date=upload_date,
                views=views,
                views_per_hour=views_per_hour,
                subscribers=subscribers,
                views_to_subscribers_ratio=views_to_subscribers_ratio,
                duration=duration,
                video_url=f"https://www.youtube.com/watch?v={video_id}",
                thumbnail_url=video['snippet']['thumbnails']['high']['url'],
                is_shorts=is_shorts
            )
            
        except Exception as e:
            logger.error(f"영상 {video_id} 상세 정보 가져오기 실패: {e}")
            return None
    
    def _parse_duration(self, duration: str) -> int:
        """ISO 8601 duration을 초 단위로 변환"""
        import re
        
        # PT4M13S -> 4분 13초
        pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
        match = re.match(pattern, duration)
        
        if not match:
            return 0
            
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        return hours * 3600 + minutes * 60 + seconds
    
    def _get_date_filter(self, days_back: int) -> str:
        """날짜 필터 문자열 생성"""
        # 최소 30일 전부터 검색하도록 제한을 완화
        min_days = max(days_back, 30)
        date = datetime.now() - timedelta(days=min_days)
        return date.isoformat() + 'Z'
    
    def _remove_duplicates(self, videos: List[VideoData]) -> List[VideoData]:
        """중복 영상 제거"""
        seen = set()
        unique_videos = []
        
        for video in videos:
            if video.video_id not in seen:
                seen.add(video.video_id)
                unique_videos.append(video)
                
        return unique_videos
    
    def _apply_filters(self, videos: List[VideoData], settings: AnalysisSettings) -> List[VideoData]:
        """필터 적용"""
        filtered = []
        
        for video in videos:
            # 최소 조회수 필터
            if video.views < settings.min_views:
                continue
                
            # 최소 시간당 조회수 필터
            if video.views_per_hour < settings.min_views_per_hour:
                continue
                
            filtered.append(video)
            
        return filtered

