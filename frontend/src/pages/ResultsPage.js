import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Space, 
  Button, 
  Tag, 
  Image, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  Select,
  Input,
  message,
  Spin
} from 'antd';
import { 
  DownloadOutlined, 
  LinkOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons';
import { analysisAPI, exportAPI, downloadBlob } from '../services/api';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

const ResultsPage = () => {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [sortField, setSortField] = useState('views');
  const [sortOrder, setSortOrder] = useState('descend');

  useEffect(() => {
    loadAnalysisResult();
  }, []);

  const loadAnalysisResult = async () => {
    try {
      setLoading(true);
      const response = await analysisAPI.getResult();
      setAnalysisResult(response.data);
      setFilteredData(response.data.videos || []);
    } catch (error) {
      console.error('결과 로드 실패:', error);
      if (error.response?.status === 404) {
        // 404 에러는 정상적인 상황 (아직 분석 결과가 없음)
        setAnalysisResult(null);
        setFilteredData([]);
        // 메시지 표시하지 않음 (사용자에게 방해가 되지 않도록)
      } else {
        message.error('분석 결과를 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    const newOrder = sortField === field && sortOrder === 'descend' ? 'ascend' : 'descend';
    setSortField(field);
    setSortOrder(newOrder);
    
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (newOrder === 'ascend') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredData(sorted);
  };

  const handleSearch = (value) => {
    if (!value) {
      setFilteredData(analysisResult?.videos || []);
      return;
    }
    
    const filtered = (analysisResult?.videos || []).filter(video =>
      video.title.toLowerCase().includes(value.toLowerCase()) ||
      video.channel_name.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredData(filtered);
  };

  const handleExportExcel = async () => {
    try {
      if (!analysisResult) {
        message.warning('내보낼 결과가 없습니다.');
        return;
      }
      
      const blob = await exportAPI.exportToExcel(analysisResult);
      const filename = `youtube_analysis_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
      downloadBlob(blob.data, filename);
      message.success('엑셀 파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('엑셀 내보내기 실패:', error);
      message.error('엑셀 내보내기에 실패했습니다.');
    }
  };

  const openVideo = (videoUrl) => {
    window.open(videoUrl, '_blank');
  };

  const columns = [
    {
      title: '번호',
      key: 'index',
      width: 30,
      render: (_, __, index) => index + 1,
    },
    {
      title: '채널명',
      dataIndex: 'channel_name',
      key: 'channel_name',
      width: 80,
      ellipsis: false,
      render: (channelName) => (
        <div style={{ 
          lineHeight: '1.3',
          fontSize: '12px',
          wordBreak: 'break-word',
          whiteSpace: 'normal'
        }}>
          {channelName}
        </div>
      ),
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      width: 150,
      ellipsis: false,
      render: (title, record) => (
        <div style={{ minHeight: '60px', padding: '4px 0' }}>
          <Typography.Text 
            style={{ 
              display: 'block', 
              marginBottom: 8,
              lineHeight: '1.4',
              fontSize: '12px',
              wordBreak: 'break-word',
              whiteSpace: 'normal'
            }}
          >
            {title}
          </Typography.Text>
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => openVideo(record.video_url)}
            style={{ padding: 0, height: 'auto', fontSize: '11px' }}
          >
            영상 열기
          </Button>
        </div>
      ),
    },
    {
      title: '업로드일',
      dataIndex: 'upload_date',
      key: 'upload_date',
      width: 65,
      render: (date) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: (
        <Space>
          조회수
          <Button
            type="text"
            size="small"
            icon={sortField === 'views' && sortOrder === 'descend' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
            onClick={() => handleSort('views')}
          />
        </Space>
      ),
      dataIndex: 'views',
      key: 'views',
      width: 70,
      render: (views) => views.toLocaleString(),
      sorter: (a, b) => a.views - b.views,
    },
    {
      title: (
        <Space>
          시간당 조회수
          <Button
            type="text"
            size="small"
            icon={sortField === 'views_per_hour' && sortOrder === 'descend' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
            onClick={() => handleSort('views_per_hour')}
          />
        </Space>
      ),
      dataIndex: 'views_per_hour',
      key: 'views_per_hour',
      width: 80,
      render: (viewsPerHour) => Math.round(viewsPerHour).toLocaleString(),
      sorter: (a, b) => a.views_per_hour - b.views_per_hour,
    },
    {
      title: (
        <Space>
          구독자수
          <Button
            type="text"
            size="small"
            icon={sortField === 'subscribers' && sortOrder === 'descend' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
            onClick={() => handleSort('subscribers')}
          />
        </Space>
      ),
      dataIndex: 'subscribers',
      key: 'subscribers',
      width: 80,
      render: (subscribers) => subscribers.toLocaleString(),
      sorter: (a, b) => a.subscribers - b.subscribers,
    },
    {
      title: '영상 길이',
      dataIndex: 'duration',
      key: 'duration',
      width: 40,
      render: (duration) => {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      },
    },
    {
      title: '구독자 대비 조회수',
      dataIndex: 'views_to_subscribers_ratio',
      key: 'views_to_subscribers_ratio',
      width: 80,
      render: (ratio) => {
        if (!ratio || ratio === 0) return 'N/A';
        return `${ratio.toFixed(2)}%`;
      },
      sorter: (a, b) => (a.views_to_subscribers_ratio || 0) - (b.views_to_subscribers_ratio || 0),
    },
    {
      title: '썸네일',
      dataIndex: 'thumbnail_url',
      key: 'thumbnail',
      width: 60,
      render: (url) => (
        <Image
          src={url}
          alt="thumbnail"
          style={{ width: 50, height: 28, objectFit: 'cover', cursor: 'pointer' }}
          preview={{
            mask: '크게 보기'
          }}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>결과를 불러오는 중...</p>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ 
          fontSize: '64px', 
          marginBottom: '20px',
          opacity: 0.6
        }}>
          📊
        </div>
        <Title level={3} style={{ color: '#667eea', marginBottom: '16px' }}>
          분석 결과가 없습니다
        </Title>
        <p style={{ color: '#8c8c8c', fontSize: '16px', marginBottom: '24px' }}>
          먼저 분석을 실행해주세요.
        </p>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f5f7ff', 
          borderRadius: '8px',
          border: '1px solid #d6e4ff',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <p style={{ margin: 0, color: '#1890ff' }}>
            💡 <strong>팁:</strong> 분석 페이지에서 검색어나 채널을 입력하고 분석을 시작해보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* 검색 조건 표시 */}
      <Card title="검색 조건" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 8]}>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>실행 모드:</strong> 
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {analysisResult.settings?.analysis_mode === 'channel' ? '채널' :
                 analysisResult.settings?.analysis_mode === 'keyword' ? '키워드' : '둘 다'}
              </Tag>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>콘텐츠 타입:</strong>
              <Tag color="green" style={{ marginLeft: 8 }}>
                {analysisResult.settings?.content_type === 'shorts' ? '쇼츠' :
                 analysisResult.settings?.content_type === 'long_form' ? '롱폼' : '둘 다'}
              </Tag>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>분석 기간:</strong>
              <Tag color="orange" style={{ marginLeft: 8 }}>
                최근 {analysisResult.settings?.days_back || 7}일
              </Tag>
            </div>
          </Col>
          {analysisResult.settings?.search_terms && analysisResult.settings.search_terms.length > 0 && (
            <Col span={24}>
              <div style={{ marginBottom: 8 }}>
                <strong>검색어:</strong>
                <div style={{ marginTop: 4 }}>
                  {analysisResult.settings.search_terms.map((term, index) => (
                    <Tag key={index} color="purple" style={{ margin: '2px 4px 2px 0' }}>
                      {term}
                    </Tag>
                  ))}
                </div>
              </div>
            </Col>
          )}
          {analysisResult.settings?.channel_ids && analysisResult.settings.channel_ids.length > 0 && (
            <Col span={24}>
              <div style={{ marginBottom: 8 }}>
                <strong>채널 ID:</strong>
                <div style={{ marginTop: 4 }}>
                  {analysisResult.settings.channel_ids.map((channelId, index) => (
                    <Tag key={index} color="cyan" style={{ margin: '2px 4px 2px 0' }}>
                      {channelId}
                    </Tag>
                  ))}
                </div>
              </div>
            </Col>
          )}
          <Col span={24}>
            <div style={{ marginBottom: 8 }}>
              <strong>필터 조건:</strong>
              <div style={{ marginTop: 4 }}>
                <Tag color="red">최소 조회수: {analysisResult.settings?.min_views?.toLocaleString() || 0}</Tag>
                <Tag color="red">최소 시간당 조회수: {analysisResult.settings?.min_views_per_hour || 0}</Tag>
                {analysisResult.settings?.shorts_max_duration && (
                  <Tag color="red">쇼츠 기준: {analysisResult.settings.shorts_max_duration}초</Tag>
                )}
                <Tag color="red">지역: {analysisResult.settings?.region_code || 'KR'}</Tag>
                <Tag color="red">언어: {analysisResult.settings?.language || 'ko'}</Tag>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 결과 요약 */}
      <Card title="분석 결과 요약" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="총 영상 수"
              value={analysisResult.total_videos}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="총 채널 수"
              value={analysisResult.summary?.total_channels || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="쇼츠 수"
              value={analysisResult.summary?.shorts_count || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="평균 조회수"
              value={Math.round(analysisResult.summary?.avg_views || 0)}
              valueStyle={{ color: '#722ed1' }}
              formatter={(value) => value.toLocaleString()}
            />
          </Col>
        </Row>
      </Card>

      {/* 검색 및 정렬 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={12}>
            <Search
              placeholder="제목 또는 채널명으로 검색"
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="정렬 기준"
              value={sortField}
              onChange={setSortField}
              style={{ width: '100%' }}
            >
              <Option value="views">조회수</Option>
              <Option value="views_per_hour">시간당 조회수</Option>
              <Option value="subscribers">구독자수</Option>
              <Option value="views_to_subscribers_ratio">구독자 대비 조회수</Option>
              <Option value="upload_date">업로드일</Option>
              <Option value="duration">영상 길이</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportExcel}
              >
                엑셀 다운로드
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 결과 테이블 */}
      <Card title={`분석 결과 (${filteredData.length}개 영상)`} className="results-table">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="video_id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} / ${total}개 영상`,
          }}
          scroll={{ x: 1500 }}
          size="small"
          components={{
            body: {
              row: (props) => (
                <tr {...props} style={{ height: '80px' }} />
              ),
            },
          }}
        />
      </Card>
    </div>
  );
};

export default ResultsPage;
