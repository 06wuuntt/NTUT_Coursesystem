import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { ROUTES } from '../../constants/routes';
import SelectInput from '../forms/SelectInput'; // 引入 SelectInput
// import { MOCK_SEMESTERS } from '../../constants/mockData'; // 引入學期資料

// 簡單的 CSS 樣式
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    margin: '0',
    padding: '20px',

  },
  navContainer: {
    backgroundColor: '#FFFFFF',
    maxWidth: '1fr',
    padding: '20px 40px',
    margin: '10px 0px 70px 0px',
    display: 'flex',
    justifyContent: 'space-between', // 讓內容分散
    gap: '18px',
    alignItems: 'center',
    borderRadius: '20px',
    boxShadow: '8px 8px 30px #e9e9e9ff'
  },
  title: {
    fontSize: '25px',
    fontWeight: '700',
    color: '#464646',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
  },
  link: {
    color: '#797979ff',
    fontWeight: '500',
    margin: '0 6px',
    textDecoration: 'none',
    fontSize: '18px',
    padding: '8px 12px',
    borderRadius: '12px',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  linkHover: {
    backgroundColor: '#F6F7F8',
    color: '#336F8B',
  },
  semesterSelect: {
    width: '180px',
  },
  content: {
    padding: '0 20px',
    flex: '1',
  },
  footer: {
    backgroundColor: '#ffffff',
    // borderTop: '1px solid #e6e6e6',
    padding: '20px 90px',
    marginTop: '40px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    margin: '15px 0 30px',
  },
  footerLink: {
    backgroundColor: '#f8f6f6ff',
    color: '#41809E',
    padding: '10px 20px',
    textDecoration: 'none',
    borderRadius: '25px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'boxShadow 0.3s ease',
    cursor: 'pointer',
    display: 'inline-block'
  }
  // title: {
  //   textAlign: 'center',
  //   marginBottom: '30px',
  //   color: '#0056b3',
  // }
};

/**
 * 主要佈局組件：包含導覽列、學期選擇和內容區
 * * @param {Array} semesterOptions - 所有的學期選項 (從 API 動態載入)
 */
const MainLayout = ({ children, currentSemester, onSemesterChange, semesterOptions }) => {
  const [hoveredLink, setHoveredLink] = React.useState(null);
  const handleSemesterChange = (e) => {
    onSemesterChange(e.target.value);
  };

  // 找到當前選定學期的完整標籤 (用於標題顯示)
  // const currentSemesterLabel = semesterOptions.find(s => s.value === currentSemester)?.label || '未選定學期';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', margin: '0' }}>
      <div style={styles.container}>
        {/* 導覽列容器 */}
        <div style={styles.navContainer}>
          {/* 左側標題容器（固定寬度，用來平衡右側選單，使中間連結置中） */}
          <Link to="/" style={styles.title}>
            <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: '10px' }} />北科課程系統
          </Link>
          <nav style={styles.navLinks}>
            {ROUTES.map(route => (
              <Link
                key={route.id}
                to={route.path}
                style={{
                  ...styles.link,
                  ...(hoveredLink === route.id ? styles.linkHover : {})
                }}
                onMouseEnter={() => setHoveredLink(route.id)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {route.name}
              </Link>
            ))}
          </nav>
          {/* 右邊留白，讓中間連結置中 */}

          {/* 學期選擇器 (放在最左邊) */}
          <div style={styles.semesterSelect}>
            {/* Note: SelectInput 的樣式是內建於該組件內的 */}
            <SelectInput
              label="學期"
              name="semester"
              value={currentSemester}
              onChange={handleSemesterChange}
              options={semesterOptions}
              // 為了在 nav 內更緊湊，我們可以傳遞一些內聯樣式覆蓋，但在這裡我們主要調整容器
              // 將 label 隱藏，讓它看起來更像導覽列的一部分
              style={{ width: '100%', marginBottom: '0' }}
            />
          </div>
        </div>

        <div style={styles.content}>
          {/* <h1 style={styles.title}>課程系統網頁</h1> */}
          {children}
        </div>
      </div>

      <footer style={styles.footer}>
        <p style={{ color: '#464646', margin: '0', paddingBottom: '15px', borderBottom: '1px solid #dfdfdfff', fontSize: '16px' }}>常用連結</p>
        {/* <hr  style={{color: '#B4B4B4'}}/> */}
        <div style={styles.footerLinks}>
          <a href="https://nportal.ntut.edu.tw/index.do?thetime=1761978968598" style={styles.footerLink} target='_blank' rel='noreferrer'>校園入口網站 <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginLeft: '6px', fontSize: '12px' }} /></a>
          <a href="https://www.ntut.edu.tw/" style={styles.footerLink} target='_blank' rel='noreferrer'>校園首頁 <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginLeft: '6px', fontSize: '12px' }} /></a>
          <a href="https://lib.ntut.edu.tw/mp.asp?mp=100" style={styles.footerLink} target='_blank' rel='noreferrer'>台北科技大學圖書館 <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginLeft: '6px', fontSize: '12px' }} /></a>
          <a href="https://oaa.ntut.edu.tw/p/412-1008-15509.php?Lang=zh-tw" style={styles.footerLink} target='_blank' rel='noreferrer'>微學程專區 <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginLeft: '6px', fontSize: '12px' }} /></a>
        </div>
        <p style={{ margin: '0', color: '#41809E' }}>北科課程系統 ｜ Copyright © 2025</p>
      </footer>
    </div>
  );
};

export default MainLayout;