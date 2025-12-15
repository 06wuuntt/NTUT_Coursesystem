import React, { useState, useEffect } from 'react';
import MonthView from './MonthView';
import { fetchCalendarEvents } from '../../api/CourseService';
import './Calendar.css';

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

  // 獲取近期事件
  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allEvents
      .filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  return (
    <div className="calendar-container">
      {/* 移除原本的 h2 標題，整合到 header 中 */}

      {isLoading && <div className="calendar-loading">正在載入行事曆資料...</div>}
      {error && <div className="calendar-error">{error}</div>}

      {/* 只有在非載入中且無錯誤時才顯示日曆控制項和月曆 */}
      {!isLoading && !error && (
        <>
          <div className="calendar-header">
            <h3 className="calendar-title">{formattedTitle}</h3>
            <div className="calendar-button-group">
              <button
                className="calendar-button"
                onClick={goToPrevMonth}
              >
                ← 上個月
              </button>
              <button
                className="calendar-button"
                onClick={goToNextMonth}
              >
                下個月 →
              </button>
            </div>
          </div>

          <div className="calendar-main-content">
            {/* 月曆主要內容 */}
            <div className="calendar-section">
              <MonthView year={year} month={month} allEvents={allEvents} />
            </div>

            {/* 近期事項側邊欄 */}
            <div className="calendar-sidebar">
              <div className="calendar-sidebar-title">近期事項</div>
              <div className="calendar-sidebar-content">
                {getUpcomingEvents().length > 0 ? (
                  getUpcomingEvents().map((event, index) => {
                    const actualEnd = event.endDate ? new Date(event.endDate) : new Date(event.date);
                    actualEnd.setDate(actualEnd.getDate() - 1);
                    const actualEndStr = `${actualEnd.getFullYear()}-${String(actualEnd.getMonth() + 1).padStart(2, '0')}-${String(actualEnd.getDate()).padStart(2, '0')}`;
                    const isSingleDay = event.date === actualEndStr;

                    return (
                      <div
                        key={index}
                        className="calendar-upcoming-event"
                      >
                        <div className="calendar-event-desc" style={{ fontWeight: '600', marginBottom: '6px', color: '#334155' }}>{event.description}</div>
                        <div className="calendar-event-date">
                          {isSingleDay ? event.date : `${event.date} ~ ${actualEndStr}`}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="calendar-empty-state">暫無即將到來的行程</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Calendar;