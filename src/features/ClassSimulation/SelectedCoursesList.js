import React, { useState, useMemo } from 'react';
import './CourseSearchPanel.css'; // Reuse styles for consistency

const Icons = {
    Trash: () => (
        <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    )
};

const formatTime = (timeArray) => {
    if (!timeArray || timeArray.length === 0) return '無時間資訊';

    const dayMap = ['日', '一', '二', '三', '四', '五', '六'];
    const grouped = {};

    timeArray.forEach(t => {
        if (!grouped[t.day]) grouped[t.day] = [];
        grouped[t.day].push(t.period);
    });

    const parts = [];
    Object.keys(grouped).sort().forEach(dayIdx => {
        const dayName = dayMap[dayIdx] || dayIdx;
        const periods = grouped[dayIdx].join(', ');
        parts.push(`${dayName} / ${periods}`);
    });

    return parts.join('；');
};

const SelectedCoursesList = ({ addedCoursesData = {}, onRemoveCourse, onClearAll, onExport }) => {
    const courses = useMemo(() => Object.values(addedCoursesData), [addedCoursesData]);
    const [searchTerm, setSearchTerm] = useState('');

    const normalize = (s = '') => String(s).replace(/[^0-9a-zA-Z一-鿿\s]/g, '').toLowerCase();

    const displayedCourses = useMemo(() => {
        const q = normalize(searchTerm);
        if (!q) return courses;

        return courses.filter(course => {
            const hayParts = [];
            if (course.name) {
                if (typeof course.name === 'string') hayParts.push(course.name);
                else { hayParts.push(course.name?.zh || ''); hayParts.push(course.name?.en || ''); }
            }
            if (Array.isArray(course.teacher)) hayParts.push(course.teacher.map(t => t.name || t).join(' '));
            else if (course.teacher) hayParts.push(course.teacher);
            hayParts.push(String(course.id));
            if (course.code) hayParts.push(String(course.code));

            const hay = normalize(hayParts.join(' '));
            return hay.includes(q);
        });
    }, [courses, searchTerm]);

    return (
        <div style={{ padding: '20px', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 className="simulation-selected-title">已選課程 ({courses.length})</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={onClearAll}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        清除課表
                    </button>
                    <button
                        onClick={onExport}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#E0F2FE',
                            color: '#0369A1',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        匯出課表
                    </button>
                </div>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {displayedCourses.map(course => {
                    const courseId = Number(course.id ?? course.courseId);

                    const title = typeof course.name === 'string' ? course.name : (course.name?.zh || course.name?.en || 'Unknown');
                    const teacher = Array.isArray(course.teacher) ? course.teacher.map(t => t.name || t).join('、') : (course.teacher || 'Unknown');
                    const credits = course.credit ?? course.credits ?? 0;

                    let timeDisplay = '無時間資訊';
                    if (Array.isArray(course.time)) {
                        timeDisplay = formatTime(course.time);
                    } else if (course.time && typeof course.time === 'object') {
                        const tempTime = [];
                        const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
                        for (const k in course.time) {
                            const dayIdx = (dayMap[k] !== undefined ? dayMap[k] : (Number(k) || null));
                            if (dayIdx) {
                                const periods = course.time[k] || [];
                                if (Array.isArray(periods)) {
                                    periods.forEach(p => tempTime.push({ day: dayIdx, period: String(p) }));
                                }
                            }
                        }
                        if (tempTime.length > 0) timeDisplay = formatTime(tempTime);
                    }

                    return (
                        <div
                            key={String(courseId)}
                            className="simulation-search-course-item"
                            style={{
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                minHeight: 'auto',
                                cursor: 'default', // Changed from default CSS
                                transform: 'none', // Override potential hover transform
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)', // Simple shadow, no hover change intended
                                transition: 'none' // Remove transition
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                                <div className="simulation-selected-item-title">
                                    {title}
                                </div>
                                <div className="simulation-selected-item-info">
                                    {teacher} / {Number(credits).toFixed(1)} 學分
                                </div>
                            </div>

                            <button
                                style={{
                                    padding: '8px',
                                    backgroundColor: 'transparent',
                                    color: '#EF4444',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                                onClick={() => onRemoveCourse && onRemoveCourse(courseId)}
                                title="移除課程"
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Icons.Trash />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SelectedCoursesList;
