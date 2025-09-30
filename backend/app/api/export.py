from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from typing import Dict, Any, List
import json
import os
import csv
import io
from datetime import datetime
from pathlib import Path

router = APIRouter()

@router.post("/excel")
async def export_to_excel(data: Dict[str, Any]):
    """CSV 파일로 내보내기 (엑셀 대신 CSV 사용)"""
    try:
        videos = data.get("videos", [])
        if not videos:
            raise HTTPException(status_code=400, detail="내보낼 데이터가 없습니다.")
        
        # 파일명 생성
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"youtube_analysis_{timestamp}.csv"
        filepath = f"exports/{filename}"
        
        # exports 폴더 생성
        os.makedirs("exports", exist_ok=True)
        
        # CSV 파일 생성
        with open(filepath, 'w', newline='', encoding='utf-8-sig') as f:
            if videos:
                # 컬럼명 한글화
                column_mapping = {
                    'video_id': '영상 ID',
                    'title': '제목',
                    'channel_name': '채널명',
                    'channel_id': '채널 ID',
                    'upload_date': '업로드일',
                    'views': '조회수',
                    'views_per_hour': '시간당 조회수',
                    'subscribers': '구독자수',
                    'views_to_subscribers_ratio': '조회수/구독자수',
                    'duration': '영상 길이(초)',
                    'video_url': '영상 링크',
                    'thumbnail_url': '썸네일',
                    'is_shorts': '쇼츠 여부'
                }
                
                # 헤더 작성
                fieldnames = [column_mapping.get(k, k) for k in videos[0].keys()]
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                # 데이터 작성
                for video in videos:
                    row = {column_mapping.get(k, k): v for k, v in video.items()}
                    writer.writerow(row)
        
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type='text/csv'
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV 내보내기 실패: {str(e)}")

@router.post("/json")
async def export_to_json(data: Dict[str, Any]) -> FileResponse:
    """JSON 파일로 내보내기"""
    try:
        if not data:
            raise HTTPException(status_code=400, detail="내보낼 데이터가 없습니다.")
        
        # 파일명 생성
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"youtube_analysis_{timestamp}.json"
        filepath = f"exports/{filename}"
        
        # exports 폴더 생성
        os.makedirs("exports", exist_ok=True)
        
        # JSON 파일 생성
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type='application/json'
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JSON 내보내기 실패: {str(e)}")

@router.get("/download/{filename}")
async def download_file(filename: str) -> FileResponse:
    """파일 다운로드"""
    try:
        filepath = f"exports/{filename}"
        
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
        
        # 파일 타입에 따른 미디어 타입 설정
        if filename.endswith('.csv'):
            media_type = 'text/csv'
        elif filename.endswith('.json'):
            media_type = 'application/json'
        else:
            media_type = 'application/octet-stream'
        
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type=media_type
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 다운로드 실패: {str(e)}")

@router.get("/list")
async def list_exported_files() -> Dict[str, Any]:
    """내보낸 파일 목록 조회"""
    try:
        exports_dir = Path("exports")
        
        if not exports_dir.exists():
            return {"files": []}
        
        files = []
        for file_path in exports_dir.iterdir():
            if file_path.is_file():
                files.append({
                    "filename": file_path.name,
                    "size": file_path.stat().st_size,
                    "created": datetime.fromtimestamp(file_path.stat().st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                })
        
        # 최신 순으로 정렬
        files.sort(key=lambda x: x["modified"], reverse=True)
        
        return {"files": files}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 목록 조회 실패: {str(e)}")

@router.delete("/{filename}")
async def delete_exported_file(filename: str) -> Dict[str, Any]:
    """내보낸 파일 삭제"""
    try:
        filepath = f"exports/{filename}"
        
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
        
        os.remove(filepath)
        
        return {
            "message": f"파일 '{filename}'이 삭제되었습니다.",
            "status": "deleted"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 삭제 실패: {str(e)}")