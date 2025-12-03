import React, { useEffect, useState } from 'react'; // 引入 useState
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 引入佈局和頁面組件
import MainLayout from './components/layouts/MainLayout';
// ... [保留其他頁面引入] ...
import Home from './features/Home/Home';
import ClassSchedule from './features/ClassSchedule/ClassSchedule';
import ClassSimulation from './features/ClassSimulation/ClassSimulation';
import Calendar from './features/Calendar/Calendar';
import CourseStandards from './features/CourseStandards/CourseStandards';

import { ROUTES } from './constants/routes';
import { MOCK_SEMESTERS } from './constants/mockData'; // 使用模擬學期清單作為預設來源
import { fetchSemesters } from './api/CourseService'

function App() {
  const [currentSemester, setCurrentSemester] = useState(null);
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [loadingSemesters, setLoadingSemesters] = useState(true);

  // --- 獲取學期資料 ---
  useEffect(() => {
    async function loadSemesters() {
      try {
        const options = await fetchSemesters();
        setSemesterOptions(options);

        if (options.length > 0) {
          setCurrentSemester(options[0].value);
        }
      } catch (error) {
        console.error("載入學期資料失敗:", error);
        alert('無法載入學期資料，請檢查網路連線或 API 狀態。');
        setSemesterOptions([{ value: 'error', label: '載入失敗' }]);
      } finally {
        setLoadingSemesters(false);
      }
    }
    loadSemesters();
  }, []);

  // 如果學期資料正在載入，顯示載入畫面
  if (loadingSemesters || !currentSemester) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontSize: '20px' }}>
        <h1>課程系統載入中...</h1>
        <p>正在從 API 獲取學期資料，請稍候。</p>
      </div>
    );
  }

  // 將所有路由包裹在 MainLayout 內
  const PageWrapper = ({ element }) => (
    <MainLayout
      currentSemester={currentSemester}
      onSemesterChange={setCurrentSemester}
      semesterOptions={semesterOptions}
    >
      {/* 頁面組件本身也需要接收學期值，用於數據獲取 */}
      {React.cloneElement(element, { currentSemester, semesterOptions })}
    </MainLayout>
  );

  return (
    <Router>
      <Routes>
        <Route path={ROUTES.find(r => r.id === 'home').path} element={<PageWrapper element={<Home />} />} />
        <Route path={ROUTES.find(r => r.id === 'class-schedule').path} element={<PageWrapper element={<ClassSchedule />} />} />
        <Route path={ROUTES.find(r => r.id === 'class-simulation').path} element={<PageWrapper element={<ClassSimulation />} />} />
        <Route path={ROUTES.find(r => r.id === 'calendar').path} element={<PageWrapper element={<Calendar />} />} />
        <Route path={ROUTES.find(r => r.id === 'standards').path} element={<PageWrapper element={<CourseStandards />} />} />
        <Route path="*" element={<PageWrapper element={<h2>404 找不到頁面</h2>} />} />
      </Routes>
    </Router>
  );
}

export default App;