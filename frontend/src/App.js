import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import 'antd/dist/reset.css';

import Header from './components/Header';
import AnalysisPage from './pages/AnalysisPage';
import SettingsPage from './pages/SettingsPage';
import ResultsPage from './pages/ResultsPage';

const { Content } = Layout;

function App() {
  return (
    <ConfigProvider locale={koKR}>
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Header />
          <Content>
            <Routes>
              <Route path="/" element={<AnalysisPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/results" element={<ResultsPage />} />
            </Routes>
          </Content>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
