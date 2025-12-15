import React, { useState, useEffect } from 'react';
import MonthView from './MonthView';
import { fetchCalendarEvents } from '../../api/CourseService';

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '24px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #F1F5F9',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '0 8px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    padding: '8px 16px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  title: {
    margin: '0',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: '-0.025em',
  },
  loading: {
    textAlign: 'center',
    color: '#3B82F6',
    padding: '40px',
    fontSize: '1.1rem',
  },
  error: {
    textAlign: 'center',
    color: '#EF4444',
    padding: '20px',
    backgroundColor: '#FEF2F2',
    borderRadius: '8px',
    margin: '20px 0',
  },
  mainContent: {
    position: 'relative',
  },
  calendarSection: {
    marginRight: '344px',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '320px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  sidebarTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #E2E8F0',
    flexShrink: 0,
  },
  sidebarContent: {
    flex: '1',
    overflowY: 'auto',
  },
  upcomingEvent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
    border: '1px solid #E2E8F0',
    transition: 'all 0.2s',
  },
  eventTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px',
  },
  eventDate: {
    fontSize: '0.85rem',
    color: '#64748B',
  },
  noEvents: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '0.9rem',
    padding: '20px',
    fontStyle: 'italic',
  }
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
    <div style={styles.container}>
      {/* 移除原本的 h2 標題，整合到 header 中 */}

      {isLoading && <div style={styles.loading}>正在載入行事曆資料...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {/* 只有在非載入中且無錯誤時才顯示日曆控制項和月曆 */}
      {!isLoading && !error && (
        <>
          <div style={styles.header}>
            <h3 style={styles.title}>{formattedTitle}</h3>
            <div style={styles.buttonGroup}>
              <button
                style={styles.button}
                onClick={goToPrevMonth}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                ← 上個月
              </button>
              <button
                style={styles.button}
                onClick={goToNextMonth}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                下個月 →
              </button>
            </div>
          </div>

          <div style={styles.mainContent}>
            {/* 月曆主要內容 */}
            <div style={styles.calendarSection}>
              <MonthView year={year} month={month} allEvents={allEvents} />
            </div>

            {/* 近期事項側邊欄 */}
            <div style={styles.sidebar}>
              <div style={styles.sidebarTitle}>近期事項</div>
              <div style={styles.sidebarContent}>
                {getUpcomingEvents().length > 0 ? (
                  getUpcomingEvents().map((event, index) => {
                    const actualEnd = event.endDate ? new Date(event.endDate) : new Date(event.date);
                    actualEnd.setDate(actualEnd.getDate() - 1);
                    const actualEndStr = `${actualEnd.getFullYear()}-${String(actualEnd.getMonth() + 1).padStart(2, '0')}-${String(actualEnd.getDate()).padStart(2, '0')}`;
                    const isSingleDay = event.date === actualEndStr;

                    return (
                      <div
                        key={index}
                        style={styles.upcomingEvent}
                      >
                        <div style={styles.eventTitle}>{event.description}</div>
                        <div style={styles.eventDate}>
                          {isSingleDay ? event.date : `${event.date} ~ ${actualEndStr}`}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={styles.noEvents}>暫無即將到來的行程</div>
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