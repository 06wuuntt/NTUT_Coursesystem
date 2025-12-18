import React, { useState, useEffect } from 'react';
import { fetchAllSemesterCourses } from '../../api/CourseService';
import { useToast } from '../../components/ui/Toast';
import Loader from '../../components/ui/Loader';
import './CourseSearchPanel.css';

const Icons = {
    Search: () => (
        <svg className="simulation-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    User: () => (
        <svg className="simulation-search-info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Star: () => (
        <svg className="simulation-search-info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    ),
    Location: () => (
        <svg className="simulation-search-info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Clock: () => (
        <svg className="simulation-search-info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
    // Sort days (1 to 7)
    Object.keys(grouped).sort().forEach(dayIdx => {
        const dayName = dayMap[dayIdx] || dayIdx;
        const periods = grouped[dayIdx].join(', ');
        parts.push(`${dayName} / ${periods}`);
    });

    return parts.join('；');
};

const CourseSearchPanel = ({ addedCourseIds, currentSemester, onAddCourse }) => {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [allCourses, setAllCourses] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function load() {
            if (!currentSemester) return;
            setLoading(true);
            try {
                const courses = await fetchAllSemesterCourses(currentSemester);
                if (mounted) setAllCourses(courses || []);
            } catch (err) {
                if (mounted) {
                    addToast('載入課程清單失敗，請稍後再試', 'error');
                    setAllCourses([]);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [currentSemester, addToast]);

    const sourceCourses = allCourses || [];
    const normalize = (s = '') => String(s).replace(/[^0-9a-zA-Z一-鿿\s]/g, '').toLowerCase();

    const filteredCourses = sourceCourses.filter(course => {
        // Filter out courses without teacher info
        const teacherName = Array.isArray(course.teacher) ? course.teacher.map(t => t.name || t).join('') : (course.teacher || '');

        if (!teacherName || teacherName.trim() === '') {
            return false;
        }

        // Filter out courses without time info
        let hasTime = false;
        if (Array.isArray(course.time)) {
            hasTime = course.time.length > 0;
        } else if (course.time && typeof course.time === 'object') {
            hasTime = Object.values(course.time).some(v => Array.isArray(v) && v.length > 0);
        }
        if (!hasTime) return false;

        const q = normalize(searchTerm);
        if (!q) return true;

        const hayParts = [];
        if (course.name) {
            if (typeof course.name === 'string') hayParts.push(course.name);
            else { hayParts.push(course.name?.zh || ''); hayParts.push(course.name?.en || ''); }
        }
        if (Array.isArray(course.teacher)) hayParts.push(course.teacher.map(t => t.name || t).join(' '));
        else if (course.teacher) hayParts.push(course.teacher);
        if (course.id) hayParts.push(String(course.id));
        if (course.code) hayParts.push(String(course.code));
        if (Array.isArray(course.class)) hayParts.push(course.class.map(c => c.name || c.code || c.id).join(' '));

        const hay = normalize(hayParts.join(' '));
        return hay.includes(q);
    });

    const handleDragStart = (e, courseId, rawCourse) => {
        e.dataTransfer.setData("courseId", String(courseId));

        const normalizeForScheduler = (rc) => {
            const out = {
                id: Number(rc.id ?? rc.courseId ?? rc.course_id),
                name: typeof rc.name === 'string' ? rc.name : (rc.name?.zh || rc.name?.en || ''),
                credit: rc.credit ?? rc.credits ?? rc.creditsTotal ?? 0,
                courseType: rc.courseType || '選修',
                teacher: Array.isArray(rc.teacher) ? (rc.teacher.map(t => t.name || t).join('、')) : (rc.teacher || ''),
                classroom: Array.isArray(rc.classroom) ? rc.classroom : (rc.classroom ? [rc.classroom] : []),
                time: [],
            };

            if (Array.isArray(rc.time)) {
                out.time = rc.time.map(t => ({ day: t.day, period: String(t.period) }));
            } else if (rc.time && typeof rc.time === 'object') {
                const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
                for (const k in rc.time) {
                    const dayIdx = (dayMap[k] !== undefined ? dayMap[k] : (Number(k) || null));
                    if (!dayIdx) continue;
                    const periods = rc.time[k] || [];
                    if (Array.isArray(periods)) {
                        periods.forEach(p => {
                            out.time.push({ day: dayIdx, period: String(p) });
                        });
                    }
                }
            }
            return out;
        };

        try {
            const schedulerCourse = normalizeForScheduler(rawCourse);
            e.dataTransfer.setData('application/json', JSON.stringify(schedulerCourse));
        } catch (err) {
            // ignore
        }
        e.dataTransfer.effectAllowed = "copy";
    };

    return (
        <div className="simulation-search-container">
            <div className="simulation-search-input-container">
                <Icons.Search />
                <input
                    type="text"
                    placeholder="搜尋課程名稱、教師或代碼..."
                    className="simulation-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="simulation-search-list-container">
                {loading ? (
                    <Loader />
                ) : filteredCourses.length === 0 ? (
                    <p className="simulation-search-empty">找不到符合的課程</p>
                ) : (
                    filteredCourses.map(course => {
                        const courseId = course.id ?? course.courseId ?? course.course_id;
                        const isAdded = addedCourseIds.includes(Number(courseId));
                        const title = typeof course.name === 'string' ? course.name : (course.name?.zh || course.name?.en || '未知課程');
                        const teacher = Array.isArray(course.teacher) ? course.teacher.map(t => t.name || t).join('、') : (course.teacher || '未知');
                        const credits = course.credit ?? course.credits ?? course.creditsTotal ?? '';
                        const location = Array.isArray(course.classroom) ? (course.classroom[0]?.name || '') : (course.location || '');

                        // Handle time formatting
                        let timeDisplay = '無時間資訊';
                        if (Array.isArray(course.time)) {
                            timeDisplay = formatTime(course.time);
                        } else if (course.time && typeof course.time === 'object') {
                            // Try to convert object format to array for formatTime
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
                                className={`simulation-search-course-item ${isAdded ? 'added' : ''}`}
                                draggable={!isAdded}
                                onDragStart={!isAdded ? (e) => handleDragStart(e, courseId, course) : null}
                                title={isAdded ? "已加入課表" : "拖曳加入課表"}
                            >
                                <div className="simulation-search-course-header">
                                    <div className="simulation-search-course-title">{title}</div>
                                    {!isAdded && <span className="simulation-search-id-badge">{courseId}</span>}
                                </div>

                                <div className="simulation-search-divider" />

                                <div className="simulation-search-info-row">
                                    <Icons.User />
                                    <span>{teacher}</span>
                                </div>
                                <div className="simulation-search-info-row">
                                    <Icons.Star />
                                    <span>{credits} 學分</span>
                                </div>
                                <div className="simulation-search-info-row">
                                    <Icons.Clock />
                                    <span>{timeDisplay}</span>
                                </div>
                                {location && (
                                    <div className="simulation-search-info-row">
                                        <Icons.Location />
                                        <span>{location}</span>
                                    </div>
                                )}

                                {isAdded && <div className="simulation-search-added-badge">已加入</div>}

                                {!isAdded && (
                                    <button
                                        className="simulation-search-add-button"
                                        onClick={() => onAddCourse && onAddCourse(course)}
                                    >
                                        加入
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default React.memo(CourseSearchPanel);
