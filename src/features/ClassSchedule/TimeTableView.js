import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PERIODS } from '../../constants/periods';
import './TimeTableView.css';

const TimeTableView = ({ courses, currentSemester }) => {
    const navigate = useNavigate();

    // 星期一到星期六的標籤
    const dayLabels = ['一', '二', '三', '四', '五', '六'];

    // 構建課程網格數據 - grid[day_period] = [courses]（支持多個課程衝突）
    const grid = {};
    courses.forEach(course => {
        course.time?.forEach(t => {
            const raw = String(t.period);
            if (raw.includes('-')) {
                const [startLabel, endLabel] = raw.split('-');
                const periodIds = PERIODS.map(p => String(p.id));
                const startIdx = periodIds.indexOf(String(startLabel));
                const endIdx = periodIds.indexOf(String(endLabel));
                if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
                    for (let i = startIdx; i <= endIdx; i++) {
                        const pid = periodIds[i];
                        const key = `${t.day}_${pid}`;
                        if (!grid[key]) grid[key] = [];
                        grid[key].push(course);
                    }
                }
            } else {
                const key = `${t.day}_${raw}`;
                if (!grid[key]) grid[key] = [];
                grid[key].push(course);
            }
        });
    });

    // Pre-calculate spans for merging consecutive cells
    const cellConfig = {};
    [1, 2, 3, 4, 5, 6].forEach(day => {
        for (let i = 0; i < PERIODS.length; i++) {
            const period = PERIODS[i];
            const key = `${day}_${period.id}`;

            if (cellConfig[key]?.skip) continue;

            const coursesInCell = grid[key] || [];
            if (coursesInCell.length === 1) {
                const courseId = coursesInCell[0].id;
                let span = 1;

                // Look ahead for same course
                for (let j = i + 1; j < PERIODS.length; j++) {
                    const nextPeriod = PERIODS[j];
                    const nextKey = `${day}_${nextPeriod.id}`;
                    const nextCourses = grid[nextKey] || [];

                    if (nextCourses.length === 1 && nextCourses[0].id === courseId) {
                        span++;
                        cellConfig[nextKey] = { skip: true };
                    } else {
                        break;
                    }
                }
                cellConfig[key] = { span, skip: false };
            } else {
                cellConfig[key] = { span: 1, skip: false };
            }
        }
    });

    const [hoveredCell, setHoveredCell] = React.useState(null);

    return (
        <div className="time-table-container">
            <div className="time-table-grid">
                {/* 1. Headers */}
                <div className="time-table-header-cell" style={{ gridColumn: 1, gridRow: 1 }}></div>
                {dayLabels.map((day, index) => (
                    <div key={day} className="time-table-header-cell" style={{ gridColumn: index + 2, gridRow: 1 }}>{day}</div>
                ))}

                {/* 2. Background Grid (Time Cells + Empty White Cells) */}
                {PERIODS.map((period, index) => {
                    const row = index + 2;
                    return (
                        <React.Fragment key={`bg-${period.id}`}>
                            {/* Time Cell */}
                            <div className="time-table-time-cell" style={{ gridColumn: 1, gridRow: row }}>
                                <div>{period.id}</div>
                            </div>
                            {/* White Background Cells (Always Rendered) */}
                            {[1, 2, 3, 4, 5, 6].map(dayIndex => (
                                <div key={`cell-${dayIndex}-${period.id}`} className="time-table-course-cell" style={{
                                    gridColumn: dayIndex + 1,
                                    gridRow: row,
                                    zIndex: 0
                                }} />
                            ))}
                        </React.Fragment>
                    );
                })}

                {/* 3. Course Cards (Overlay) */}
                {[1, 2, 3, 4, 5, 6].map(dayIndex => {
                    return PERIODS.map((period, pIndex) => {
                        const key = `${dayIndex}_${period.id}`;
                        const config = cellConfig[key] || { span: 1, skip: false };

                        if (config.skip) return null;

                        const coursesInCell = grid[key] || [];
                        if (coursesInCell.length === 0) return null;

                        const hasOverlap = coursesInCell.length > 1;
                        const row = pIndex + 2;

                        return (
                            <div
                                key={`course-${key}`}
                                style={{
                                    gridColumn: dayIndex + 1,
                                    gridRow: `${row} / span ${config.span}`,
                                    zIndex: 1, // On top of background
                                    padding: '4px', // Match cell padding
                                    pointerEvents: 'none', // Allow clicks to pass through to cell if needed, but card needs interaction
                                    // Actually, we want the card to be interactive.
                                    // Since it's on top, it will capture events.
                                    pointerEvents: 'auto',
                                }}
                                onMouseEnter={() => setHoveredCell(key)}
                                onMouseLeave={() => setHoveredCell(null)}
                            >
                                {hasOverlap ? (
                                    // 多個課程衝突時的顯示樣式
                                    <div
                                        className="time-table-course-card time-table-conflict-card"
                                        title={`共${coursesInCell.length}個課程衝突`}
                                    >
                                        <div className="time-table-conflict-title">多個課程衝突</div>
                                        <div className="time-table-conflict-subtitle">請查看卡片形式</div>
                                    </div>
                                ) : (
                                    // 單個課程正常顯示
                                    <div
                                        className={`time-table-course-card ${hoveredCell === key ? 'hover' : ''}`}
                                        title={`${coursesInCell[0].name} (${coursesInCell[0].location})`}
                                        onClick={() => navigate(`/course/${coursesInCell[0].id}`, { state: { course: coursesInCell[0], semesterId: currentSemester } })}
                                    >
                                        <div>{coursesInCell[0].name}</div>
                                        <div className="time-table-course-location">
                                            {coursesInCell[0].location}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    });
                })}
            </div>
        </div>
    );
};

export default TimeTableView;
