import React, { useState, useEffect } from 'react';
import { fetchCalendarEvents, fetchAllSemesterCourses } from '../../api/CourseService';

// 假設的近期行事曆事件 (作為 fetch 失敗時的 fallback)
const MOCK_RECENT_EVENTS = [
    { date: '11/25', description: '期中考試週開始', link: '/calendar' },
    { date: '12/05', description: '課程加退選截止', link: '/calendar' },
    { date: '12/25', description: '聖誕節/全校放假', link: '/calendar' },
];

const styles = {
    searchContainer: {
        padding: '30px',
        backgroundColor: '#f0f4f7',
        borderRadius: '10px',
        marginBottom: '40px',
        textAlign: 'center',
    },
    searchInput: {
        width: '60%',
        padding: '12px 15px',
        fontSize: '18px',
        borderRadius: '25px',
        border: '2px solid #007bff',
        marginRight: '10px',
    },
    searchButton: {
        padding: '12px 25px',
        fontSize: '18px',
        borderRadius: '25px',
        border: 'none',
        backgroundColor: '#007bff',
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
    padding: '12px',
    background: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
};
styles.cardTitle = { fontSize: '16px', fontWeight: 700, marginBottom: '6px' };
styles.cardMeta = { color: '#666', fontSize: '13px', marginBottom: '8px' };
styles.cardRight = { textAlign: 'right', minWidth: '88px' };
styles.cardButton = { padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#007bff', color: '#fff', cursor: 'pointer' };

const Home = ({ currentSemester }) => {
    const [searchText, setSearchText] = useState('');
    const [recentEvents, setRecentEvents] = useState(MOCK_RECENT_EVENTS);
    const [allCourses, setAllCourses] = useState(null);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [results, setResults] = useState([]);

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
            return;
        }

        const tokens = normalize(q).split(/\s+/).filter(Boolean);
        if (!allCourses) {
            setResults([]);
            return;
        }

        const matched = allCourses.filter(course => {
            // build searchable text
            const parts = [];
            // 名稱（中文/英文）
            parts.push(course.name?.zh || '');
            parts.push(course.name?.en || '');
            // 授課教師
            if (Array.isArray(course.teacher)) parts.push(course.teacher.map(t => t.name).join(' '));
            // 課號、代碼
            parts.push(course.id || '');
            parts.push(course.code || '');
            // 所屬班級
            if (Array.isArray(course.class)) parts.push(course.class.map(c => c.name || c.code || c.id).join(' '));

            const hay = normalize(parts.join(' '));

            // tokens 必須全部存在於 hay 中（AND 搜尋）
            return tokens.every(tok => hay.includes(tok));
        });

        setResults(matched);
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
    const displayed = isQueryEmpty ? (allCourses && allCourses.length > 0 ? allCourses.slice(0, 3) : []) : results;

    return (
        <div>
            <h2>首頁</h2>

            {/* 課程搜尋欄位 */}
            <div style={styles.searchContainer}>
                <h3>快速課程搜尋</h3>
                <input
                    type="text"
                    placeholder="輸入課程名稱、代碼或教師..."
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

            {/* 搜尋結果 */}
            <div style={{ maxWidth: '980px', margin: '0 auto 30px', padding: '10px' }}>
                {loadingCourses ? (
                    <div>載入課程中…</div>
                ) : (
                    <div>
                        {displayed.length === 0 ? (
                            <div style={{ color: '#666' }}>{isQueryEmpty ? '尚無可顯示的建議課程（請稍候或切換學期）。' : '尚無搜尋結果。請嘗試其他關鍵字。'}</div>
                        ) : (
                            <div>
                                <div style={{ marginBottom: '8px', color: '#333' }}></div>
                                <div style={styles.cardsContainer}>
                                    {displayed.map((c) => (
                                        <div key={c.id} style={styles.card}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={styles.cardTitle}>{c.name?.zh || c.name?.en || '未知課程'}</div>
                                                    <div style={styles.cardMeta}>{c.id || ''} • 授課：{(c.teacher || []).map(t => t.name).join('、') || '未知'}</div>
                                                    <div style={{ color: '#444', fontSize: '13px' }}>{(c.class || []).slice(0, 3).map(cl => cl.name || cl.code || cl.id).join('，')}</div>
                                                </div>
                                                <div style={styles.cardRight}>
                                                    <div style={{ fontWeight: 700 }}>{c.credit || ''} 學分</div>
                                                    <div style={{ marginTop: '8px' }}>
                                                        <button style={styles.cardButton} onClick={() => alert('尚未實作：查看課表')}>查看課表</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 近期校園行事曆主要事件 */}
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
            </div>
        </div>
    );
};

export default Home;