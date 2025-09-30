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
      padding: '0 24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          YouTube Analyzer
        </Title>
        <span style={{ marginLeft: 8, color: '#666', fontSize: '14px' }}>
          유튜브 분석 프로그램
        </span>
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
