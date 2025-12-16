import React, { useState, useEffect, useRef } from 'react';
import TimeTable from './TimeTable';
import CourseSearchPanel from './CourseSearchPanel';
import { PERIODS } from '../../constants/periods';
import './ClassSimulation.css';

/**
 * 將課程加入課表後，更新網格佔用情況
 * @param {object} grid - 當前網格
 * @param {object} course - 要加入的課程資料
 * @returns {object} 新的網格
 */
const updateGrid = (grid, course) => {
    const newGrid = { ...grid };
    course.time.forEach(t => {
        const parts = String(t.period).split('-');
        const startStr = parts[0];
        const endStr = parts[1] || startStr;

        // Find indices in PERIODS array
        const startIndex = PERIODS.findIndex(p => String(p.id) === String(startStr));
        const endIndex = PERIODS.findIndex(p => String(p.id) === String(endStr));

        if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
            for (let i = startIndex; i <= endIndex; i++) {
                const periodId = PERIODS[i].id;
                const key = `${t.day}_${periodId}`;
                newGrid[key] = course.id;
            }
        } else {
            // Fallback for simple numeric calculation if not found in PERIODS (backward compatibility)
            // or if it's a single period not in PERIODS (unlikely but safe to keep)
            const [start, end] = t.period.split('-').map(Number);
            if (!isNaN(start)) {
                for (let p = start; p <= (end || start); p++) {
                    const key = `${t.day}_${p}`;
                    newGrid[key] = course.id;
                }
            } else {
                // Single non-numeric period fallback
                const key = `${t.day}_${t.period}`;
                newGrid[key] = course.id;
            }
        }
    });
    return newGrid;
};

/**
 * 排課模擬器主頁面
 */
const Scheduler = ({ currentSemester }) => {
    const [selectedCourseIds, setSelectedCourseIds] = useState(() => {
        try {
            const saved = localStorage.getItem('simulation_selectedIds');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [courseData, setCourseData] = useState(() => {
        try {
            const saved = localStorage.getItem('simulation_courseData');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }); // { 202: {name: '資料結構', ...} }
    const [grid, setGrid] = useState({}); // { '1_3': 202, '3_1': 202, ... }

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('simulation_selectedIds', JSON.stringify(selectedCourseIds));
    }, [selectedCourseIds]);

    useEffect(() => {
        localStorage.setItem('simulation_courseData', JSON.stringify(courseData));
    }, [courseData]);

    // Rebuild grid when data changes
    useEffect(() => {
        let newGrid = {};
        selectedCourseIds.forEach(id => {
            const course = courseData[id];
            if (course) {
                newGrid = updateGrid(newGrid, course);
            }
        });
        setGrid(newGrid);
    }, [selectedCourseIds, courseData]);

    const [isDragging, setIsDragging] = useState(false); // 追蹤是否正在拖曳

    // Resizable Panel State
    const [leftWidth, setLeftWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef(null);
    const leftPanelRef = useRef(null); // Ref for direct DOM manipulation

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

        // 若沒有 JSON，回退到單純的 ID lookup
        const draggedCourseId = Number(e.dataTransfer.getData("courseId")) || (newCourse && Number(newCourse.id));

        if (!draggedCourseId || selectedCourseIds.includes(draggedCourseId)) {
            return; // 課程已存在或無效 ID
        }

        if (!newCourse) {
            // 如果沒有 JSON，則無法還原課程資訊
            // 這裡假設拖曳來源一定會提供 JSON
            return;
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
                return `ID:${id}`;
            });
            alert(`衝堂：欲加入的課程與已排課衝突，無法加入。衝突課程：${names.join('、')}`);
            return;
        }

        // TODO: 在此處加入更複雜的時間衝突檢查邏輯

        // 更新狀態（使用正規化後的 newCourse）
        setSelectedCourseIds(prev => [...prev, draggedCourseId]);
        setCourseData(prev => ({ ...prev, [draggedCourseId]: newCourse }));
    };

    // 2. 移除課程處理 (從課表點擊或下方列表移除)
    const handleRemoveCourse = (courseIdToRemove) => {
        // 從 ID 列表移除
        setSelectedCourseIds(prev => prev.filter(id => id !== courseIdToRemove));

        // 從 Data 移除（同步計算新的 courseData）
        setCourseData(prev => {
            const newCourses = { ...prev };
            delete newCourses[courseIdToRemove];
            return newCourses;
        });
    };

    // 新增：清空所有課程
    const handleClearAll = () => {
        if (window.confirm('確定要清空所有已選課程嗎？')) {
            setSelectedCourseIds([]);
            setCourseData({});
        }
    };

    // 3. 計算各類學分數
    const credits = selectedCourseIds.reduce((acc, id) => {
        const c = courseData[id];
        if (!c) return acc;

        const credit = (c.credit ?? c.credits ?? 0);
        acc.total += credit;

        const type = c.courseType || '';
        // Required: ○, △, ●, ▲ or contains '必修'
        if (['○', '△', '●', '▲'].some(sym => type.includes(sym)) || type.includes('必修')) {
            acc.required += credit;
        }
        // Elective: ☆, ★ or contains '選修'
        else if (['☆', '★'].some(sym => type.includes(sym)) || type.includes('選修')) {
            acc.elective += credit;
        }
        else {
            // Default fallback
            acc.elective += credit;
        }

        return acc;
    }, { total: 0, required: 0, elective: 0 });

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

    // Resizing Logic
    const startResizing = React.useCallback((mouseDownEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = React.useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = React.useCallback((mouseMoveEvent) => {
        if (isResizing && containerRef.current && leftPanelRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const clientX = mouseMoveEvent.clientX;

            requestAnimationFrame(() => {
                const newWidth = clientX - containerRect.left;
                // Constraints
                if (newWidth >= 250 && newWidth <= 600) {
                    // Direct DOM manipulation for performance
                    leftPanelRef.current.style.width = `${newWidth}px`;
                    // We can update state on mouse up if needed, but for now let's just keep it visual
                    // Or update state debounced? No, let's just update state on stopResizing if we want persistence.
                    // For now, let's update state as well but maybe it's fine since we removed transition.
                    // Actually, if we update state, we trigger re-render.
                    // Let's TRY to update state because React needs to know.
                    // But the key fix is removing the transition property in styles.
                    setLeftWidth(newWidth);
                }
            });
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    return (
        <div className="simulation-containers">
            <div className="simulation-header-bar">
                <div>
                    <div className="simulation-title">排課模擬器</div>
                    <div className="simulation-subtitle">拖曳左側課程至右側課表以進行模擬排課</div>
                </div>
            </div>

            <div className="simulation-credits-container">
                <div className="simulation-credits-wrapper">
                    <div className="simulation-credit-display required">
                        <span className="simulation-credit-label">必修</span>
                        <span className="simulation-credit-value">{credits.required}</span>
                    </div>
                    <div className="simulation-credit-display elective">
                        <span className="simulation-credit-label">選修</span>
                        <span className="simulation-credit-value">{credits.elective}</span>
                    </div>
                    <div className="simulation-credit-display">
                        <span>總學分</span>
                        <span className="simulation-credit-total-value">{credits.total}</span>
                    </div>
                </div>
            </div>

            <div className="simulation-container" ref={containerRef}>
                {/* 左欄：課程搜尋與拖曳源 */}
                <div
                    className="simulation-left-panel"
                    style={{ width: `${leftWidth}px` }}
                    ref={leftPanelRef}
                >
                    <CourseSearchPanel addedCourseIds={selectedCourseIds} currentSemester={currentSemester} />
                </div>

                {/* Resizer Handle */}
                <div
                    className={`simulation-resizer ${isResizing ? 'resizing' : ''}`}
                    onMouseDown={startResizing}
                    title="拖曳調整寬度"
                >
                    <div className="simulation-resizer-line" />
                </div>

                {/* 右欄：課表與放置目標 */}
                <div
                    className="simulation-right-panel"
                    onDragOver={(e) => e.preventDefault()} // 允許拖曳到課表區域
                    onDrop={handleDropOnTable}
                >
                    {/* 拖曳時的視覺回饋 */}
                    {isDragging && (
                        <div className="simulation-drag-overlay">
                            <span className="simulation-drag-text">放開以加入課程</span>
                        </div>
                    )}

                    {/* 課表 */}
                    <TimeTable
                        scheduleGrid={grid}
                        courseData={courseData}
                        onRemoveCourse={handleRemoveCourse}
                    />

                    {/* 下方：已選課程列表 */}
                    <div className="simulation-list-container">
                        <div className="simulation-list-header">
                            <h4>已選課程清單 ({selectedCourseIds.length})</h4>
                            {selectedCourseIds.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="simulation-clear-button"
                                >
                                    全部刪除
                                </button>
                            )}
                        </div>
                        <div className="simulation-course-list">
                            {selectedCourseIds.length === 0 ? (
                                <div className="simulation-empty-state">尚未選擇任何課程</div>
                            ) : (
                                selectedCourseIds.map(id => {
                                    const course = courseData[id];
                                    return (
                                        <div key={id} className="simulation-course-item">
                                            <div className="simulation-course-info">
                                                <div className="simulation-course-name">{course.name}</div>
                                                <div className="simulation-course-details">
                                                    {course.id} / {course.credit ?? course.credits}學分 / {course.teacher}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveCourse(id)}
                                                className="simulation-remove-button"
                                                title="移除此課程"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Scheduler;
