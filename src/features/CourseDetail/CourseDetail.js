import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faClock, faUser, faBook, faInfoCircle, faHashtag, faStar, faListUl, faPlus } from '@fortawesome/free-solid-svg-icons';
import { fetchTeacherWithdrawalRates, fetchCourseSyllabus } from '../../api/CourseService';
import { useSimulation } from '../../context/SimulationContext';
import Loader from '../../components/ui/Loader';
import './CourseDetail.css';

// --- Helper Functions ---

const getTeacherName = (c) => {
    if (!c || !c.teacher) return '無教師資訊';
    if (Array.isArray(c.teacher)) {
        return c.teacher.map(t => t.name).join('、');
    }
    if (typeof c.teacher === 'object') {
        return c.teacher.name || '無教師資訊';
    }
    return String(c.teacher);
};

const getClassName = (c) => {
    if (Array.isArray(c.class)) {
        return c.class.map(cl => cl.name).join('、');
    }
    if (c.class && typeof c.class === 'object') {
        return c.class.name || '未指定';
    }
    return c.class || '未指定';
};

const getLocation = (c) => {
    if (c.location) return c.location;
    if (Array.isArray(c.classroom) && c.classroom.length > 0) {
        return c.classroom.map(r => r.name).join('、');
    }
    return '未指定';
};

const formatTime = (timeData) => {
    if (!timeData) return '無時間資訊';

    const dayMap = {
        1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '日',
        mon: '一', tue: '二', wed: '三', thu: '四', fri: '五', sat: '六', sun: '日'
    };

    const schedule = {};
    const addToSchedule = (day, period) => {
        const dayStr = dayMap[day] || day;
        if (!schedule[dayStr]) schedule[dayStr] = [];
        schedule[dayStr].push(period);
    };

    if (Array.isArray(timeData)) {
        if (timeData.length === 0) return '無時間資訊';
        timeData.forEach(t => addToSchedule(t.day, t.period));
    } else if (typeof timeData === 'object') {
        for (const [dayKey, periods] of Object.entries(timeData)) {
            if (Array.isArray(periods) && periods.length > 0) {
                periods.forEach(p => addToSchedule(dayKey, p));
            }
        }
    } else {
        return '無時間資訊';
    }

    const result = Object.entries(schedule).map(([day, periods]) => {
        const sortedPeriods = periods.sort((a, b) => Number(a) - Number(b));
        return `${day} / ${sortedPeriods.join(', ')}`;
    });

    if (result.length === 0) return '無時間資訊';
    return result.map((str, index) => <div key={index}>{str}</div>);
};

// --- Sub-components ---

const InfoItem = ({ label, value }) => (
    <div className="course-detail-item">
        <span className="course-detail-label">{label}</span>
        <span className="course-detail-value">{value}</span>
    </div>
);

const Section = ({ title, icon, children, style }) => (
    <div className="course-detail-section" style={style}>
        <h3 className="course-detail-section-title">
            <FontAwesomeIcon icon={icon} /> {title}
        </h3>
        {children}
    </div>
);

const SyllabusLinksSection = ({ syllabus }) => {
    if (!syllabus || syllabus.length === 0) return null;

    return (
        <div className="content-card course-detail-card" style={{ marginTop: '24px' }}>
            <Section title="課程大綱" icon={faBook} style={{ width: '100%', borderLeft: 'none' }}>
                {syllabus.map((item, index) => (
                    <div className="course-detail-value" key={index} style={{ marginBottom: syllabus.length > 1 ? '16px' : '0' }}>
                        {syllabus.length > 1 && <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{item.name}</div>}
                        <div style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', fontWeight: '400' }}>
                            {item.objective}
                        </div>
                    </div>
                ))}
            </Section>
        </div>
    );
};

const DetailedSyllabusSection = ({ syllabus }) => {
    if (!syllabus || syllabus.length === 0) return null;

    return (
        <div className="content-card course-detail-card" style={{ marginTop: '24px' }}>
            <Section title="詳細課程進度與評分" icon={faListUl} style={{ width: '100%', borderLeft: 'none' }}>
                {syllabus.map((item, index) => (
                    <div key={index} style={{ marginBottom: '24px', borderBottom: index < syllabus.length - 1 ? '1px solid #e2e8f0' : 'none', paddingBottom: index < syllabus.length - 1 ? '24px' : '0' }}>
                        <h4 style={{ marginBottom: '12px' }}>{item.name ? `授課教師：${item.name}` : `${index + 1}`} {item.email}</h4>

                        {item.schedule && (
                            <div style={{ marginBottom: '16px' }}>
                                <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>課程進度</h5>
                                <div className="course-detail-value course-syllabus-box">
                                    {item.schedule}
                                </div>
                            </div>
                        )}

                        {item.scorePolicy && (
                            <div>
                                <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>評分方式</h5>
                                <div className="course-detail-value course-syllabus-box">
                                    {item.scorePolicy}
                                </div>
                            </div>
                        )}
                        {item.materials && (
                            <div>
                                <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>使用教材</h5>
                                <div className="course-detail-value course-syllabus-box">
                                    {item.materials}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </Section>
        </div>
    );
};

// --- Main Component ---

const CourseDetail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { addCourse } = useSimulation();
    const rawCourse = location.state?.course;

    const course = useMemo(() => {
        if (!rawCourse) return null;

        // Normalize name
        const name = (typeof rawCourse.name === 'object' && rawCourse.name !== null)
            ? (rawCourse.name.zh || rawCourse.name.en || 'Unknown')
            : rawCourse.name;

        // Normalize time to array format if it's an object
        let time = rawCourse.time;
        if (time && typeof time === 'object' && !Array.isArray(time)) {
            const times = [];
            const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
            for (const [dayStr, periods] of Object.entries(time)) {
                const dayIndex = dayMap[dayStr.toLowerCase()] || dayStr;
                if (Array.isArray(periods)) {
                    periods.forEach(period => {
                        times.push({ day: Number(dayIndex), period: String(period) });
                    });
                }
            }
            time = times;
        }

        // Map courseType symbol to readable text
        const typeMap = {
            '○': '共同必修',
            '△': '共同必修',
            '☆': '共同選修',
            '●': '專業必修',
            '▲': '專業必修',
            '★': '專業選修'
        };
        const typeSymbol = rawCourse.courseType || rawCourse.type || '';
        const type = typeMap[typeSymbol] || typeSymbol || '未指定';

        return {
            ...rawCourse,
            name,
            time,
            type,
            credits: rawCourse.credits || rawCourse.credit
        };
    }, [rawCourse]);
    const [withdrawalRate, setWithdrawalRate] = useState(null);
    const [syllabus, setSyllabus] = useState(null);

    const addToSimulation = () => {
        if (!course) return;
        // Inject semesterId to ensure correct linkage in simulation
        const courseWithSemester = {
            ...course,
            semesterId: location.state?.semesterId || '113-1'
        };
        addCourse(courseWithSemester);
    };

    useEffect(() => {
        if (!course) return;

        const loadData = async () => {
            // 1. Load Syllabus
            const semesterId = location.state?.semesterId || '113-1';
            const syl = await fetchCourseSyllabus(course.id, semesterId);
            if (syl) setSyllabus(syl);

            // 2. Load Withdrawal Rate
            const teacherName = getTeacherName(course);
            if (teacherName === '無教師資訊') {
                setWithdrawalRate('無資料');
                return;
            }

            try {
                const rates = await fetchTeacherWithdrawalRates();
                if (!Array.isArray(rates)) {
                    setWithdrawalRate('資料格式錯誤');
                    return;
                }

                const teachers = teacherName.split('、');
                const matchedTeacher = rates.find(t => teachers.some(name => t.name === name || t.name.includes(name) || name.includes(t.name)));

                setWithdrawalRate(matchedTeacher ? matchedTeacher.rate_percent : '無資料');
            } catch (error) {
                setWithdrawalRate('載入失敗');
            }
        };

        loadData();
    }, [course, location.state?.semesterId]);

    if (!course) {
        return (
            <div className="page-container">
                <div className="course-detail-not-found">
                    <h2>找不到課程資料</h2>
                    <p>請從課表頁面點擊課程卡片進入。</p>
                    <button className="course-detail-back-btn" onClick={() => navigate(-1)}>
                        <FontAwesomeIcon icon={faArrowLeft} /> 返回上一頁
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <button className="course-detail-back-btn" onClick={() => navigate(-1)}>
                <FontAwesomeIcon icon={faArrowLeft} /> 返回列表
            </button>

            <div className="course-detail-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                    <h1 className="page-title" style={{ marginBottom: 0 }}>{course.name}</h1>
                    {course.time && course.time.length > 0 && (
                        <button
                            onClick={addToSimulation}
                            style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'background-color 0.2s'
                            }}
                            title="加入排課模擬器"
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    )}
                </div>
                <div className="course-detail-subtitle" style={{ marginTop: '8px' }}>
                    <span className="course-detail-badge">
                        <FontAwesomeIcon icon={faHashtag} style={{ marginRight: '4px' }} />
                        {course.id}
                    </span>
                    <span className="course-detail-badge">
                        <FontAwesomeIcon icon={faStar} style={{ marginRight: '4px' }} />
                        {Number(course.credits).toFixed(1)} 學分
                    </span>
                </div>
            </div>

            <div className="content-card course-detail-card">
                <Section title="基本資訊" icon={faInfoCircle}>
                    <div className="course-detail-grid">
                        <InfoItem label="開課班級" value={getClassName(course)} />
                        <InfoItem label="選修 / 必修" value={course.type || '未指定'} />
                        <InfoItem label="修課人數 / 撤選人數" value={`${course.people || '無人數資訊'} / ${course.peopleWithdraw || '無人數資訊'}`} />
                        <InfoItem label="時數" value={course.hours} />
                    </div>
                </Section>

                <Section title="教師資訊" icon={faUser}>
                    <div className="course-detail-grid">
                        <InfoItem label="教師名稱" value={getTeacherName(course)} />
                        <InfoItem
                            label="教師退選率"
                            value={
                                ((Array.isArray(course.teachers) && course.teachers.length > 1) || (typeof course.teacher === 'string' && course.teacher.includes('、')))
                                    ? '無資料'
                                    : (withdrawalRate ? (withdrawalRate === '無資料' || withdrawalRate === '載入失敗' ? withdrawalRate : `${withdrawalRate}%`) : <Loader />)
                            }
                        />
                    </div>
                </Section>

                <Section title="上課資訊" icon={faClock}>
                    <div className="course-detail-grid">
                        <InfoItem label="教室" value={getLocation(course)} />
                        <InfoItem label="時間" value={formatTime(course.time)} />
                        <InfoItem label="備註" value={course.notes || "無備註資訊"} />
                    </div>
                </Section>
            </div>

            <SyllabusLinksSection syllabus={syllabus} />
            <DetailedSyllabusSection syllabus={syllabus} />
        </div>
    );
};

export default CourseDetail;