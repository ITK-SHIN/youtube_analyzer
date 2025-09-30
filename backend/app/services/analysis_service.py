from typing import List, Dict, Any
from datetime import datetime
from collections import defaultdict

from app.models.analysis_models import VideoData, AnalysisResult, AnalysisSettings

class AnalysisService:
    def __init__(self):
        pass
    
    def analyze(self, videos: List[VideoData], settings: AnalysisSettings) -> AnalysisResult:
        """영상 데이터 분석"""
        if not videos:
            return AnalysisResult(
                videos=[],
                total_videos=0,
                analysis_date=datetime.now(),
                settings=settings,
                summary={}
            )
        
        # 기본 통계 계산
        summary = self._calculate_summary(videos)
        
        # 시간당 조회수 그래프 데이터 생성
        hourly_data = self._calculate_hourly_views(videos)
        
        # 채널별 통계
        channel_stats = self._calculate_channel_stats(videos)
        
        # 인기 영상 (상위 10개)
        popular_videos = self._get_popular_videos(videos, 10)
        
        summary.update({
            'hourly_views': hourly_data,
            'channel_stats': channel_stats,
            'popular_videos': popular_videos
        })
        
        return AnalysisResult(
            videos=videos,
            total_videos=len(videos),
            analysis_date=datetime.now(),
            settings=settings,
            summary=summary
        )
    
    def _calculate_summary(self, videos: List[VideoData]) -> Dict[str, Any]:
        """기본 통계 계산"""
        if not videos:
            return {}
        
        total_views = sum(v.views for v in videos)
        views_list = [v.views for v in videos]
        views_per_hour_list = [v.views_per_hour for v in videos]
        
        # 중앙값 계산
        sorted_views = sorted(views_list)
        n = len(sorted_views)
        median_views = sorted_views[n // 2] if n % 2 == 1 else (sorted_views[n // 2 - 1] + sorted_views[n // 2]) / 2
        
        sorted_vph = sorted(views_per_hour_list)
        median_vph = sorted_vph[n // 2] if n % 2 == 1 else (sorted_vph[n // 2 - 1] + sorted_vph[n // 2]) / 2
        
        # 채널 수 계산
        unique_channels = set(v.channel_name for v in videos)
        
        # 쇼츠/롱폼 카운트
        shorts_count = sum(1 for v in videos if v.is_shorts)
        long_form_count = len(videos) - shorts_count
        
        return {
            'total_videos': len(videos),
            'total_views': total_views,
            'avg_views': total_views / len(videos),
            'median_views': median_views,
            'avg_views_per_hour': sum(views_per_hour_list) / len(views_per_hour_list),
            'median_views_per_hour': median_vph,
            'total_channels': len(unique_channels),
            'shorts_count': shorts_count,
            'long_form_count': long_form_count,
            'avg_duration': sum(v.duration for v in videos) / len(videos),
            'avg_subscribers': sum(v.subscribers for v in videos) / len(videos),
            'avg_views_to_subscribers_ratio': sum(v.views_to_subscribers_ratio for v in videos) / len(videos)
        }
    
    def _calculate_hourly_views(self, videos: List[VideoData]) -> List[Dict[str, Any]]:
        """시간당 조회수 데이터 계산"""
        if not videos:
            return []
        
        # 시간별로 그룹화
        hourly_data = defaultdict(lambda: {'total_views': 0, 'video_count': 0, 'views_per_hour_sum': 0})
        
        for video in videos:
            hour = video.upload_date.hour
            hourly_data[hour]['total_views'] += video.views
            hourly_data[hour]['video_count'] += 1
            hourly_data[hour]['views_per_hour_sum'] += video.views_per_hour
        
        # 결과 변환
        result = []
        for hour in range(24):
            if hour in hourly_data:
                data = hourly_data[hour]
                result.append({
                    'upload_hour': hour,
                    'total_views': data['total_views'],
                    'avg_views': round(data['total_views'] / data['video_count'], 2),
                    'video_count': data['video_count'],
                    'avg_views_per_hour': round(data['views_per_hour_sum'] / data['video_count'], 2)
                })
        
        return result
    
    def _calculate_channel_stats(self, videos: List[VideoData]) -> List[Dict[str, Any]]:
        """채널별 통계 계산"""
        if not videos:
            return []
        
        # 채널별로 그룹화
        channel_data = defaultdict(lambda: {
            'channel_id': '',
            'total_views': 0,
            'video_count': 0,
            'views_per_hour_sum': 0,
            'subscribers': 0,
            'views_to_subscribers_ratio_sum': 0
        })
        
        for video in videos:
            ch_name = video.channel_name
            channel_data[ch_name]['channel_id'] = video.channel_id
            channel_data[ch_name]['total_views'] += video.views
            channel_data[ch_name]['video_count'] += 1
            channel_data[ch_name]['views_per_hour_sum'] += video.views_per_hour
            channel_data[ch_name]['subscribers'] = video.subscribers  # 마지막 값 사용
            channel_data[ch_name]['views_to_subscribers_ratio_sum'] += video.views_to_subscribers_ratio
        
        # 결과 변환 및 정렬
        result = []
        for channel_name, data in channel_data.items():
            result.append({
                'channel_name': channel_name,
                'channel_id': data['channel_id'],
                'total_views': data['total_views'],
                'avg_views': round(data['total_views'] / data['video_count'], 2),
                'video_count': data['video_count'],
                'avg_views_per_hour': round(data['views_per_hour_sum'] / data['video_count'], 2),
                'subscribers': data['subscribers'],
                'avg_views_to_subscribers_ratio': round(data['views_to_subscribers_ratio_sum'] / data['video_count'], 2)
            })
        
        # 조회수 순으로 정렬
        result.sort(key=lambda x: x['total_views'], reverse=True)
        
        return result
    
    def _get_popular_videos(self, videos: List[VideoData], limit: int = 10) -> List[Dict[str, Any]]:
        """인기 영상 상위 N개 반환"""
        if not videos:
            return []
        
        # 조회수 순으로 정렬
        sorted_videos = sorted(videos, key=lambda x: x.views, reverse=True)[:limit]
        
        return [
            {
                'video_id': v.video_id,
                'title': v.title,
                'channel_name': v.channel_name,
                'views': v.views,
                'views_per_hour': round(v.views_per_hour, 2),
                'upload_date': v.upload_date.isoformat(),
                'video_url': v.video_url,
                'thumbnail_url': v.thumbnail_url
            }
            for v in sorted_videos
        ]
    
    def create_charts_data(self, analysis_result: AnalysisResult) -> Dict[str, Any]:
        """차트 데이터 생성"""
        if not analysis_result.videos:
            return {}
        
        videos = analysis_result.videos
        
        # 시간별 조회수 그래프
        hourly_views = [0] * 24
        for video in videos:
            hour = video.upload_date.hour
            hourly_views[hour] += video.views
        
        # 채널별 조회수 (상위 10개)
        channel_views = defaultdict(int)
        for video in videos:
            channel_views[video.channel_name] += video.views
        
        top_channels = sorted(channel_views.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # 콘텐츠 타입별 분포
        shorts_count = sum(1 for v in videos if v.is_shorts)
        long_form_count = len(videos) - shorts_count
        
        # 조회수 분포
        bins = [0, 1000, 10000, 100000, 1000000, float('inf')]
        labels = ['1K 미만', '1K-10K', '10K-100K', '100K-1M', '1M 이상']
        distribution = [0] * len(labels)
        
        for video in videos:
            for i, (low, high) in enumerate(zip(bins[:-1], bins[1:])):
                if low <= video.views < high:
                    distribution[i] += 1
                    break
        
        charts_data = {
            'hourly_views_chart': {
                'labels': [f"{i}시" for i in range(24)],
                'data': hourly_views
            },
            'channel_views_chart': {
                'labels': [ch[0] for ch in top_channels],
                'data': [ch[1] for ch in top_channels]
            },
            'content_type_pie': {
                'labels': ['쇼츠', '롱폼'],
                'data': [shorts_count, long_form_count]
            },
            'views_distribution': {
                'labels': labels,
                'data': distribution
            }
        }
        
        return charts_data