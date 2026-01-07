import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERIODS } from '../../constants/periods';
import './TimeTable.css';

const DayNames = ['一', '二', '三', '四', '五', '六'];

const SchedulerTable = ({ scheduleGrid, courseData, onRemoveCourse, currentSemester }) => {
    const navigate = useNavigate();
    const [hoveredCell, setHoveredCell] = React.useState(null);

    // Dynamic Calculation of Visible Range
    const { visibleDays, visiblePeriods } = useMemo(() => {
        let maxDayIndex = 0; // 0-based for DayNames (0=Mon, 5=Sat)
        let maxPeriodIndex = 0; // 0-based for PERIODS

        // Default minimums (e.g., Mon-Fri, Periods 1-9)
        // If users want strictly crop, set to -1 
        // But usually a schedule looks better with at least some structure.
        // The user request "if empty... don't output", implies strict dynamic sizing.
        // Let's start with minimal 4 days and 9 periods? 
        // Or just iterate ALL keys and find max.

        // Scan standard full grid to find actual max
        Object.keys(scheduleGrid).forEach(key => {
            const [dStr, pId] = key.split('_');
            const d = parseInt(dStr, 10);

            // Period Index lookup
            const pIdx = PERIODS.findIndex(p => String(p.id) === pId);

            if (pIdx >= 0) {
                // Determine day index (scheduleGrid uses 1-6)
                const dayNameIndex = d - 1;

                if (dayNameIndex > maxDayIndex) maxDayIndex = dayNameIndex;
                if (pIdx > maxPeriodIndex) maxPeriodIndex = pIdx;
            }
        });

        // Ensure reasonable minimums so it doesn't look broken if empty
        // Defaults: Mon-Fri (4), Periods 1-9 (9)
        maxDayIndex = Math.max(maxDayIndex, 4);
        maxPeriodIndex = Math.max(maxPeriodIndex, 9);

        return {
            visibleDays: DayNames.slice(0, maxDayIndex + 1),
            visiblePeriods: PERIODS.slice(0, maxPeriodIndex + 1)
        };

    }, [scheduleGrid]);

    // Derived day indices for mapping (1-based)
    const dayIndices = visibleDays.map((_, i) => i + 1);

    // Pre-calculate spans for merging consecutive cells
    // Only calculate for the visible range
    const cellConfig = useMemo(() => {
        const config = {};

        dayIndices.forEach(day => {
            for (let i = 0; i < visiblePeriods.length; i++) {
                const period = visiblePeriods[i];
                const key = `${day}_${period.id}`;

                if (config[key]?.skip) continue;

                const courseId = scheduleGrid[key];

                if (courseId) {
                    let span = 1;
                    // Look ahead for same course
                    for (let j = i + 1; j < visiblePeriods.length; j++) {
                        const nextPeriod = visiblePeriods[j];
                        const nextKey = `${day}_${nextPeriod.id}`;
                        const nextCourseId = scheduleGrid[nextKey];

                        if (nextCourseId === courseId) {
                            span++;
                            config[nextKey] = { skip: true };
                        } else {
                            break;
                        }
                    }
                    config[key] = { span, skip: false };
                } else {
                    config[key] = { span: 1, skip: false };
                }
            }
        });
        return config;
    }, [dayIndices, visiblePeriods, scheduleGrid]);

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
    };

    const getLocation = (course) => {
        if (!course) return '';
        if (course.location) return course.location;
        if (Array.isArray(course.classroom) && course.classroom.length > 0) {
            return course.classroom[0].name || course.classroom[0] || '無教室資訊';
        }
        return '';
    };

    return (
        <div className="simulation-timetable-container">
            <div
                className="simulation-timetable-grid-container"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                    // Dynamic columns: Header + N Days
                    // Use CSS variable so mobile can shrink the first col
                    gridTemplateColumns: `var(--time-col-width, 60px) repeat(${visibleDays.length}, 1fr)`
                }}
            >
                {/* 1. Headers */}
                <div className="simulation-timetable-header-cell" style={{ gridColumn: 1, gridRow: 1 }}></div>
                {visibleDays.map((day, index) => (
                    <div key={day} className="simulation-timetable-header-cell" style={{ gridColumn: index + 2, gridRow: 1 }}>{day}</div>
                ))}

                {/* 2. Background Grid (Time Cells + Empty White Cells) */}
                {visiblePeriods.map((period, index) => {
                    const row = index + 2;
                    return (
                        <React.Fragment key={`bg-${period.id}`}>
                            {/* Time Cell */}
                            <div className="simulation-timetable-time-cell" style={{ gridColumn: 1, gridRow: row }}>
                                <div>{period.id}</div>
                            </div>
                            {/* White Background Cells (Always Rendered) */}
                            {dayIndices.map((dayIndex, dIdx) => (
                                <div key={`cell-${dayIndex}-${period.id}`} className="simulation-timetable-course-cell" style={{
                                    gridColumn: dIdx + 2, // 1 for header + index (+1)
                                    gridRow: row,
                                    zIndex: 0
                                }} />
                            ))}
                        </React.Fragment>
                    );
                })}

                {/* 3. Course Cards (Overlay) */}
                {dayIndices.map((dayIndex, dIdx) => {
                    return visiblePeriods.map((period, pIndex) => {
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
                                    gridColumn: dIdx + 2,
                                    gridRow: `${row} / span ${config.span}`,
                                    padding: '4px',
                                    zIndex: 10,
                                    position: 'relative',
                                    pointerEvents: 'none', // Let clicks pass through to the card inside
                                    display: 'flex',
                                }}
                            >
                                <div
                                    data-export-target="card"
                                    className={`simulation-timetable-course-card ${isHovered ? 'hover' : ''}`}
                                    style={{
                                        pointerEvents: 'auto', // Re-enable pointer events
                                        backgroundColor: 'rgba(199, 196, 196, 0.6)',
                                        borderRadius: '6px',
                                        padding: '4px',
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
                                        boxSizing: 'border-box',
                                        overflow: 'hidden',
                                        backdropFilter: 'blur(2px)',
                                        WebkitBackdropFilter: 'blur(2px)',
                                        border: 'none'
                                    }}
                                    onMouseEnter={() => setHoveredCell(key)}
                                    onMouseLeave={() => setHoveredCell(null)}
                                    onClick={() => navigate(`/course/${course.id}`, { state: { course: course, semesterId: course.semesterId || currentSemester } })}
                                    title="點擊以查看課程"
                                >
                                    <div
                                        className="simulation-timetable-course-name"
                                        style={{
                                            fontWeight: 'bold',
                                            fontSize: '0.85em',
                                            marginBottom: '2px',
                                            display: 'block', // Ensure it takes space
                                            width: '100%',
                                            textAlign: 'center',
                                            lineHeight: '1.2'
                                        }}
                                    >
                                        {course?.name}
                                    </div>
                                    {location && (
                                        <div
                                            className="simulation-timetable-course-location"
                                            style={{
                                                fontSize: '0.75em',
                                                opacity: 0.9,
                                                textAlign: 'center'
                                            }}
                                        >
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