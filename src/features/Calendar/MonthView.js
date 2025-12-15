import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import './MonthView.css';

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
    days.push(<div key={`prev-${i}`} className="month-view-day-cell month-view-other-month"></div>);
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
    let cellClass = 'month-view-day-cell';
    if (isWeekend) cellClass += ' month-view-weekend';
    // 注意：我們不再改變整個單元格的背景色來標示今天，而是改變數字的樣式

    days.push(
      <div
        key={fullDateStr}
        className={cellClass}
      >
        <div className={`month-view-date-num ${isToday ? 'month-view-today' : ''}`}>
          {date}
        </div>
        {dailyEvents.map((event, index) => {
          const title = `${event.description} (${event.location || '無地點'})`;
          if (event._kind === 'single') {
            return (
              <div
                key={index}
                className="month-view-event"
                title={title}
                onClick={() => handleEventClick(event)}
              >
                {event.description}
              </div>
            );
          }

          if (event._kind === 'start') {
            return (
              <div
                key={index}
                className="month-view-event month-view-event-start"
                title={title}
                onClick={() => handleEventClick(event)}
              >
                {event.description} (開始)
              </div>
            );
          }

          if (event._kind === 'end') {
            return (
              <div
                key={index}
                className="month-view-event month-view-event-end"
                title={title}
                onClick={() => handleEventClick(event)}
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

  // 3. 填補後置空白天數，補滿最後一週
  const totalCells = firstDayOfMonth + daysInMonth;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    days.push(<div key={`next-${i}`} className="month-view-day-cell month-view-other-month"></div>);
  }

  return (
    <div>
      <div className="month-view-grid">
        {DayNames.map(day => (
          <div key={day} className="month-view-day-header">
            {day}
          </div>
        ))}
        {days}
      </div>

      {/* 事件詳情模態視窗 */}
      {selectedEvent && (
        <div className="month-view-modal" onClick={closeModal}>
          <div className="month-view-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="month-view-modal-header">
              <h3 className="month-view-modal-title">{selectedEvent.description}</h3>
              <button
                className="month-view-close-button"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            <div className="month-view-modal-body">
              <div className="month-view-info-row">
                <div className="month-view-info-label">
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