import React, { useState, useEffect } from 'react';
import ClassFilter from './ClassFilter';
import CardView from './CardView';
import TimeTableView from './TimeTableView';
import Loader from '../../components/ui/Loader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableCells, faTableCellsLarge } from '@fortawesome/free-solid-svg-icons';
import { fetchAllSemesterCourses, filterAndConvertSchedule } from '../../api/CourseService';
import { useToast } from '../../components/ui/Toast';
import './ClassSchedule.css';

// 將學期代碼格式化為中文顯示
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

/**
 * 班級課表主頁面
 * @param {string} currentSemester - 從 App.js 傳遞過來的全域學期
 */
const ClassSchedule = ({ currentSemester }) => {
    const { addToast } = useToast();
    // Initialize state from sessionStorage if available
    const [selectedClassCode, setSelectedClassCode] = useState(() => {
        return sessionStorage.getItem('schedule_selectedClassCode') || null;
    });
    const [viewMode, setViewMode] = useState(() => {
        return sessionStorage.getItem('schedule_viewMode') || 'table';
    });

    const [courses, setCourses] = useState(null); // 最終篩選出的課表
    const [allSemesterCourses, setAllSemesterCourses] = useState(null); // 該學期所有課程總表

    const [isLoadingTotal, setIsLoadingTotal] = useState(true); // 載入總表狀態
    const [isFiltering, setIsFiltering] = useState(false); // 篩選中狀態
    const [error, setError] = useState(null);

    // 1：載入該學期的課程總表 ---
    useEffect(() => {
        if (!currentSemester) return;

        async function loadAllCourses() {
            setIsLoadingTotal(true);
            setError(null);
            setAllSemesterCourses(null);
            setCourses(null);

            try {
                // *** 呼叫 API 獲取大數據總表 ***
                const data = await fetchAllSemesterCourses(currentSemester);

                setAllSemesterCourses(data);
                setCourses(null);
            } catch (err) {
                addToast(`載入 ${currentSemester} 課程總表失敗: ${err.message}。`, 'error');
                setError(`載入 ${currentSemester} 課程總表失敗: ${err.message}。`);
            } finally {
                setIsLoadingTotal(false);
            }
        }

        loadAllCourses();

    }, [currentSemester, addToast]); // 依賴於全域學期與 addToast

    // --- 2：當班級 ID 或總表改變時，進行本地篩選 ---
    useEffect(() => {
        if (!selectedClassCode || !allSemesterCourses) {
            setCourses(null);
            return;
        }

        // local filter started
        setIsFiltering(true);
        // 在這裡進行本地篩選和格式轉換
        const filteredSchedule = filterAndConvertSchedule(allSemesterCourses, selectedClassCode);

        setCourses(filteredSchedule);
        setIsFiltering(false);

    }, [selectedClassCode, allSemesterCourses]);

    useEffect(() => {
        if (selectedClassCode) {
            sessionStorage.setItem('schedule_selectedClassCode', selectedClassCode);
        } else {
            sessionStorage.removeItem('schedule_selectedClassCode');
        }
    }, [selectedClassCode]);

    useEffect(() => {
        sessionStorage.setItem('schedule_viewMode', viewMode);
    }, [viewMode]);
    // --------------------------------------------------------

    const handleFilterChange = (classCode) => {
        setSelectedClassCode(classCode);
    }

    // 狀態訊息
    let message = '';
    if (isLoadingTotal) {
        return <Loader />;
    } else if (error) {
        message = `${error}`;
    } else if (!selectedClassCode) {
        message = '請先利用上方篩選器選擇欲查詢的班級。';
    } else if (isFiltering) {
        message = '正在篩選課程...';
    } else if (courses && courses.length === 0) {
        message = `查無該班級在 ${currentSemester} 學期的課表資料。`;
    }


    return (
        <div>
            <div className="class-schedule-container">
                <div className="class-schedule-title">班級課表</div>
                <div className="class-schedule-subtitle">瀏覽全校所有班級開課課程，當前學期為 {formatSemester(currentSemester)}</div>
                {/* 班級篩選器傳遞學期值 */}
                <div className="class-schedule-filter-card">
                    <h3 className="class-schedule-filter-title">選擇班級</h3>
                    <ClassFilter
                        onFilterChange={handleFilterChange}
                        currentSemester={currentSemester}
                        initialClassId={selectedClassCode}
                    />
                </div>


                {selectedClassCode && !message && (
                    <div className="class-schedule-view-toggle">
                        <button className={`class-schedule-toggle-button ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}><FontAwesomeIcon icon={faTableCells} style={{ marginRight: '4px', fontSize: '14px' }} />時間表形式</button>
                        <button className={`class-schedule-toggle-button ${viewMode === 'card' ? 'active' : ''}`} onClick={() => setViewMode('card')}><FontAwesomeIcon icon={faTableCellsLarge} style={{ marginRight: '4px', fontSize: '14px' }} />卡片形式</button>
                    </div>
                )}

                {/* 顯示內容或訊息 */}
                {message ? (
                    <div className="class-schedule-message">{message}</div>
                ) : (
                    <>
                        {courses && viewMode === 'table' && <TimeTableView courses={courses} currentSemester={currentSemester} />}
                        {courses && viewMode === 'card' && <CardView courses={courses} currentSemester={currentSemester} />}
                    </>
                )}
            </div>
        </div>

    );
};

export default ClassSchedule;