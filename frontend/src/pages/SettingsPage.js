import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  message, 
  Divider,
  Alert,
  Row,
  Col
} from 'antd';
import { 
  SaveOutlined, 
  ReloadOutlined, 
  ExportOutlined, 
  ImportOutlined 
} from '@ant-design/icons';
import { settingsAPI, downloadBlob } from '../services/api';

const { TextArea } = Input;

const SettingsPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      form.setFieldsValue(response.data);
    } catch (error) {
      console.error('설정 로드 실패:', error);
      message.error('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const values = await form.validateFields();
      await settingsAPI.saveSettings(values);
      message.success('설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 실패:', error);
      message.error('설정 저장에 실패했습니다.');
    }
  };

  const handleResetSettings = async () => {
    try {
      await settingsAPI.resetSettings();
      await loadSettings();
      message.success('설정이 초기화되었습니다.');
    } catch (error) {
      console.error('설정 초기화 실패:', error);
      message.error('설정 초기화에 실패했습니다.');
    }
  };

  const handleExportSettings = async () => {
    try {
      const response = await settingsAPI.exportSettings();
      const filename = `youtube_analyzer_settings_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      
      const blob = new Blob([JSON.stringify(response.data.settings, null, 2)], {
        type: 'application/json'
      });
      
      downloadBlob(blob, filename);
      message.success('설정이 내보내졌습니다.');
    } catch (error) {
      console.error('설정 내보내기 실패:', error);
      message.error('설정 내보내기에 실패했습니다.');
    }
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      try {
        const file = e.target.files[0];
        const text = await file.text();
        const settings = JSON.parse(text);
        
        await settingsAPI.importSettings(settings);
        await loadSettings();
        message.success('설정이 가져와졌습니다.');
      } catch (error) {
        console.error('설정 가져오기 실패:', error);
        message.error('설정 가져오기에 실패했습니다.');
      }
    };
    input.click();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <Card title="설정 관리">
        <Alert
          message="설정 정보"
          description="YouTube API 키와 기본 분석 설정을 관리할 수 있습니다."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

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
                <Input placeholder="channel, keyword, both" />
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
                <Input placeholder="shorts, long_form, both" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="최근 몇일간의 영상"
                name="days_back"
                rules={[{ required: true, message: '일수를 입력해주세요.' }]}
              >
                <Input type="number" placeholder="7" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="검색어 (쉼표로 구분)"
            name="search_terms"
          >
            <TextArea 
              rows={3} 
              placeholder="예: 유튜브 분석, 마케팅, 트렌드"
            />
          </Form.Item>

          <Form.Item
            label="채널 ID (쉼표로 구분)"
            name="channel_ids"
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
                <Input type="number" placeholder="50" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="검색어당 최대 검색 수"
                name="max_videos_per_search"
                rules={[{ required: true, message: '최대 검색 수를 입력해주세요.' }]}
              >
                <Input type="number" placeholder="50" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="최소 조회수"
                name="min_views"
                rules={[{ required: true, message: '최소 조회수를 입력해주세요.' }]}
              >
                <Input type="number" placeholder="1000" />
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
                <Input type="number" placeholder="10" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="쇼츠 기준(초)"
                name="shorts_max_duration"
                rules={[{ required: true, message: '쇼츠 기준을 입력해주세요.' }]}
              >
                <Input type="number" placeholder="60" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="대상 국가"
                name="region_code"
                rules={[{ required: true, message: '대상 국가를 선택해주세요.' }]}
              >
                <Input placeholder="KR" />
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
                <Input placeholder="ko" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="채널별 인기영상 보기"
                name="show_popular_videos"
                valuePropName="checked"
              >
                <Input type="checkbox" />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider />

        <Space wrap>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveSettings}
            loading={loading}
          >
            설정 저장
          </Button>
          
          <Button
            icon={<ReloadOutlined />}
            onClick={handleResetSettings}
            loading={loading}
          >
            설정 초기화
          </Button>
          
          <Button
            icon={<ExportOutlined />}
            onClick={handleExportSettings}
          >
            설정 내보내기
          </Button>
          
          <Button
            icon={<ImportOutlined />}
            onClick={handleImportSettings}
          >
            설정 가져오기
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default SettingsPage;
