import React from 'react';
import { PERIODS } from '../../constants/periods';

const styles = {
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        flexGrow: 1,
        overflowY: 'auto',
        boxSizing: 'border-box',
        minHeight: 0, // Important for flex child scrolling
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: '60px repeat(6, 1fr)', // 6 days
        gap: '2px',
        backgroundColor: '#EDEEF1',
        padding: '2px',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative',
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
        minHeight: '50px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
    },
    courseCell: {
        backgroundColor: '#FFFFFF',
        padding: '4px',
        minHeight: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
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
        boxSizing: 'border-box',
    },
    courseCardHover: {
        backgroundColor: 'rgba(209, 209, 209, 0.6)',
        transform: 'scale(1.03)',
        zIndex: 10,
    },
};

const DayNames = ['一', '二', '三', '四', '五', '六'];

const SchedulerTable = ({ scheduleGrid, courseData, onRemoveCourse }) => {
    const [hoveredCell, setHoveredCell] = React.useState(null);

    // Pre-calculate spans for merging consecutive cells
    const cellConfig = {};
    [1, 2, 3, 4, 5, 6].forEach(day => {
        for (let i = 0; i < PERIODS.length; i++) {
            const period = PERIODS[i];
            const key = `${day}_${period.id}`;

            if (cellConfig[key]?.skip) continue;

            const courseId = scheduleGrid[key];

            if (courseId) {
                let span = 1;
                // Look ahead for same course
                for (let j = i + 1; j < PERIODS.length; j++) {
                    const nextPeriod = PERIODS[j];
                    const nextKey = `${day}_${nextPeriod.id}`;
                    const nextCourseId = scheduleGrid[nextKey];

                    if (nextCourseId === courseId) {
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

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
    };

    const handleCourseClick = (courseId, courseName) => {
        if (window.confirm(`確定要移除課程 ${courseName} 嗎？`)) {
            onRemoveCourse(courseId);
        }
    };

    const getLocation = (course) => {
        if (!course) return '';
        if (course.location) return course.location;
        if (Array.isArray(course.classroom) && course.classroom.length > 0) {
            return course.classroom[0].name || course.classroom[0] || '';
        }
        return '';
    };

    return (
        <div style={styles.container}>
            <div style={styles.gridContainer} onDragOver={handleDragOver} onDrop={handleDrop}>
                {/* 1. Headers */}
                <div style={{ gridColumn: 1, gridRow: 1, ...styles.headerCell }}></div>
                {DayNames.map((day, index) => (
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

                        const courseId = scheduleGrid[key];
                        if (!courseId) return null;

                        const course = courseData[courseId];
                        const row = pIndex + 2;
                        const isHovered = hoveredCell === key;
                        const location = getLocation(course);

                        return (
                            <div
                                key={`course-${key}`}
                                style={{
                                    gridColumn: dayIndex + 1,
                                    gridRow: `${row} / span ${config.span}`,
                                    padding: '4px',
                                    zIndex: 1,
                                    pointerEvents: 'none', // Let clicks pass through to the card inside
                                    display: 'flex',
                                }}
                            >
                                <div
                                    style={{
                                        ...styles.courseCard,
                                        ...(isHovered ? styles.courseCardHover : {}),
                                        pointerEvents: 'auto', // Re-enable pointer events
                                    }}
                                    onMouseEnter={() => setHoveredCell(key)}
                                    onMouseLeave={() => setHoveredCell(null)}
                                    onClick={() => handleCourseClick(courseId, course?.name)}
                                    title="點擊以移除課程"
                                >
                                    <div>{course?.name}</div>
                                    {location && (
                                        <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
                                            {location}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    });
                })}
            </div>
        </div>
    );
};

export default React.memo(SchedulerTable);
