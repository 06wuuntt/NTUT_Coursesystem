import React, { useState, useEffect } from 'react';
import MonthView from './MonthView'; 
import { fetchCalendarEvents } from '../../api/CourseService';

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    textAlign: 'center',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  button: {
    padding: '10px 15px',
    fontSize: '16px',
    cursor: 'pointer',
    border: '1px solid #ccc',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    minWidth: '100px',
  },
  title: {
    margin: '0',
    fontSize: '24px',
    color: '#333',
  },
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  // 新增狀態：儲存所有行事曆事件，載入中狀態和錯誤狀態
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 載入所有行事曆事件 ---
  useEffect(() => {
    async function loadEvents() {
        setIsLoading(true);
        setError(null);
        try {
            // *** 呼叫 API 獲取所有事件 ***
            const data = await fetchCalendarEvents();
            // ****************************
            setAllEvents(data);
        } catch (err) {
            console.error("載入行事曆事件失敗:", err);
            setError('載入校園行事曆失敗，請檢查 API 服務。');
        } finally {
            setIsLoading(false);
        }
    }
    loadEvents();
  }, []); // 僅在組件掛載時執行一次

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 格式化標題 (例如：2025 年 12 月)
  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const formattedTitle = `${year} 年 ${monthNames[month]}`;


  // 處理切換到上一個月
  const goToPrevMonth = () => {
    setCurrentDate(prevDate => {
      // 建立一個新的日期物件，將月份減 1
      const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
      return newDate;
    });
  };

  // 處理切換到下一個月
  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      // 建立一個新的日期物件，將月份加 1
      const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
      return newDate;
    });
  };

  return (
    <div style={styles.container}>
      <h2>校園行事曆</h2>
      
      {isLoading && <p style={{textAlign: 'center', color: '#007bff'}}>正在載入行事曆資料...</p>}
      {error && <p style={{textAlign: 'center', color: 'red'}}>⚠️ {error}</p>}
      
      {/* 只有在非載入中且無錯誤時才顯示日曆控制項和月曆 */}
      {!isLoading && !error && (
          <>
            <div style={styles.header}>
              <button style={styles.button} onClick={goToPrevMonth}>&lt; 上個月</button>
              <h3 style={styles.title}>{formattedTitle}</h3>
              <button style={styles.button} onClick={goToNextMonth}>下個月 &gt;</button>
            </div>

            {/* 將載入的事件數據傳遞給 MonthView */}
            <MonthView year={year} month={month} allEvents={allEvents} /> 
          </>
      )}
    </div>
  );
};

export default Calendar;