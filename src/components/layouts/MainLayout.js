import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

// 簡單的 CSS 樣式（在實際專案中，您會使用 CSS 檔案或 CSS-in-JS）
const styles = {
  nav: {
    backgroundColor: '#333',
    padding: '10px 20px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  link: {
    color: 'white',
    margin: '0 15px',
    textDecoration: 'none',
    fontSize: '18px',
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
 * 主要佈局組件：包含導覽列和內容區
 * @param {object} props - 包含要顯示的子組件 (內容頁面)
 */
const MainLayout = ({ children }) => {
  return (
    <div>
      {/* 導覽列 */}
      <nav style={styles.nav}>
        {ROUTES.map(route => (
          <Link key={route.id} to={route.path} style={styles.link}>
            {route.name}
          </Link>
        ))}
      </nav>

      <div style={styles.content}>
        <h1 style={styles.title}>課程系統網頁</h1>
        {/* 頁面內容將顯示在這裡 */}
        {children}
      </div>
    </div>
  );
};

export default MainLayout;