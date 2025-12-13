import React from 'react';
import { PERIODS } from '../../constants/periods';

const TimeTableView = ({ courses }) => {
    const styles = {
        container: {
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        },
        gridContainer: {
            display: 'grid',
            gridTemplateColumns: '60px 1fr 1fr 1fr 1fr 1fr 1fr',
            gap: '2px',
            backgroundColor: '#EDEEF1',
            padding: '2px',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative', // Ensure z-index works
        },
        headerCell: {
            backgroundColor: '#F8F9FA',
            padding: '12px 8px',
            fontWeight: '600',
            fontSize: '0.9em',
            color: '#464646',
            textAlign: 'center',
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        timeCell: {
            backgroundColor: '#F8F9FA',
            padding: '8px',
            fontWeight: '600',
            fontSize: '0.85em',
            color: '#464646',
            textAlign: 'center',
            minHeight: '60px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '4px',
        },
        periodLabel: {
            fontSize: '0.75em',
            color: '#888888',
        },
        courseCell: {
            backgroundColor: '#FFFFFF',
            padding: '4px',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        courseCard: {
            backgroundColor: 'rgba(199, 196, 196, 0.6)',
            border: 'None',
            borderRadius: '6px',
            padding: '8px',
            cursor: 'pointer',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            transition: 'all 0.2s',
            fontSize: '0.875em',
            color: '#464646',
            fontWeight: '500',
            lineHeight: '1.2',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
        },
        courseCardHover: {
            backgroundColor: 'rgba(209, 209, 209, 0.6)',
            transform: 'scale(1.03)',
        },
    };

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
                        grid[key].push({ name: course.name, location: course.location, id: course.id });
                    }
                }
            } else {
                const key = `${t.day}_${raw}`;
                if (!grid[key]) grid[key] = [];
                grid[key].push({ name: course.name, location: course.location, id: course.id });
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
        <div style={styles.container}>
            <div style={styles.gridContainer}>
                {/* 1. Headers */}
                <div style={{ gridColumn: 1, gridRow: 1, ...styles.headerCell }}></div>
                {dayLabels.map((day, index) => (
                    <div key={day} style={{ gridColumn: index + 2, gridRow: 1, ...styles.headerCell }}>{day}</div>
                ))}

                {/* 2. Background Grid (Time Cells + Empty White Cells) */}
                {PERIODS.map((period, index) => {
                    const row = index + 2;
                    return (
                        <React.Fragment key={`bg-${period.id}`}>
                            {/* Time Cell */}
                            <div style={{ gridColumn: 1, gridRow: row, ...styles.timeCell }}>
                                <div>{period.id}</div>
                            </div>
                            {/* White Background Cells (Always Rendered) */}
                            {[1, 2, 3, 4, 5, 6].map(dayIndex => (
                                <div key={`cell-${dayIndex}-${period.id}`} style={{
                                    gridColumn: dayIndex + 1,
                                    gridRow: row,
                                    ...styles.courseCell,
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
                                        style={{
                                            ...styles.courseCard,
                                            backgroundColor: 'rgba(157, 198, 219, 0.4)',
                                            color: '#648392ff',
                                        }}
                                        title={`共${coursesInCell.length}個課程衝突`}
                                    >
                                        <div style={{ fontSize: '0.75em', fontWeight: '600' }}>多個課程衝突</div>
                                        <div style={{ fontSize: '0.65em', marginTop: '2px' }}>請查看模擬</div>
                                    </div>
                                ) : (
                                    // 單個課程正常顯示
                                    <div
                                        style={{
                                            ...styles.courseCard,
                                            ...(hoveredCell === key ? styles.courseCardHover : {})
                                        }}
                                        title={`${coursesInCell[0].name} (${coursesInCell[0].location})`}
                                    >
                                        <div>{coursesInCell[0].name}</div>
                                        <div style={{ fontSize: '0.7em', marginTop: '4px', color: '#7e7e7eff' }}>
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
