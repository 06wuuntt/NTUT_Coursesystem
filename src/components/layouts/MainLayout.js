import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import SelectInput from '../forms/SelectInput'; // 引入 SelectInput
import { MOCK_SEMESTERS } from '../../constants/mockData'; // 引入學期資料

// 簡單的 CSS 樣式
const styles = {
  navContainer: {
    backgroundColor: '#333',
    padding: '10px 20px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between', // 讓內容分散
    alignItems: 'center',
  },
  navLinks: {
    display: 'flex',
    flex: 1, // 佔據剩餘空間
    justifyContent: 'center',
  },
  link: {
    color: 'white',
    margin: '0 15px',
    textDecoration: 'none',
    fontSize: '18px',
  },
  semesterSelect: {
    width: '180px',
  },
  content: {
    padding: '20px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#0056b3',
  }
};

/**
 * 主要佈局組件：包含導覽列、學期選擇和內容區
 * * @param {Array} semesterOptions - 所有的學期選項 (從 API 動態載入)
 */
const MainLayout = ({ children, currentSemester, onSemesterChange, semesterOptions }) => {
  const handleSemesterChange = (e) => {
    onSemesterChange(e.target.value);
  };

  // 找到當前選定學期的完整標籤 (用於標題顯示)
  const currentSemesterLabel = semesterOptions.find(s => s.value === currentSemester)?.label || '未選定學期';

  return (
    <div>
      {/* 導覽列容器 */}
      <div style={styles.navContainer}>
        {/* 學期選擇器 (放在最左邊) */}
        <div style={styles.semesterSelect}>
          {/* Note: SelectInput 的樣式是內建於該組件內的 */}
          <SelectInput
            name="semester"
            value={currentSemester}
            onChange={handleSemesterChange}
            options={semesterOptions}
            // 為了在 nav 內更緊湊，我們可以傳遞一些內聯樣式覆蓋，但在這裡我們主要調整容器
            // 將 label 隱藏，讓它看起來更像導覽列的一部分
            style={{ width: '100%', marginBottom: '0' }}
          />
        </div>

        {/* 導覽連結 (放在中間) */}
        <nav style={styles.navLinks}>
          {ROUTES.map(route => (
            <Link key={route.id} to={route.path} style={styles.link}>
              {route.name}
            </Link>
          ))}
        </nav>
        {/* 右邊留白，讓中間連結置中 */}
        <div style={styles.semesterSelect}></div>
      </div>

      <div style={styles.content}>
        <h1 style={styles.title}>課程系統網頁</h1>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;