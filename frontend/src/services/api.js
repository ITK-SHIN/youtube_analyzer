import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log(`API 응답: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API 응답 오류:', error);
    
    if (error.response) {
      // 서버에서 응답을 받았지만 오류 상태
      const { status, data } = error.response;
      console.error(`HTTP ${status}:`, data);
    } else if (error.request) {
      // 요청을 보냈지만 응답을 받지 못함
      console.error('네트워크 오류:', error.message);
    } else {
      // 요청 설정 중 오류 발생
      console.error('요청 설정 오류:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// 분석 API
export const analysisAPI = {
  // 분석 시작
  startAnalysis: (settings) => api.post('/api/analysis/start', settings),
  
  // 분석 상태 조회
  getStatus: () => api.get('/api/analysis/status'),
  
  // 분석 결과 조회
  getResult: () => api.get('/api/analysis/result'),
  
  // 분석 중단
  stopAnalysis: () => api.post('/api/analysis/stop'),
  
  // 결과 지우기
  clearResults: () => api.delete('/api/analysis/clear'),
};

// 설정 API
export const settingsAPI = {
  // 설정 조회
  getSettings: () => api.get('/api/settings/'),
  
  // 설정 저장
  saveSettings: (settings) => api.post('/api/settings/', settings),
  
  // 설정 초기화
  resetSettings: () => api.post('/api/settings/reset'),
  
  // 설정 내보내기
  exportSettings: () => api.get('/api/settings/export'),
  
  // 설정 가져오기
  importSettings: (settings) => api.post('/api/settings/import', settings),
};

// 내보내기 API
export const exportAPI = {
  // 엑셀 내보내기
  exportToExcel: (data) => api.post('/api/export/excel', data, {
    responseType: 'blob',
  }),
  
  // JSON 내보내기
  exportToJson: (data) => api.post('/api/export/json', data, {
    responseType: 'blob',
  }),
  
  // 파일 목록 조회
  getFileList: () => api.get('/api/export/list'),
  
  // 파일 다운로드
  downloadFile: (filename) => api.get(`/api/export/download/${filename}`, {
    responseType: 'blob',
  }),
  
  // 파일 삭제
  deleteFile: (filename) => api.delete(`/api/export/${filename}`),
};

// 유틸리티 함수
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default api;
