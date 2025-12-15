import React from 'react';
import { PERIODS } from '../../constants/periods';
import './TimeTable.css';

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
        <div className="simulation-timetable-container">
            <div className="simulation-timetable-grid-container" onDragOver={handleDragOver} onDrop={handleDrop}>
                {/* 1. Headers */}
                <div className="simulation-timetable-header-cell" style={{ gridColumn: 1, gridRow: 1 }}></div>
                {DayNames.map((day, index) => (
                    <div key={day} className="simulation-timetable-header-cell" style={{ gridColumn: index + 2, gridRow: 1 }}>{day}</div>
                ))}

                {/* 2. Background Grid (Time Cells + Empty White Cells) */}
                {PERIODS.map((period, index) => {
                    const row = index + 2;
                    return (
                        <React.Fragment key={`bg-${period.id}`}>
                            {/* Time Cell */}
                            <div className="simulation-timetable-time-cell" style={{ gridColumn: 1, gridRow: row }}>
                                <div>{period.id}</div>
                            </div>
                            {/* White Background Cells (Always Rendered) */}
                            {[1, 2, 3, 4, 5, 6].map(dayIndex => (
                                <div key={`cell-${dayIndex}-${period.id}`} className="simulation-timetable-course-cell" style={{
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
                                    className={`simulation-timetable-course-card ${isHovered ? 'hover' : ''}`}
                                    style={{
                                        pointerEvents: 'auto', // Re-enable pointer events
                                    }}
                                    onMouseEnter={() => setHoveredCell(key)}
                                    onMouseLeave={() => setHoveredCell(null)}
                                    onClick={() => handleCourseClick(courseId, course?.name)}
                                    title="點擊以移除課程"
                                >
                                    <div className="simulation-timetable-course-name">{course?.name}</div>
                                    {location && (
                                        <div className="simulation-timetable-course-location">
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