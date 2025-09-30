import React from 'react';
import { Layout, Menu, Button, Space, Typography } from 'antd';
import { 
  BarChartOutlined, 
  SettingOutlined, 
  FileTextOutlined,
  GithubOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <BarChartOutlined />,
      label: '분석',
    },
    {
      key: '/results',
      icon: <FileTextOutlined />,
      label: '결과',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '설정',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <AntHeader style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      padding: '0 24px',
      height: 'auto',
      lineHeight: 'normal',
      minHeight: '80px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            fontSize: '32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            📊
          </div>
          <div style={{ paddingTop: '4px' }}>
            <Title level={3} style={{ 
              margin: 0,
              marginBottom: '4px',
              lineHeight: '1.2',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              YouTube Analyzer
            </Title>
            <div style={{ 
              fontSize: '12px', 
              color: '#8c8c8c',
              lineHeight: '1.2'
            }}>
              유튜브 데이터 분석 플랫폼
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ 
            border: 'none',
            background: 'transparent',
            minWidth: '300px'
          }}
        />
        
        <Space style={{ marginLeft: '24px' }}>
          <Button 
            type="text" 
            icon={<GithubOutlined />}
            href="https://github.com"
            target="_blank"
          >
            GitHub
          </Button>
        </Space>
      </div>
    </AntHeader>
  );
};

export default Header;
