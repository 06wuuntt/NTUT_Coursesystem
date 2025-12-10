import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUser, faLocationDot, faStar, faLandmark } from '@fortawesome/free-solid-svg-icons';
import { fetchCalendarEvents, fetchAllSemesterCourses } from '../../api/CourseService';

// 假設的近期行事曆事件 (作為 fetch 失敗時的 fallback)
const MOCK_RECENT_EVENTS = [
    { date: '11/25', description: '期中考試週開始', link: '/calendar' },
    { date: '12/05', description: '課程加退選截止', link: '/calendar' },
    { date: '12/25', description: '聖誕節/全校放假', link: '/calendar' },
];

const styles = {
    title: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        textAlign: 'center',
        marginBottom: '70px',
    },
    container: {
        backgroundColor: '#f2f2f2',
        margin: '70px auto',
        borderRadius: '30px',
        padding: '30px 50px',
        // boxShadow: '8px 8px 30px #e9e9e9ff',
        maxWidth: '1200px'
    },
    searchContainer: {
        borderRadius: '10px',
        marginBototm: '40px',
    },
    searchPart: {
        display: 'grid',
        gridTemplateColumns: '1fr 10%',
        margin: '0 10px',
    },
    searchInput: {
        padding: '12px 15px',
        fontSize: '18px',
        borderRadius: '15px',
        border: 'solid 0.5px #B4B4B4',
        marginRight: '10px',
    },
    modeButtons: {
        margin: '0 10px 15px 10px',
        minHeight: '50px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px',
        padding: '5px',
        backgroundColor: '#E0E0E0',
        borderRadius: '15px',
        boxShadow: 'inset 0px 0px 8px #d1d1d1ff'
    },
    modeButton: {
        padding: '6px 12px',
        borderRadius: '12px',
        border: 'None',
        background: 'None',
        cursor: 'pointer',
        fontSize: '16px',
        color: '#464646',
    },
    modeButtonActive: {
        background: '#F6F7F8',
        color: '#464646',
    },
    searchButton: {
        padding: '12px 25px',
        fontSize: '18px',
        borderRadius: '15px',
        border: 'none',
        backgroundColor: '#96C6DB',
        color: 'white',
        cursor: 'pointer',
    },
    calendarContainer: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
    },
    eventList: {
        listStyleType: 'none',
        padding: 0,
    },
    eventItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px dotted #ccc',
    },
    eventDate: {
        fontWeight: 'bold',
        color: '#d9534f',
        minWidth: '60px',
        textAlign: 'left',
    },
    eventDescription: {
        flexGrow: 1,
        textAlign: 'left',
        marginLeft: '20px',
    },
    eventLink: {
        color: '#007bff',
        textDecoration: 'none',
    }
};

// 卡片樣式（放在同一檔案以維持簡潔）
styles.cardsContainer = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
};
styles.card = {
    border: '1px solid #e6e9ee',
    borderRadius: '8px',
    padding: '12px 20px',
    background: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
};
styles.cardTitle = { fontSize: '16px', fontWeight: '500' };
styles.cardMeta = { color: '#666', fontSize: '13px', marginBottom: '8px' };
styles.cardRight = { textAlign: 'right', minWidth: '88px' };
styles.cardButton = { padding: '5px 8px', borderRadius: '6px', border: 'none', background: '#96C6DB', color: '#fff', cursor: 'pointer' };
styles.information = { display: 'flex', fontSize: '12px', color: '#7f7f7fff', flexDirection: 'row', alignItems: 'center' }

const Home = ({ currentSemester }) => {
    // 將學期代碼（例如 "114-1"）格式化為中文顯示（例如 "114 上學期"）
    const formatSemester = (s) => {
        if (!s) return '未選定學期';
        const str = String(s).trim();
        // 常見格式："114-1"
        if (str.includes('-')) {
            const [year, sem] = str.split('-');
            const map = { '1': '上學期', '2': '下學期', '3': '暑期' };
            return `${year} ${map[sem] || sem}`;
        }
        // 退而求其次：如果最後一個字是學期編號
        const m = str.match(/^(\d+)(?:.*?)([123])$/);
        if (m) {
            const year = m[1];
            const sem = m[2];
            const map = { '1': '上學期', '2': '下學期', '3': '暑期' };
            return `${year} ${map[sem] || sem}`;
        }
        return str;
    };
    const [searchText, setSearchText] = useState('');
    const [recentEvents, setRecentEvents] = useState(MOCK_RECENT_EVENTS);
    const [allCourses, setAllCourses] = useState(null);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [results, setResults] = useState([]);
    // 搜尋模式：'name' | 'teacher' | 'code'
    const [searchMode, setSearchMode] = useState('name');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        let mounted = true;

        async function loadRecent() {
            try {
                const events = await fetchCalendarEvents();
                // 轉成 Date，計算實際結束日（API 的 endDate 為獨佔日）
                const toItem = (e) => {
                    const start = new Date(e.date);
                    const end = e.endDate ? new Date(e.endDate) : new Date(e.date);
                    // 實際結束為 end - 1 day
                    end.setDate(end.getDate() - 1);
                    return { ...e, _start: start, _end: end };
                };

                const items = events.map(toItem);

                const now = new Date();
                // 找到尚未結束（還在進行或未來）的事件
                const upcoming = items.filter(i => i._end >= new Date(now.getFullYear(), now.getMonth(), now.getDate()));

                // 以開始日排序，取前三個
                upcoming.sort((a, b) => a._start - b._start);

                const top3 = upcoming.slice(0, 3).map(ev => ({
                    date: ev.date.split('-').slice(1).join('/'), // 顯示 MM/DD
                    description: ev.description,
                    link: '/calendar'
                }));

                if (mounted && top3.length > 0) setRecentEvents(top3);
            } catch (err) {
                // 若有錯誤，保留 mock
                console.warn('載入行事曆活動失敗，使用 mock：', err.message);
            }
        }

        loadRecent();
        return () => { mounted = false; };
    }, []);

    // 載入學期的所有課程，作為首頁搜尋的資料來源
    useEffect(() => {
        let mounted = true;
        async function loadCourses() {
            if (!currentSemester) return;
            setLoadingCourses(true);
            try {
                const courses = await fetchAllSemesterCourses(currentSemester);
                if (mounted) setAllCourses(courses || []);
            } catch (err) {
                console.warn('載入課程總表失敗：', err.message);
                if (mounted) setAllCourses([]);
            } finally {
                if (mounted) setLoadingCourses(false);
            }
        }
        loadCourses();
        return () => { mounted = false; };
    }, [currentSemester]);

    // 正規化文字供比對：移除非中英文數字與空白，轉小寫
    const normalize = (s = '') => String(s).replace(/[^0-9a-zA-Z\u4e00-\u9fff\s]/g, '').toLowerCase();

    const performSearch = (text) => {
        const q = String(text || '').trim();
        if (!q) {
            setResults([]);
            setCurrentPage(1);
            return;
        }
        const tokens = normalize(q).split(/\s+/).filter(Boolean);
        if (!allCourses) {
            setResults([]);
            setCurrentPage(1);
            return;
        }

        let matched = [];

        if (searchMode === 'name') {
            matched = allCourses.filter(course => {
                const hay = normalize(((course.name?.zh || '') + ' ' + (course.name?.en || '')).trim());
                return tokens.every(tok => hay.includes(tok));
            });
        } else if (searchMode === 'teacher') {
            matched = allCourses.filter(course => {
                const hay = normalize(Array.isArray(course.teacher) ? course.teacher.map(t => t.name).join(' ') : '');
                return tokens.every(tok => hay.includes(tok));
            });
        } else if (searchMode === 'code') {
            matched = allCourses.filter(course => {
                const hay = normalize(course.id || course.code || '');
                return tokens.every(tok => hay.includes(tok));
            });
        } else {
            // fallback: generic search across common fields
            matched = allCourses.filter(course => {
                const parts = [];
                parts.push(course.name?.zh || '');
                parts.push(course.name?.en || '');
                if (Array.isArray(course.teacher)) parts.push(course.teacher.map(t => t.name).join(' '));
                parts.push(course.id || '');
                parts.push(course.code || '');
                if (Array.isArray(course.class)) parts.push(course.class.map(c => c.name || c.code || c.id).join(' '));
                const hay = normalize(parts.join(' '));
                return tokens.every(tok => hay.includes(tok));
            });
        }

        setResults(matched);
        setCurrentPage(1);
    };

    const handleSearch = () => {
        if (!searchText.trim()) {
            alert('請輸入搜尋關鍵字！');
            return;
        }
        performSearch(searchText);
    };

    // 決定要顯示的內容：若沒有輸入搜尋，顯示建議的前 2-3 筆課程
    const isQueryEmpty = !searchText.trim();
    const allDisplayed = isQueryEmpty ? (allCourses && allCourses.length > 0 ? allCourses.slice(0, 3) : []) : results;

    // 分頁邏輯
    const totalPages = Math.ceil(allDisplayed.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const displayed = allDisplayed.slice(startIdx, endIdx);

    // 格式化課程時間為 "週幾 / 節次, 節次" 格式
    const formatCourseTime = (timeObj) => {
        if (!timeObj || typeof timeObj !== 'object') return '無時間資訊';

        const dayMap = { mon: '一', tue: '二', wed: '三', thu: '四', fri: '五', sat: '六', sun: '日' };
        const timeSlots = [];

        for (const [day, periods] of Object.entries(timeObj)) {
            if (Array.isArray(periods) && periods.length > 0) {
                const dayName = dayMap[day] || day;
                const periodStr = periods.join(', ');
                timeSlots.push(`${dayName} / ${periodStr}`);
            }
        }

        return timeSlots.length > 0 ? timeSlots.join('；') : '無時間資訊';
    };

    return (
        <div>
            <div style={styles.title}>
                <h2 style={{ margin: '0' }}>歡迎回到北科課程系統</h2>
                <div>當前學期為 {formatSemester(currentSemester)}</div>
            </div>

            <div style={styles.container}>
                {/* 課程搜尋欄位 */}
                <div style={styles.searchContainer}>
                    <h3 style={{ color: '#464646', fontSize: '1.5rem', margin: '0 0 20px' }}>搜尋課程</h3>
                    <div style={styles.modeButtons}>
                        <button
                            type="button"
                            style={{ ...styles.modeButton, ...(searchMode === 'name' ? styles.modeButtonActive : {}) }}
                            onClick={() => setSearchMode('name')}
                        >
                            以名稱搜尋
                        </button>
                        <button
                            type="button"
                            style={{ ...styles.modeButton, ...(searchMode === 'teacher' ? styles.modeButtonActive : {}) }}
                            onClick={() => setSearchMode('teacher')}
                        >
                            以教師搜尋
                        </button>
                        <button
                            type="button"
                            style={{ ...styles.modeButton, ...(searchMode === 'code' ? styles.modeButtonActive : {}) }}
                            onClick={() => setSearchMode('code')}
                        >
                            以課號搜尋
                        </button>
                    </div>
                    <div style={styles.searchPart}>
                        <input
                            type="text"
                            placeholder={searchMode === 'name' ? '輸入課程名稱...' : searchMode === 'teacher' ? '輸入教師名稱...' : '輸入課程代碼...'}
                            style={styles.searchInput}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSearch();
                            }}
                        />
                        <button style={styles.searchButton} onClick={handleSearch}>
                            搜尋
                        </button>
                    </div>

                </div>

                {/* 搜尋結果 */}
                <div style={{ margin: '0 0 30px', padding: '10px' }}>
                    {loadingCourses ? (
                        <div>載入課程中…</div>
                    ) : (
                        <div>
                            {allDisplayed.length === 0 ? (
                                <div style={{ color: '#666' }}>{isQueryEmpty ? '尚無可顯示的建議課程（請稍候或切換學期）。' : '尚無搜尋結果。請嘗試其他關鍵字。'}</div>
                            ) : (
                                <div>
                                    <div style={{ margin: '12px 2px 8px', color: '#464646' }}>共 {allDisplayed.length} 筆結果，第 {currentPage} / {totalPages} 頁</div>
                                    <div style={styles.cardsContainer}>
                                        {displayed.map((c) => (
                                            <div key={c.id} style={styles.card}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr auto', gap: '16px', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                                            <div style={styles.cardTitle}>{c.name.zh}</div>
                                                            <div style={{ fontSize: '12px', backgroundColor: '#C3E6F5', padding: '3px 8px', borderRadius: '10px' }}>{c.id}</div>
                                                        </div>
                                                        <div style={styles.information}>
                                                            <FontAwesomeIcon icon={faClock} style={{ marginRight: '4px', fontSize: '12px', }} />
                                                            授課時間：{formatCourseTime(c.time)}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <div style={styles.information}><FontAwesomeIcon icon={faStar} style={{ marginRight: '4px', fontSize: '12px' }} />
                                                            學分：{c.credit}
                                                        </div>
                                                        <div style={styles.information}><FontAwesomeIcon icon={faUser} style={{ marginRight: '4px', fontSize: '12px' }} />
                                                            教師：{Array.isArray(c.teacher) && c.teacher.length > 0 ? c.teacher.map(t => t.name).join('、') : '無教師資訊'}
                                                        </div>
                                                        <div style={styles.information}><FontAwesomeIcon icon={faLocationDot} style={{ marginRight: '4px', fontSize: '12px' }} />
                                                            地點：{Array.isArray(c.classroom) && c.classroom.length > 0 ? c.classroom.map(t => t.name).join('、') : '無教室資訊'}
                                                        </div>
                                                        <div style={styles.information}><FontAwesomeIcon icon={faLandmark} style={{ marginRight: '4px', fontSize: '12px' }} />
                                                            班級：{Array.isArray(c.class) && c.class.length > 0 ? c.class.map(t => t.name).join('、') : '無班級資訊'}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <button style={styles.cardButton}>查看詳情</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* 分頁控制 */}
                                    {(
                                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #ccc',
                                                    backgroundColor: currentPage === 1 ? '#f0f0f0' : '#fff',
                                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                                    color: currentPage === 1 ? '#999' : '#333'
                                                }}
                                            >
                                                上一頁
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #ccc',
                                                        backgroundColor: currentPage === page ? '#96C6DB' : '#fff',
                                                        color: currentPage === page ? '#fff' : '#333',
                                                        cursor: 'pointer',
                                                        fontWeight: currentPage === page ? '600' : 'normal'
                                                    }}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #ccc',
                                                    backgroundColor: currentPage === totalPages ? '#f0f0f0' : '#fff',
                                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                                    color: currentPage === totalPages ? '#999' : '#333'
                                                }}
                                            >
                                                下一頁
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 近期校園行事曆主要事件
            <div style={styles.calendarContainer}>
                <h3>近期行事曆</h3>
                <ul style={styles.eventList}>
                    {recentEvents.length === 0 ? (
                        <li style={{ padding: '10px 0' }}>目前沒有近期活動。</li>
                    ) : (
                        recentEvents.map((event, index) => (
                            <li key={index} style={styles.eventItem}>
                                <span style={styles.eventDate}>{event.date}</span>
                                <span style={styles.eventDescription}>{event.description}</span>
                                <a href={event.link} style={styles.eventLink}>查看詳情 &gt;</a>
                            </li>
                        ))
                    )}
                </ul>
            </div> */}
        </div>
    );
};

export default Home;