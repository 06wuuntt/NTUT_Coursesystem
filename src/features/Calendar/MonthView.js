import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', // Force equal width
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  dayHeader: {
    backgroundColor: '#F8FAFC',
    padding: '16px 8px',
    borderBottom: '1px solid #E2E8F0',
    borderRight: '1px solid #E2E8F0', // Add vertical dividers
    color: '#64748B',
    fontWeight: '600',
    fontSize: '0.9rem',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  dayCell: {
    minHeight: '120px',
    padding: '8px',
    borderBottom: '1px solid #E2E8F0',
    borderRight: '1px solid #E2E8F0', // Add vertical dividers
    backgroundColor: '#FFFFFF',
    position: 'relative',
    transition: 'background-color 0.2s',
  },
  dateNum: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '8px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
  },
  event: {
    fontSize: '0.8rem',
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    padding: '4px 8px',
    borderRadius: '4px',
    marginBottom: '4px',
    borderLeft: '3px solid #3B82F6',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  weekend: {
    backgroundColor: '#FAFAFA',
  },
  today: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
  },
  otherMonth: {
    backgroundColor: '#F8FAFC',
    color: '#CBD5E1',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid #E2E8F0',
  },
  modalTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1E293B',
    margin: 0,
    flex: 1,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#64748B',
    padding: '0 4px',
    marginLeft: '12px',
    transition: 'color 0.2s',
  },
  modalBody: {
    color: '#475569',
  },
  infoRow: {
    marginBottom: '16px',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#334155',
    marginBottom: '4px',
    fontSize: '0.9rem',
  },
  infoValue: {
    color: '#64748B',
    fontSize: '0.95rem',
    lineHeight: '1.6',
  },
};

const DayNames = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * 計算並呈現指定月份的月曆
 * @param {number} year - 年份
 * @param {number} month - 月份 (0-11)
 * @param {Array<object>} allEvents - 所有行事曆事件
 */
const MonthView = ({ year, month, allEvents }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = [];
  const today = new Date();

  // 模態視窗狀態
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 調試：顯示當前月份的事件數量
  console.log(`MonthView rendering ${year}-${month + 1}, total events: ${allEvents?.length || 0}`);

  // 篩選當前月份的事件用於調試
  const currentMonthEvents = allEvents?.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  }) || [];
  console.log(`Events in ${year}-${month + 1}:`, currentMonthEvents);

  // 格式化 Date 為 YYYY-MM-DD
  const fmt = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // 計算包含的實際結束日 (endStr 是 API 的獨佔結束日期)
  const actualEndDate = (endStr) => {
    if (!endStr) return null;
    const end = new Date(endStr);
    end.setDate(end.getDate() - 1);
    return end;
  }

  // 計算兩個日期相差的天數（包含首尾）
  const spanDays = (startStr, endStr) => {
    const s = new Date(startStr);
    const e = actualEndDate(endStr) || new Date(startStr);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  }

  // 格式化日期為易讀格式
  const formatDateDisplay = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  }

  // 處理事件點擊
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  }

  // 關閉模態視窗
  const closeModal = () => {
    setSelectedEvent(null);
  }

  // 1. 填補前置空白天數
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`prev-${i}`} style={{ ...styles.dayCell, ...styles.otherMonth }}></div>);
  }

  // 2. 填入本月日期
  for (let date = 1; date <= daysInMonth; date++) {
    // 構造當前日期的 YYYY-MM-DD 格式
    const fullDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

    // 篩選當天要顯示的事件：
    // - 單日事件：當日顯示
    // - 跨日事件：只在開始日與實際結束日顯示標記（若開始或結束在此月份）
    const dailyEvents = [];
    (allEvents || []).forEach(event => {
      const start = new Date(event.date);
      const endAct = actualEndDate(event.endDate) || new Date(event.date);
      const startStr = fmt(start);
      const endStr = fmt(endAct);

      if (startStr === fullDateStr && endStr === fullDateStr) {
        // 單日事件
        dailyEvents.push({ ...event, _kind: 'single' });
      } else if (startStr === fullDateStr) {
        // 跨日事件的開始日（顯示開始標記與天數）
        dailyEvents.push({ ...event, _kind: 'start', _days: spanDays(event.date, event.endDate) });
      } else if (endStr === fullDateStr) {
        // 跨日事件的結束日（顯示結束標記與天數）
        dailyEvents.push({ ...event, _kind: 'end', _days: spanDays(event.date, event.endDate) });
      }
      // 中間跨越的日期不會加入 dailyEvents，因此不會在中間單元格顯示
    });

    // 判斷是否為今天
    const isToday = today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === date;

    // 判斷是否為週末
    const dayOfWeek = new Date(year, month, date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 組合樣式
    let cellStyle = { ...styles.dayCell };
    if (isWeekend) cellStyle = { ...cellStyle, ...styles.weekend };
    // 注意：我們不再改變整個單元格的背景色來標示今天，而是改變數字的樣式

    days.push(
      <div
        key={fullDateStr}
        style={cellStyle}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isWeekend ? '#FAFAFA' : '#FFFFFF'}
      >
        <div style={{
          ...styles.dateNum,
          ...(isToday ? styles.today : {})
        }}>
          {date}
        </div>
        {dailyEvents.map((event, index) => {
          const title = `${event.description} (${event.location || '無地點'})`;
          if (event._kind === 'single') {
            return (
              <div
                key={index}
                style={styles.event}
                title={title}
                onClick={() => handleEventClick(event)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                {event.description}
              </div>
            );
          }

          if (event._kind === 'start') {
            return (
              <div
                key={index}
                style={{ ...styles.event, backgroundColor: '#DCFCE7', color: '#166534', borderLeftColor: '#22C55E' }}
                title={title}
                onClick={() => handleEventClick(event)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                {event.description} (開始)
              </div>
            );
          }

          if (event._kind === 'end') {
            return (
              <div
                key={index}
                style={{ ...styles.event, backgroundColor: '#FEE2E2', color: '#991B1B', borderLeftColor: '#EF4444' }}
                title={title}
                onClick={() => handleEventClick(event)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                {event.description} (結束)
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  }

  return (
    <div>
      <div style={styles.grid}>
        {DayNames.map(day => (
          <div key={day} style={styles.dayHeader}>
            {day}
          </div>
        ))}
        {days}
      </div>

      {/* 事件詳情模態視窗 */}
      {selectedEvent && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{selectedEvent.description}</h3>
              <button
                style={styles.closeButton}
                onClick={closeModal}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1E293B'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>
                  <FontAwesomeIcon icon={faCalendarDays} style={{ marginRight: '6px' }} />
                  時間：
                  {(() => {
                    // 計算實際結束日期（API 的 endDate 是獨佔的）
                    const actualEnd = actualEndDate(selectedEvent.endDate);
                    const actualEndStr = actualEnd ? fmt(actualEnd) : selectedEvent.date;
                    const isSingleDay = selectedEvent.date === actualEndStr;

                    return isSingleDay ? selectedEvent.date : `${selectedEvent.date} ~ ${actualEndStr}`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthView;