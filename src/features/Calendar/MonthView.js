import React from 'react';

// 為了讓行事曆有內容，我們使用模擬事件
// Note: 實際開發時，事件應根據當前 year/month 透過 API 獲取
const MOCK_EVENTS = [
  { date: '2025-11-01', description: '校慶補假日' },
  { date: '2025-11-25', description: '期中考試週開始' },
  { date: '2025-12-05', description: '課程加退選截止' },
  { date: '2025-12-25', description: '聖誕節' },
  { date: '2026-01-10', description: '學期結束' },
];

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderTop: '1px solid #ccc',
    borderLeft: '1px solid #ccc',
  },
  dayHeader: {
    backgroundColor: '#eee',
    padding: '10px 5px',
    borderRight: '1px solid #ccc',
    borderBottom: '1px solid #ccc',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dayCell: {
    minHeight: '100px',
    padding: '5px',
    borderRight: '1px solid #ccc',
    borderBottom: '1px solid #ccc',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  dateNum: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  event: {
    fontSize: '12px',
    backgroundColor: '#e6f7ff',
    color: '#0056b3',
    padding: '2px 4px',
    borderRadius: '3px',
    marginTop: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  weekend: {
    backgroundColor: '#fefefe', // 週末顏色略有不同
  },
  today: {
    backgroundColor: '#ffffdd', // 標示今天
    border: '2px solid #ffcc00',
  },
  otherMonth: {
    backgroundColor: '#f5f5f5', // 非本月日期
    color: '#aaa',
  }
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

  // 輔助函數：檢查指定日期 (YYYY-MM-DD) 是否在某事件的時間範圍內
  const isDateInRange = (dateStr, startStr, endStr) => {
    // 由於 API 的 end 日期是獨佔的 (例如 6/1 結束，表示事件發生在 5/31 或之前)
    // 這裡需要調整：API 返回的 end 日期實際上是事件發生範圍的 "次日"
    // 為了安全起見，我們先將 API 日期轉為 Date 物件進行比較
    const date = new Date(dateStr);
    const start = new Date(startStr);
    const end = new Date(endStr);

    // 將 end 日期減一天，使其包含在範圍內
    const actualEnd = new Date(end);
    actualEnd.setDate(actualEnd.getDate() - 1);

    return date >= start && date <= actualEnd;
  };

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
    allEvents.forEach(event => {
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
    let cellStyle = styles.dayCell;
    if (isWeekend) cellStyle = { ...cellStyle, ...styles.weekend };
    if (isToday) cellStyle = { ...cellStyle, ...styles.today };

    days.push(
      <div
        key={fullDateStr}
        style={cellStyle}
      >
        <div style={styles.dateNum}>{date}</div>
        {dailyEvents.map((event, index) => {
          const title = `${event.description} (${event.location || '無地點'})`;
          if (event._kind === 'single') {
            return (
              <div key={index} style={styles.event} title={title}>
                {event.description}
              </div>
            );
          }

          if (event._kind === 'start') {
            return (
              <div key={index} style={{ ...styles.event, fontWeight: 'bold', backgroundColor: '#dff0d8' }} title={title}>
                {event.description} — 開始 ({event._days} 天)
              </div>
            );
          }

          if (event._kind === 'end') {
            return (
              <div key={index} style={{ ...styles.event, fontStyle: 'italic', backgroundColor: '#f2dede' }} title={title}>
                {event.description} — 結束 ({event._days} 天)
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
    </div>
  );
};

export default MonthView;