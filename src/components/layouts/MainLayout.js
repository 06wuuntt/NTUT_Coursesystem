import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faGraduationCap, faBars, faTimes, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { ROUTES } from '../../constants/routes';
import SelectInput from '../forms/SelectInput';
import './MainLayout.css';

const MainLayout = ({ children, currentSemester, onSemesterChange, semesterOptions }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleSemesterChange = (e) => {
    onSemesterChange(e.target.value);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', margin: '0' }}>
      <div className="main-layout-container">
        <div className="main-layout-nav">
          <Link to="/" className="main-layout-title">
            <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: '5px' }} />北科課程系統
          </Link>
          <div style={{display: 'flex', flexDirection: 'row', order: 3}}>
            <div className="main-layout-semester-select">
              <SelectInput
                label="學期"
                name="semester"
                value={currentSemester}
                onChange={handleSemesterChange}
                options={semesterOptions}
                style={{ width: '100%', marginBottom: '0' }}
              />
            </div>
            {/* <button className="main-layout-darkmode-btn" onClick={toggleDarkMode} title="切換深色模式" style={{marginLeft: 12}}>
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
              </button> */}

            <button className="main-layout-hamburger" onClick={toggleMenu}>
              <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
            </button>
          </div>

          <nav className={`main-layout-nav-links ${isMenuOpen ? 'open' : ''}`}>
            {ROUTES.filter(route => !route.hideInNav).map(route => (
              <Link
                key={route.id}
                to={route.path}
                className="main-layout-link"
                onClick={() => setIsMenuOpen(false)}
              >
                {route.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="main-layout-content">
          {children}
        </div>
      </div>

      <footer className="main-layout-footer">
        <p style={{ color: '#464646', margin: '0', paddingBottom: '15px', borderBottom: '1px solid #dfdfdfff', fontSize: '16px' }}>常用連結</p>
        <div className="main-layout-footer-links">
          <a href="https://nportal.ntut.edu.tw/index.do?thetime=1761978968598" className="main-layout-footer-link" target='_blank' rel='noreferrer'>校園入口網站 <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginLeft: '6px', fontSize: '12px' }} /></a>
          <a href="https://www.ntut.edu.tw/" className="main-layout-footer-link" target='_blank' rel='noreferrer'>校園首頁 <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginLeft: '6px', fontSize: '12px' }} /></a>
          <a href="https://lib.ntut.edu.tw/mp.asp?mp=100" className="main-layout-footer-link" target='_blank' rel='noreferrer'>台北科技大學圖書館 <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginLeft: '6px', fontSize: '12px' }} /></a>
          <a href="https://oaa.ntut.edu.tw/p/412-1008-15509.php?Lang=zh-tw" className="main-layout-footer-link" target='_blank' rel='noreferrer'>微學程專區 <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginLeft: '6px', fontSize: '12px' }} /></a>
        </div>
        <p style={{ margin: '0', color: '#41809E' }}>北科課程系統 ｜ Copyright © 2025</p>
      </footer>
    </div>
  );
};

export default MainLayout;
