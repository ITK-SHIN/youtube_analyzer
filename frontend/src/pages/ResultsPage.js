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
      message.error('결과를 불러오는데 실패했습니다.');
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
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: '썸네일',
      dataIndex: 'thumbnail_url',
      key: 'thumbnail',
      width: 120,
      render: (url) => (
        <Image
          src={url}
          alt="thumbnail"
          style={{ width: 80, height: 45, objectFit: 'cover', cursor: 'pointer' }}
          preview={{
            mask: '크게 보기'
          }}
        />
      ),
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title, record) => (
        <div>
          <Typography.Text 
            ellipsis={{ tooltip: title }}
            style={{ display: 'block', marginBottom: 4 }}
          >
            {title}
          </Typography.Text>
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => openVideo(record.video_url)}
          >
            영상 열기
          </Button>
        </div>
      ),
    },
    {
      title: '채널명',
      dataIndex: 'channel_name',
      key: 'channel_name',
      ellipsis: true,
    },
    {
      title: '업로드일',
      dataIndex: 'upload_date',
      key: 'upload_date',
      width: 120,
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
      width: 100,
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
      width: 120,
      render: (viewsPerHour) => Math.round(viewsPerHour).toLocaleString(),
      sorter: (a, b) => a.views_per_hour - b.views_per_hour,
    },
    {
      title: '구독자수',
      dataIndex: 'subscribers',
      key: 'subscribers',
      width: 100,
      render: (subscribers) => subscribers.toLocaleString(),
    },
    {
      title: '조회수/구독자수',
      dataIndex: 'views_to_subscribers_ratio',
      key: 'views_to_subscribers_ratio',
      width: 120,
      render: (ratio) => ratio.toFixed(2),
    },
    {
      title: '영상 길이',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration) => {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      },
    },
    {
      title: '타입',
      dataIndex: 'is_shorts',
      key: 'is_shorts',
      width: 80,
      render: (isShorts) => (
        <Tag color={isShorts ? 'blue' : 'green'}>
          {isShorts ? '쇼츠' : '롱폼'}
        </Tag>
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
        <Title level={3}>분석 결과가 없습니다</Title>
        <p>먼저 분석을 실행해주세요.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
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
              <Option value="upload_date">업로드일</Option>
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
        />
      </Card>
    </div>
  );
};

export default ResultsPage;
