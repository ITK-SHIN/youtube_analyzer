#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YouTube Analyzer - 유튜브 분석 프로그램
메인 애플리케이션 파일
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
import os
from datetime import datetime, timedelta
import threading
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import seaborn as sns

from src.youtube_api import YouTubeAPI
from src.data_manager import DataManager
from src.analysis_engine import AnalysisEngine
from src.ui_components import MainWindow, SettingsDialog, ResultsWindow

class YouTubeAnalyzer:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("YouTube Analyzer - 유튜브 분석 프로그램")
        self.root.geometry("1200x800")
        self.root.minsize(1000, 600)
        
        # 스타일 설정
        self.setup_styles()
        
        # 데이터 관리자 초기화
        self.data_manager = DataManager()
        self.youtube_api = YouTubeAPI()
        self.analysis_engine = AnalysisEngine()
        
        # UI 컴포넌트 초기화
        self.main_window = MainWindow(self.root, self)
        self.settings_dialog = None
        self.results_window = None
        
        # 분석 상태
        self.is_analyzing = False
        self.current_data = []
        
    def setup_styles(self):
        """UI 스타일 설정"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # 색상 설정
        style.configure('Title.TLabel', font=('맑은 고딕', 16, 'bold'))
        style.configure('Heading.TLabel', font=('맑은 고딕', 12, 'bold'))
        style.configure('Info.TLabel', font=('맑은 고딕', 10))
        
    def run(self):
        """애플리케이션 실행"""
        self.root.mainloop()
        
    def start_analysis(self):
        """분석 시작"""
        if self.is_analyzing:
            messagebox.showwarning("경고", "이미 분석이 진행 중입니다.")
            return
            
        # 설정 검증
        settings = self.main_window.get_settings()
        if not self.validate_settings(settings):
            return
            
        self.is_analyzing = True
        self.main_window.update_analysis_status("분석 중...")
        
        # 백그라운드에서 분석 실행
        thread = threading.Thread(target=self._run_analysis, args=(settings,))
        thread.daemon = True
        thread.start()
        
    def _run_analysis(self, settings):
        """실제 분석 실행 (백그라운드 스레드)"""
        try:
            # YouTube API를 통한 데이터 수집
            data = self.youtube_api.collect_data(settings)
            
            # 데이터 분석
            analyzed_data = self.analysis_engine.analyze(data, settings)
            
            # 결과 저장
            self.current_data = analyzed_data
            self.data_manager.save_current_data(analyzed_data)
            
            # UI 업데이트
            self.root.after(0, self._analysis_complete)
            
        except Exception as e:
            self.root.after(0, lambda: self._analysis_error(str(e)))
            
    def _analysis_complete(self):
        """분석 완료 처리"""
        self.is_analyzing = False
        self.main_window.update_analysis_status("분석 완료")
        self.main_window.show_results(self.current_data)
        
    def _analysis_error(self, error_msg):
        """분석 오류 처리"""
        self.is_analyzing = False
        self.main_window.update_analysis_status("분석 실패")
        messagebox.showerror("오류", f"분석 중 오류가 발생했습니다:\n{error_msg}")
        
    def validate_settings(self, settings):
        """설정 검증"""
        if not settings.get('api_key'):
            messagebox.showerror("오류", "YouTube API 키를 입력해주세요.")
            return False
            
        if not settings.get('search_terms') and not settings.get('channel_ids'):
            messagebox.showerror("오류", "검색어 또는 채널 ID를 입력해주세요.")
            return False
            
        return True
        
    def stop_analysis(self):
        """분석 중단"""
        self.is_analyzing = False
        self.main_window.update_analysis_status("분석 중단됨")
        
    def clear_results(self):
        """결과 지우기"""
        self.current_data = []
        self.data_manager.clear_data()
        self.main_window.clear_results()
        
    def export_to_excel(self):
        """엑셀로 내보내기"""
        if not self.current_data:
            messagebox.showwarning("경고", "내보낼 데이터가 없습니다.")
            return
            
        filename = filedialog.asksaveasfilename(
            defaultextension=".xlsx",
            filetypes=[("Excel files", "*.xlsx"), ("All files", "*.*")]
        )
        
        if filename:
            try:
                self.data_manager.export_to_excel(self.current_data, filename)
                messagebox.showinfo("성공", f"데이터가 {filename}에 저장되었습니다.")
            except Exception as e:
                messagebox.showerror("오류", f"엑셀 저장 중 오류가 발생했습니다:\n{str(e)}")
                
    def save_work(self):
        """작업 저장"""
        filename = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if filename:
            try:
                self.data_manager.save_work(self.current_data, filename)
                messagebox.showinfo("성공", f"작업이 {filename}에 저장되었습니다.")
            except Exception as e:
                messagebox.showerror("오류", f"작업 저장 중 오류가 발생했습니다:\n{str(e)}")
                
    def load_work(self):
        """작업 불러오기"""
        filename = filedialog.askopenfilename(
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if filename:
            try:
                data = self.data_manager.load_work(filename)
                self.current_data = data
                self.main_window.show_results(data)
                messagebox.showinfo("성공", f"작업이 {filename}에서 불러와졌습니다.")
            except Exception as e:
                messagebox.showerror("오류", f"작업 불러오기 중 오류가 발생했습니다:\n{str(e)}")

if __name__ == "__main__":
    app = YouTubeAnalyzer()
    app.run()

