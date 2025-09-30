import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Switch, 
  Button, 
  Space, 
  Row, 
  Col, 
  Divider,
  Progress,
  Alert,
  message
} from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined, 
  ClearOutlined,
  SaveOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import { analysisAPI, settingsAPI, exportAPI, downloadBlob } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const AnalysisPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState({
    is_running: false,
    progress: 0,
    current_task: '',
    error: null,
    result: null
  });

  // 폴링을 위한 상태
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 설정 로드
    loadSettings();
    
    return () => {
      // 컴포넌트 언마운트 시 폴링 중지
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      form.setFieldsValue(response.data);
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  };

  const startStatusPolling = () => {
    // 기존 폴링이 있으면 중지
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    const interval = setInterval(async () => {
      try {
        const response = await analysisAPI.getStatus();
        setAnalysisStatus(response.data);
        
        // 분석이 완료되거나 오류가 발생하면 폴링 중지
        if (!response.data.is_running) {
          clearInterval(interval);
          setPollingInterval(null);
          
          if (response.data.result) {
            message.success('분석이 완료되었습니다!');
          } else if (response.data.error) {
            message.error('분석 중 오류가 발생했습니다.');
          }
        }
      } catch (error) {
        console.error('상태 조회 실패:', error);
        // 오류 발생 시 폴링 중지
        clearInterval(interval);
        setPollingInterval(null);
      }
    }, 3000); // 2초에서 3초로 변경
    
    setPollingInterval(interval);
  };

  const handleStartAnalysis = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // 데이터 형식 변환
      const formattedValues = {
        ...values,
        search_terms: values.search_terms ? 
          (typeof values.search_terms === 'string' ? 
            values.search_terms.split(',').map(term => term.trim()).filter(term => term) : 
            values.search_terms) : [],
        channel_ids: values.channel_ids ? 
          (typeof values.channel_ids === 'string' ? 
            values.channel_ids.split(',').map(id => id.trim()).filter(id => id) : 
            values.channel_ids) : []
      };
      
      await analysisAPI.startAnalysis(formattedValues);
      message.success('분석이 시작되었습니다.');
      
      // 폴링 시작
      setTimeout(() => {
        startStatusPolling();
      }, 1000);
      
    } catch (error) {
      console.error('분석 시작 실패:', error);
      message.error('분석 시작에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopAnalysis = async () => {
    try {
      await analysisAPI.stopAnalysis();
      message.info('분석이 중단되었습니다.');
      
      // 폴링 중지
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    } catch (error) {
      console.error('분석 중단 실패:', error);
      message.error('분석 중단에 실패했습니다.');
    }
  };

  const handleClearResults = async () => {
    try {
      await analysisAPI.clearResults();
      setAnalysisStatus({
        is_running: false,
        progress: 0,
        current_task: '',
        error: null,
        result: null
      });
      message.info('결과가 지워졌습니다.');
    } catch (error) {
      console.error('결과 지우기 실패:', error);
      message.error('결과 지우기에 실패했습니다.');
    }
  };

  const handleSaveWork = async () => {
    try {
      if (!analysisStatus.result) {
        message.warning('저장할 결과가 없습니다.');
        return;
      }
      
      const blob = await exportAPI.exportToJson(analysisStatus.result);
      const filename = `youtube_analysis_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      downloadBlob(blob.data, filename);
      message.success('작업이 저장되었습니다.');
    } catch (error) {
      console.error('작업 저장 실패:', error);
      message.error('작업 저장에 실패했습니다.');
    }
  };

  const handleLoadWork = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      try {
        const file = e.target.files[0];
        const text = await file.text();
        const data = JSON.parse(text);
        
        // 결과 설정
        setAnalysisStatus(prev => ({
          ...prev,
          result: data
        }));
        
        message.success('작업이 불러와졌습니다.');
      } catch (error) {
        console.error('작업 불러오기 실패:', error);
        message.error('작업 불러오기에 실패했습니다.');
      }
    };
    input.click();
  };

  const handleExportExcel = async () => {
    try {
      if (!analysisStatus.result) {
        message.warning('내보낼 결과가 없습니다.');
        return;
      }
      
      const blob = await exportAPI.exportToExcel(analysisStatus.result);
      const filename = `youtube_analysis_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
      downloadBlob(blob.data, filename);
      message.success('엑셀 파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('엑셀 내보내기 실패:', error);
      message.error('엑셀 내보내기에 실패했습니다.');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Card title="YouTube 분석 설정" className="analysis-form">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            analysis_mode: 'both',
            content_type: 'both',
            days_back: 7,
            max_videos_per_channel: 50,
            max_videos_per_search: 50,
            min_views: 1000,
            min_views_per_hour: 10,
            shorts_max_duration: 60,
            region_code: 'KR',
            language: 'ko',
            show_popular_videos: true
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="YouTube API 키"
                name="api_key"
                rules={[{ required: true, message: 'API 키를 입력해주세요.' }]}
              >
                <Input.Password placeholder="YouTube API 키를 입력하세요" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="실행 모드"
                name="analysis_mode"
                rules={[{ required: true, message: '실행 모드를 선택해주세요.' }]}
              >
                <Select>
                  <Option value="channel">채널</Option>
                  <Option value="keyword">키워드</Option>
                  <Option value="both">둘 다</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="콘텐츠 타입"
                name="content_type"
                rules={[{ required: true, message: '콘텐츠 타입을 선택해주세요.' }]}
              >
                <Select>
                  <Option value="shorts">쇼츠</Option>
                  <Option value="long_form">롱폼</Option>
                  <Option value="both">둘 다</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="최근 몇일간의 영상"
                name="days_back"
                rules={[{ required: true, message: '일수를 입력해주세요.' }]}
              >
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="검색어 (키워드 모드)"
            name="search_terms"
            help="여러 검색어는 쉼표로 구분하세요"
          >
            <TextArea 
              rows={3} 
              placeholder="예: 유튜브 분석, 마케팅, 트렌드"
            />
          </Form.Item>

          <Form.Item
            label="채널 ID (채널 모드)"
            name="channel_ids"
            help="여러 채널 ID는 쉼표로 구분하세요"
          >
            <TextArea 
              rows={3} 
              placeholder="예: UC_x5XG1OV2P6uZZ5FSM9Ttw, UCvjgXvBlb6ydBjjpiqj4Q"
            />
          </Form.Item>

          <Divider>필터 설정</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="채널당 최대 검색 수"
                name="max_videos_per_channel"
                rules={[{ required: true, message: '최대 검색 수를 입력해주세요.' }]}
              >
                <InputNumber min={1} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="검색어당 최대 검색 수"
                name="max_videos_per_search"
                rules={[{ required: true, message: '최대 검색 수를 입력해주세요.' }]}
              >
                <InputNumber min={1} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="최소 조회수"
                name="min_views"
                rules={[{ required: true, message: '최소 조회수를 입력해주세요.' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="최소 시간당 조회수"
                name="min_views_per_hour"
                rules={[{ required: true, message: '최소 시간당 조회수를 입력해주세요.' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="쇼츠 기준(초)"
                name="shorts_max_duration"
                rules={[{ required: true, message: '쇼츠 기준을 입력해주세요.' }]}
              >
                <InputNumber min={1} max={300} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="대상 국가"
                name="region_code"
                rules={[{ required: true, message: '대상 국가를 선택해주세요.' }]}
              >
                <Select>
                  <Option value="KR">한국</Option>
                  <Option value="US">미국</Option>
                  <Option value="JP">일본</Option>
                  <Option value="CN">중국</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="언어"
                name="language"
                rules={[{ required: true, message: '언어를 선택해주세요.' }]}
              >
                <Select>
                  <Option value="ko">한국어</Option>
                  <Option value="en">영어</Option>
                  <Option value="ja">일본어</Option>
                  <Option value="zh">중국어</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="채널별 인기영상 보기"
                name="show_popular_videos"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider />

        <Space wrap>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStartAnalysis}
            loading={loading}
            disabled={analysisStatus.is_running}
          >
            시작하기
          </Button>
          
          <Button
            icon={<StopOutlined />}
            onClick={handleStopAnalysis}
            disabled={!analysisStatus.is_running}
          >
            중단하기
          </Button>
          
          <Button
            icon={<ClearOutlined />}
            onClick={handleClearResults}
          >
            결과 지우기
          </Button>
          
          <Button
            icon={<SaveOutlined />}
            onClick={handleSaveWork}
            disabled={!analysisStatus.result}
          >
            작업 저장
          </Button>
          
          <Button
            icon={<FolderOpenOutlined />}
            onClick={handleLoadWork}
          >
            작업 불러오기
          </Button>
          
          <Button
            onClick={handleExportExcel}
            disabled={!analysisStatus.result}
          >
            엑셀로 저장
          </Button>
        </Space>
      </Card>

      {/* 분석 상태 표시 */}
      {analysisStatus.is_running && (
        <Card title="분석 진행 상황" style={{ marginTop: 16 }}>
          <Progress 
            percent={analysisStatus.progress} 
            status="active"
            strokeColor="#1890ff"
          />
          <p style={{ marginTop: 8, color: '#666' }}>
            {analysisStatus.current_task}
          </p>
        </Card>
      )}

      {/* 오류 표시 */}
      {analysisStatus.error && (
        <Alert
          message="분석 오류"
          description={analysisStatus.error}
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* 결과 요약 */}
      {analysisStatus.result && (
        <Card title="분석 결과 요약" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {analysisStatus.result.total_videos}
                </div>
                <div style={{ color: '#666' }}>총 영상 수</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {analysisStatus.result.summary?.total_channels || 0}
                </div>
                <div style={{ color: '#666' }}>총 채널 수</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {analysisStatus.result.summary?.shorts_count || 0}
                </div>
                <div style={{ color: '#666' }}>쇼츠 수</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                  {Math.round(analysisStatus.result.summary?.avg_views || 0).toLocaleString()}
                </div>
                <div style={{ color: '#666' }}>평균 조회수</div>
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default AnalysisPage;
