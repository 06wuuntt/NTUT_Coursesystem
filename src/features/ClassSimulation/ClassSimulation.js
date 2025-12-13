import React, { useState, useEffect } from 'react';
import TimeTable from './TimeTable';
import CourseSearchPanel from './CourseSearchPanel';
import { MOCK_ALL_COURSES } from '../../constants/mockData';

const styles = {
    containers: {
        margin: '0 100px',
    },
    container: {
        display: 'flex',
        gap: '20px',
        height: 'calc(100vh - 150px)', // 佔據大部分視口高度
    },
    leftPanel: {
        width: '300px',
        minWidth: '300px',
        flexShrink: 0,
    },
    rightPanel: {
        flexGrow: 1,
        overflowY: 'auto',
    },
    headerBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        marginBottom: '15px',
        borderBottom: '2px solid #0056b3',
    },
    creditDisplay: {
        fontSize: '1.5em',
        fontWeight: 'bold',
        color: '#d9534f',
    },
    dragOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        border: '3px dashed #007bff',
        borderRadius: '10px',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none', // 讓下層組件仍可接收事件
    },
    dragText: {
        fontSize: '2em',
        color: '#007bff',
        opacity: 0.8,
    }
};

/**
 * 將課程加入課表後，更新網格佔用情況
 * @param {object} grid - 當前網格
 * @param {object} course - 要加入的課程資料
 * @returns {object} 新的網格
 */
const updateGrid = (grid, course) => {
    const newGrid = { ...grid };
    course.time.forEach(t => {
        const [start, end] = t.period.split('-').map(Number);
        for (let p = start; p <= (end || start); p++) {
            const key = `${t.day}_${p}`;
            // 檢查衝突：這裡簡化處理，如果格子已被其他課程佔用，則不應覆蓋
            // 由於我們只從左側拖曳，且拖曳的是未加入的課，所以不會有覆蓋問題
            newGrid[key] = course.id;
        }
    });
    return newGrid;
};

/**
 * 排課模擬器主頁面
 */
const Scheduler = ({ currentSemester }) => {
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [courseData, setCourseData] = useState({}); // { 202: {name: '資料結構', ...} }
    const [grid, setGrid] = useState({}); // { '1_3': 202, '3_1': 202, ... }
    const [isDragging, setIsDragging] = useState(false); // 追蹤是否正在拖曳

    // 1. 拖曳放下處理 (處理將課程從左側加入課表)
    const handleDropOnTable = (e) => {
        e.preventDefault();
        setIsDragging(false);

        // 先嘗試從 dataTransfer 取得 normalized course JSON
        const rawJson = e.dataTransfer.getData('application/json');
        let newCourse = null;
        try {
            if (rawJson) {
                newCourse = JSON.parse(rawJson);
            }
        } catch (err) {
            // ignore parse errors
        }

        // 若沒有 JSON，回退到單純的 ID lookup（舊有 mock 行為）
        const draggedCourseId = Number(e.dataTransfer.getData("courseId")) || (newCourse && Number(newCourse.id));

        if (!draggedCourseId || selectedCourseIds.includes(draggedCourseId)) {
            return; // 課程已存在或無效 ID
        }

        if (!newCourse) {
            newCourse = MOCK_ALL_COURSES.find(c => c.id === draggedCourseId) || null;
        }

        if (!newCourse || !Array.isArray(newCourse.time) || newCourse.time.length === 0) {
            alert('此課程無固定上課時間，無法排入課表！');
            return;
        }

        // 正規化 newCourse 字段，統一 credit/credits 欄位為數字，確保 name/time 欄位存在
        const normalizeCourseForState = (c) => {
            const copy = { ...(c || {}) };
            copy.credit = Number(copy.credit ?? copy.credits ?? copy.creditsTotal ?? 0) || 0;
            copy.credits = copy.credit;
            // name 可能為物件
            if (copy.name && typeof copy.name === 'object') copy.name = (copy.name.zh || copy.name.en || '');
            // 確保 time 為陣列且 period 為字串
            if (!Array.isArray(copy.time)) copy.time = [];
            copy.time = copy.time.map(t => ({ day: Number(t.day), period: String(t.period) }));
            return copy;
        };

        newCourse = normalizeCourseForState(newCourse);

        // 檢查是否與現有已排課衝突：若目標任何一個格子已有課程則視為衝堂
        const conflictIds = new Set();
        newCourse.time.forEach(t => {
            const [start, end] = String(t.period).split('-').map(Number);
            for (let p = start; p <= (end || start); p++) {
                const key = `${t.day}_${p}`;
                const occupying = grid[key];
                if (occupying) conflictIds.add(occupying);
            }
        });

        if (conflictIds.size > 0) {
            // 取得衝突課程名稱清單（優先從已加入的 courseData 撈取）
            const names = Array.from(conflictIds).map(id => {
                const c = courseData[id];
                if (c && (c.name || c.name?.zh || c.name?.en)) return (c.name || c.name?.zh || c.name?.en);
                const found = MOCK_ALL_COURSES.find(x => Number(x.id) === Number(id));
                if (found) return (found.name || String(found.id));
                return `ID:${id}`;
            });
            alert(`衝堂：欲加入的課程與已排課衝突，無法加入。衝突課程：${names.join('、')}`);
            return;
        }

        // TODO: 在此處加入更複雜的時間衝突檢查邏輯

        // 更新狀態（使用正規化後的 newCourse）
        setSelectedCourseIds(prev => [...prev, draggedCourseId]);
        setCourseData(prev => ({ ...prev, [draggedCourseId]: newCourse }));
        setGrid(prev => updateGrid(prev, newCourse));
    };

    // 2. 移除課程處理 (從課表點擊或下方列表移除)
    const handleRemoveCourse = (courseIdToRemove) => {
        // 從 ID 列表移除
        setSelectedCourseIds(prev => prev.filter(id => id !== courseIdToRemove));

        // 從 Data 移除（同步計算新的 courseData）
        setCourseData(prev => {
            const newCourses = { ...prev };
            delete newCourses[courseIdToRemove];

            // 重新計算 grid：基於剩餘的 newCourses
            const newGrid = {};
            Object.values(newCourses).forEach(c => {
                if (c && Array.isArray(c.time)) Object.assign(newGrid, updateGrid({}, c));
            });
            setGrid(newGrid);

            return newCourses;
        });
    };

    // 3. 計算總學分數
    const totalCredits = selectedCourseIds.reduce((sum, id) => {
        const c = courseData[id];
        return sum + (c ? (c.credit ?? c.credits ?? 0) : 0);
    }, 0);

    // 監聽拖曳事件的開始與結束 (用於視覺回饋)
    useEffect(() => {
        const handleGlobalDragStart = () => {
            setIsDragging(true);
        };
        const handleGlobalDragEnd = () => {
            setIsDragging(false);
        };

        window.addEventListener('dragstart', handleGlobalDragStart);
        window.addEventListener('dragend', handleGlobalDragEnd);
        return () => {
            window.removeEventListener('dragstart', handleGlobalDragStart);
            window.removeEventListener('dragend', handleGlobalDragEnd);
        };
    }, []);

    return (
        <div style={styles.containers}>
            <div style={styles.headerBar}>
                <h2>排課模擬器</h2>
                <div style={styles.creditDisplay}>已選學分數：{totalCredits} 學分</div>
            </div>

            <div style={styles.container}>
                {/* 左欄：課程搜尋與拖曳源 */}
                <div style={styles.leftPanel}>
                    <h3>課程列表 (可拖曳)</h3>
                    <CourseSearchPanel addedCourseIds={selectedCourseIds} currentSemester={currentSemester} />
                </div>

                {/* 右欄：課表與放置目標 */}
                <div
                    style={styles.rightPanel}
                    onDragOver={(e) => e.preventDefault()} // 允許拖曳到課表區域
                    onDrop={handleDropOnTable}
                >
                    <h3>我的排課結果 (點擊課程可移除)</h3>

                    {/* 拖曳時的視覺回饋 */}
                    {isDragging && (
                        <div style={styles.dragOverlay}>
                            <span style={styles.dragText}>拖曳至此區域加入課表</span>
                        </div>
                    )}

                    {/* 課表 */}
                    <TimeTable
                        scheduleGrid={grid}
                        courseData={courseData}
                        onRemoveCourse={handleRemoveCourse}
                    />

                    {/* 下方：已選課程列表 (簡化為僅顯示) */}
                    <div style={{ marginTop: '20px', padding: '15px', borderTop: '1px solid #ccc' }}>
                        <h4>已選課程清單 ({selectedCourseIds.length} 門)</h4>
                        <ul>
                            {selectedCourseIds.map(id => {
                                const course = courseData[id];
                                return (
                                    <li key={id} onClick={() => handleRemoveCourse(id)} style={{ cursor: 'pointer', marginBottom: '5px' }}>
                                        {course.name} ({course.credit ?? course.credits}學分) - {course.teacher}
                                        <span style={{ color: 'red' }}> (點擊移除)</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Scheduler;