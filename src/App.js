import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 引入佈局和頁面組件
import MainLayout from './components/layouts/MainLayout';
import Home from './features/Home/Home';
import ClassSchedule from './features/ClassSchedule/ClassSchedule';
import ClassSimulation from './features/ClassSimulation/ClassSimulation';
import Calendar from './features/Calendar/Calendar';
import CourseStandards from './features/CourseStandards/CourseStandards';

// 引入路由常數 (雖然在這個檔案可以直接寫路徑，但這樣引入能確保路徑一致)
import { ROUTES } from './constants/routes';

function App() {
  // 將所有路由包裹在 MainLayout 內
  const PageWrapper = ({ element }) => <MainLayout>{element}</MainLayout>;

  return (
    <Router>
      <Routes>
        <Route
          path={ROUTES.find(r => r.id === 'home').path}
          element={<PageWrapper element={<Home />} />}
        />
        <Route
          path={ROUTES.find(r => r.id === 'class-schedule').path}
          element={<PageWrapper element={<ClassSchedule />} />}
        />
        <Route
          path={ROUTES.find(r => r.id === 'class-simulation').path}
          element={<PageWrapper element={<ClassSimulation />} />}
        />
        <Route
          path={ROUTES.find(r => r.id === 'calendar').path}
          element={<PageWrapper element={<Calendar />} />}
        />
        <Route
          path={ROUTES.find(r => r.id === 'standards').path}
          element={<PageWrapper element={<CourseStandards />} />}
        />
        {/* 404 處理 */}
        <Route
          path="*"
          element={<PageWrapper element={<h2>404 找不到頁面</h2>} />}
        />
      </Routes>
    </Router>
  );
}

export default App;