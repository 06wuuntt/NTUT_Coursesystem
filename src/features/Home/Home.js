import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllSemesterCourses } from '../../api/CourseService';
import { useToast } from '../../components/ui/Toast';
import Loader from '../../components/ui/Loader';
import './Home.css';

const Icons = {
    Clock: () => (
        <svg className="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    User: () => (
        <svg className="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Location: () => (
        <svg className="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Star: () => (
        <svg className="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    ),
    Landmark: () => (
        <svg className="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    )
};

const Home = ({ currentSemester }) => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    // 將學期代碼（例如 "114-1"）格式化為中文顯示（例如 "114 上學期"）
    const formatSemester = (s) => {
        if (!s) return '未選定學期';
        // trim() 會移除字串起始及結尾處的空白字元
        const str = String(s).trim();
        // 常見格式："114-1"
        if (str.includes('-')) {
            const [year, sem] = str.split('-');
            const map = { '1': '上學期', '2': '下學期', '3': '暑期' };
            return `${year} ${map[sem] || sem}`;
        }

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
    const [allCourses, setAllCourses] = useState(null);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [results, setResults] = useState([]);
    const [searchMode, setSearchMode] = useState('name');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // 增加每頁顯示數量，因為現在是 Grid

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
                if (mounted) {
                    addToast('載入課程總表失敗，請稍後再試', 'error');
                    setAllCourses([]);
                }
            } finally {
                if (mounted) setLoadingCourses(false);
            }
        }
        loadCourses();
        return () => { mounted = false; };
    }, [currentSemester, addToast]);

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
            addToast('請輸入搜尋關鍵字！', 'warning');
            return;
        }
        performSearch(searchText);
    };

    // 決定要顯示的內容：若沒有輸入搜尋，顯示建議的前 2-3 筆課程
    const isQueryEmpty = !searchText.trim();
    const allDisplayed = isQueryEmpty ? (allCourses && allCourses.length > 0 ? allCourses.slice(0, 6) : []) : results;

    // 分頁邏輯
    const totalPages = Math.ceil(allDisplayed.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const displayed = allDisplayed.slice(startIdx, endIdx);

    // 格式化課程時間
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

    const CourseCard = ({ c }) => {
        return (
            <div
                className="card"
                onClick={() => navigate(`/course/${c.id}`, { state: { course: c, semesterId: currentSemester } })}
                style={{ cursor: 'pointer' }}
            >
                <div className="card-header">
                    <div className="card-title">{c.name.zh}</div>
                    <div className="card-id">{c.id}</div>
                </div>

                <div className="divider" />

                <div className="card-body">
                    <div className="information">
                        <Icons.User />
                        <span>{Array.isArray(c.teacher) && c.teacher.length > 0 ? c.teacher.map(t => t.name).join('、') : '無教師資訊'}</span>
                    </div>
                    <div className="information">
                        <Icons.Clock />
                        <span>{formatCourseTime(c.time)}</span>
                    </div>
                    <div className="information">
                        <Icons.Location />
                        <span>{Array.isArray(c.classroom) && c.classroom.length > 0 ? c.classroom.map(t => t.name).join('、') : '無教室資訊'}</span>
                    </div>
                    <div className="information">
                        <Icons.Star />
                        <span>{Number(c.credit || c.credits || 0).toFixed(1)} 學分</span>
                    </div>
                    <div className="information">
                        <Icons.Landmark />
                        <span>{
                            Array.isArray(c.class) && c.class.length > 0
                                ? c.class.map(t => t.name).join('、')
                                : (c.class && typeof c.class === 'object' ? c.class.name : '無班級')
                        }</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="home-title">
                <h2 className="page-title">歡迎回到北科課程系統</h2>
                <div>當前學期為 {formatSemester(currentSemester)}</div>
            </div>

            <div className="page-container home-container">
                {/* 課程搜尋欄位 */}
                <div className="search-container">
                    <h3 className="section-title">搜尋課程</h3>
                    <div className="mode-buttons">
                        <button
                            type="button"
                            className={`mode-button ${searchMode === 'name' ? 'mode-button-active' : ''}`}
                            onClick={() => setSearchMode('name')}
                        >
                            以名稱搜尋
                        </button>
                        <button
                            type="button"
                            className={`mode-button ${searchMode === 'teacher' ? 'mode-button-active' : ''}`}
                            onClick={() => setSearchMode('teacher')}
                        >
                            以教師搜尋
                        </button>
                        <button
                            type="button"
                            className={`mode-button ${searchMode === 'code' ? 'mode-button-active' : ''}`}
                            onClick={() => setSearchMode('code')}
                        >
                            以課號搜尋
                        </button>
                    </div>
                    <div className="search-part">
                        <input
                            id="course-search-input"
                            name="course-search"
                            type="text"
                            placeholder={searchMode === 'name' ? '輸入課程名稱...' : searchMode === 'teacher' ? '輸入教師名稱...' : '輸入課程代碼...'}
                            className="search-input"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSearch();
                            }}
                        />
                        <button className="search-button" onClick={handleSearch}>
                            搜尋
                        </button>
                    </div>

                </div>

                {/* 搜尋結果 */}
                <div className="home-results-container">
                    {loadingCourses ? (
                        <Loader />
                    ) : (
                        <div>
                            {isQueryEmpty ? (
                                // 建議課程顯示（未輸入搜尋時）
                                <div>
                                    <div className="home-suggestion-header">
                                        <div className="home-section-label">建議課程</div>
                                    </div>
                                    {allCourses && allCourses.length > 0 ? (
                                        <div className="cards-container">
                                            {allCourses.slice(0, 6).map((c) => (
                                                <CourseCard key={c.id} c={c} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="home-section-label">尚無可顯示的建議課程（請稍候或切換學期）。</div>
                                    )}
                                </div>
                            ) : (
                                // 搜尋結果顯示（輸入搜尋時）
                                <div>
                                    {results.length === 0 ? (
                                        <div className="home-section-label">尚無搜尋結果。請嘗試其他關鍵字。</div>
                                    ) : (
                                        <div>
                                            <div className="home-section-label home-pagination-info">
                                                <span>共 {results.length} 筆結果</span>
                                                <span className="home-pagination-page-info">，第 {currentPage} / {totalPages} 頁</span>
                                            </div>
                                            <div className="cards-container">
                                                {displayed.map((c) => (
                                                    <CourseCard key={c.id} c={c} />
                                                ))}
                                            </div>
                                            {/* 分頁控制（僅搜尋結果時顯示） */}
                                            {totalPages > 1 && (
                                                <div className="home-pagination">
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={currentPage === 1}
                                                        className="home-pagination-button"
                                                    >
                                                        上一頁
                                                    </button>
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                        <button
                                                            key={page}
                                                            onClick={() => setCurrentPage(page)}
                                                            className={`home-pagination-button ${currentPage === page ? 'active' : ''}`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="home-pagination-button"
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
