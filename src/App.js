import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// 引入佈局和頁面組件
import MainLayout from './components/layouts/MainLayout';
import Home from './features/Home/Home';
import ClassSchedule from './features/ClassSchedule/ClassSchedule';
import ClassSimulation from './features/ClassSimulation/ClassSimulation';
import Calendar from './features/Calendar/Calendar';
import CourseStandards from './features/CourseStandards/CourseStandards';
import CourseDetail from './features/CourseDetail/CourseDetail';

import { ROUTES } from './constants/routes';
import { fetchSemesters } from './api/CourseService'
import Loader from './components/ui/Loader';
import { useToast } from './components/ui/Toast';

// 將所有路由包裹在 MainLayout 內
const PageWrapper = ({ element, currentSemester, setCurrentSemester, semesterOptions }) => {
  // Don't forward `semesterOptions` or `currentSemester` onto plain DOM elements.
  // If `element` is a React component (function/class), clone it and inject props.
  // If it's a DOM element (e.g. <h2>...), render it as-is.
  let child = element;
  if (React.isValidElement(element) && typeof element.type !== 'string') {
    child = React.cloneElement(element, { currentSemester, semesterOptions });
  }

  return (
    <MainLayout
      currentSemester={currentSemester}
      onSemesterChange={setCurrentSemester}
      semesterOptions={semesterOptions}
    >
      {child}
    </MainLayout>
  );
};

function App() {
  const [currentSemester, setCurrentSemester] = useState(null);
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [loadingSemesters, setLoadingSemesters] = useState(true);
  const { addToast } = useToast();

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
        addToast('無法載入學期資料，請檢查網路連線或 API 狀態。', 'error');
        setSemesterOptions([{ value: 'error', label: '載入失敗' }]);
      } finally {
        setLoadingSemesters(false);
      }
    }
    loadSemesters();
  }, [addToast]);

  // 如果學期資料正在載入，顯示載入畫面
  if (loadingSemesters || !currentSemester) {
    return <Loader />;
  }

  return (
    <Router>
      <Routes>
        <Route path={ROUTES.find(r => r.id === 'home').path} element={<PageWrapper element={<Home />} currentSemester={currentSemester} setCurrentSemester={setCurrentSemester} semesterOptions={semesterOptions} />} />
        <Route path={ROUTES.find(r => r.id === 'class-schedule').path} element={<PageWrapper element={<ClassSchedule />} currentSemester={currentSemester} setCurrentSemester={setCurrentSemester} semesterOptions={semesterOptions} />} />
        <Route path={ROUTES.find(r => r.id === 'class-simulation').path} element={<PageWrapper element={<ClassSimulation />} currentSemester={currentSemester} setCurrentSemester={setCurrentSemester} semesterOptions={semesterOptions} />} />
        <Route path={ROUTES.find(r => r.id === 'calendar').path} element={<PageWrapper element={<Calendar />} currentSemester={currentSemester} setCurrentSemester={setCurrentSemester} semesterOptions={semesterOptions} />} />
        <Route path={ROUTES.find(r => r.id === 'standards').path} element={<PageWrapper element={<CourseStandards />} currentSemester={currentSemester} setCurrentSemester={setCurrentSemester} semesterOptions={semesterOptions} />} />
        <Route path={ROUTES.find(r => r.id === 'course-detail').path} element={<PageWrapper element={<CourseDetail />} currentSemester={currentSemester} setCurrentSemester={setCurrentSemester} semesterOptions={semesterOptions} />} />
        <Route path="*" element={<PageWrapper element={<h2>404 找不到頁面</h2>} currentSemester={currentSemester} setCurrentSemester={setCurrentSemester} semesterOptions={semesterOptions} />} />
      </Routes>
    </Router>
  );
}

export default App;
