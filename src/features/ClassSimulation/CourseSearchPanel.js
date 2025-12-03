import React, { useState, useEffect } from 'react';
import { fetchAllSemesterCourses } from '../../api/CourseService';
import { MOCK_ALL_COURSES } from '../../constants/mockData';

const styles = {
    container: {
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        height: 'calc(100vh - 200px)', // 為了讓列表可滾動
        overflowY: 'auto',
    },
    searchInput: {
        width: 'calc(100% - 20px)',
        padding: '10px',
        marginBottom: '10px',
        borderRadius: '4px',
        border: '1px solid #ddd',
    },
    courseItem: (isAdded) => ({
        border: `1px solid ${isAdded ? '#80bdff' : '#ddd'}`,
        borderRadius: '4px',
        padding: '10px',
        marginBottom: '8px',
        backgroundColor: isAdded ? '#e9f5ff' : '#fff',
        cursor: isAdded ? 'default' : 'grab',
        opacity: isAdded ? 0.6 : 1,
        transition: 'opacity 0.2s',
    }),
    title: {
        fontSize: '1.1em',
        fontWeight: 'bold',
        color: '#333',
    },
    credits: {
        fontSize: '0.9em',
        color: '#5cb85c', // 綠色標註學分
    },
    message: {
        color: '#999',
        textAlign: 'center',
        marginTop: '20px',
    }
};

/**
 * 左側課程搜尋與拖曳源
 * @param {Array} addedCourseIds - 已被加入課表的課程 ID 列表
 */
const CourseSearchPanel = ({ addedCourseIds, currentSemester }) => {
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
                console.warn('載入課程清單失敗，改用 mock：', err.message);
                if (mounted) setAllCourses(MOCK_ALL_COURSES);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [currentSemester]);

    // 如果還沒載入 API 資料，先用 mock（保險）
    const sourceCourses = allCourses || MOCK_ALL_COURSES;

    // 正規化函數
    const normalize = (s = '') => String(s).replace(/[^0-9a-zA-Z\u4e00-\u9fff\s]/g, '').toLowerCase();

    const filteredCourses = sourceCourses.filter(course => {
        const q = normalize(searchTerm);
        if (!q) return true; // empty -> include for suggestions

        const hayParts = [];
        // 支援多種欄位形態
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

    // 處理拖曳開始事件
    const handleDragStart = (e, courseId, rawCourse) => {
        // 傳遞兩種資料：1) courseId（舊有邏輯） 2) 一個給排課器使用的 normalized course JSON
        e.dataTransfer.setData("courseId", String(courseId));

        // 將 rawCourse normalize 成排課器可用的格式
        const normalizeForScheduler = (rc) => {
            const out = {
                id: Number(rc.id ?? rc.courseId ?? rc.course_id),
                name: typeof rc.name === 'string' ? rc.name : (rc.name?.zh || rc.name?.en || ''),
                credit: rc.credit ?? rc.credits ?? rc.creditsTotal ?? 0,
                teacher: Array.isArray(rc.teacher) ? (rc.teacher.map(t => t.name || t).join('、')) : (rc.teacher || ''),
                classroom: Array.isArray(rc.classroom) ? rc.classroom : (rc.classroom ? [rc.classroom] : []),
                time: [],
            };

            // 支援可能的 time 結構
            if (Array.isArray(rc.time)) {
                // 可能已經是 [{day, period}] 的格式
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
        <div style={styles.container}>
            <input
                type="text"
                placeholder="搜尋課程名稱或教師"
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {filteredCourses.length === 0 && <p style={styles.message}>找不到符合的課程。</p>}

            <div>
                {filteredCourses.map(course => {
                    const courseId = course.id ?? course.courseId ?? course.course_id;
                    const isAdded = addedCourseIds.includes(Number(courseId));
                    // 顯示欄位的安全取值
                    const title = typeof course.name === 'string' ? course.name : (course.name?.zh || course.name?.en || '未知課程');
                    const teacher = Array.isArray(course.teacher) ? course.teacher.map(t => t.name || t).join('、') : (course.teacher || '未知');
                    const credits = course.credit ?? course.credits ?? course.creditsTotal ?? '';
                    const location = Array.isArray(course.classroom) ? (course.classroom[0]?.name || '') : (course.location || '');

                    return (
                        <div
                            key={String(courseId)}
                            style={styles.courseItem(isAdded)}
                            draggable={!isAdded}
                            onDragStart={!isAdded ? (e) => handleDragStart(e, courseId, course) : null}
                            title={isAdded ? "已加入課表" : "拖曳加入課表"}
                        >
                            <div style={styles.title}>
                                {title}
                                <span style={styles.credits}> ({credits}學分)</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.9em' }}>
                                授課：{teacher} {location ? `| 地點：${location}` : ''}
                            </p>
                            {isAdded && <span style={{ color: 'red', fontSize: '0.8em' }}> [已排入]</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CourseSearchPanel;