import React, { useState, useEffect } from 'react';
import ClassFilter from './ClassFilter';
import CardView from './CardView';
import TimeTableView from './TimeTableView';
// import { MOCK_SCHEDULE_DATA } from '../../constants/mockData';
import { fetchAllSemesterCourses, filterAndConvertSchedule } from '../../api/CourseService';

const styles = {
    viewToggle: {
        textAlign: 'right',
        marginBottom: '15px',
    },
    toggleButton: (isActive) => ({
        padding: '8px 15px',
        margin: '0 5px',
        cursor: 'pointer',
        border: `1px solid ${isActive ? '#007bff' : '#ccc'}`,
        backgroundColor: isActive ? '#007bff' : '#fff',
        color: isActive ? 'white' : '#333',
        borderRadius: '4px',
        fontWeight: 'bold',
    }),
    message: {
        textAlign: 'center',
        padding: '40px',
        fontSize: '1.2em',
        color: '#666',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        margin: '20px 0',
    }
};

/**
 * 班級課表主頁面
 * @param {string} currentSemester - 從 App.js 傳遞過來的全域學期
 */
const ClassSchedule = ({ currentSemester }) => {
    const [selectedClassCode, setSelectedClassCode] = useState(null);
    const [viewMode, setViewMode] = useState('table');

    const [courses, setCourses] = useState(null); // 最終篩選出的課表
    const [allSemesterCourses, setAllSemesterCourses] = useState(null); // 該學期所有課程總表

    const [isLoadingTotal, setIsLoadingTotal] = useState(true); // 載入總表狀態
    const [isFiltering, setIsFiltering] = useState(false); // 篩選中狀態
    const [error, setError] = useState(null);

    // --- 副作用 1：載入該學期的課程總表 ---
    useEffect(() => {
        if (!currentSemester) return;

        async function loadAllCourses() {
            setIsLoadingTotal(true);
            setError(null);
            setAllSemesterCourses(null);
            setSelectedClassCode(null);
            setCourses(null);

            try {
                // *** 呼叫 API 獲取大數據總表 ***
                const data = await fetchAllSemesterCourses(currentSemester);
                // **********************************

                setAllSemesterCourses(data);

                // 重設課表和篩選器
                setSelectedClassCode(null);
                setCourses(null);
            } catch (err) {
                console.error("載入課程總表失敗:", err);
                setError(`載入 ${currentSemester} 課程總表失敗: ${err.message}。`);
            } finally {
                setIsLoadingTotal(false);
            }
        }

        loadAllCourses();

    }, [currentSemester]); // 依賴於全域學期

    // --- 副作用 2：當班級 ID 或總表改變時，進行本地篩選 ---
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

    // Log changes to selectedClassCode to see who/when clears it
    useEffect(() => {
        // selection changed
    }, [selectedClassCode]);
    // --------------------------------------------------------

    const handleFilterChange = (classCode) => {
        setSelectedClassCode(classCode);
    }

    // 狀態訊息
    let message = '';
    if (isLoadingTotal) {
        message = `正在載入 ${currentSemester} 學期所有課程總表，請稍候...`;
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
            <h2>班級課表 - {currentSemester}</h2>

            {/* 班級篩選器傳遞學期值 */}
            <ClassFilter onFilterChange={handleFilterChange} currentSemester={currentSemester} />

            {/* Debug panel: show selected key and counts to help troubleshoot
            <div style={{ margin: '12px 0', padding: '10px', background: '#fff7e6', border: '1px solid #ffd580', borderRadius: 6 }}>
                <strong>Debug</strong>
                <div>Selected Key: <code>{String(selectedClassCode ?? '')}</code></div>
                <div>Total courses loaded: <code>{allSemesterCourses ? allSemesterCourses.length : 0}</code></div>
                <div>Filtered courses: <code>{courses ? courses.length : 0}</code></div>
                {courses && courses.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                        <div>Sample courses:</div>
                        <ul>
                            {courses.slice(0, 3).map(c => (
                                <li key={c.id}>{c.name} — {c.credits} 學分 — {c.teacher}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div> */}

            {selectedClassCode && !message && (
                <div style={styles.viewToggle}>
                    <button style={styles.toggleButton(viewMode === 'table')} onClick={() => setViewMode('table')}>時間表形式</button>
                    <button style={styles.toggleButton(viewMode === 'card')} onClick={() => setViewMode('card')}>卡片形式</button>
                </div>
            )}

            {/* 顯示內容或訊息 */}
            {message ? (
                <div style={styles.message}>{message}</div>
            ) : (
                <>
                    {courses && viewMode === 'table' && <TimeTableView courses={courses} />}
                    {courses && viewMode === 'card' && <CardView courses={courses} />}
                </>
            )}
        </div>
    );
};

export default ClassSchedule;