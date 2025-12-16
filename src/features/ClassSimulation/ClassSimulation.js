import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TimeTable from './TimeTable';
import CourseSearchPanel from './CourseSearchPanel';
import { PERIODS } from '../../constants/periods';
import { useToast } from '../../components/ui/Toast';
import './ClassSimulation.css';

// --- Helper Functions ---

/**
 * 正規化課程資料結構，確保欄位格式統一以避免錯誤
 * @param {object} c - 原始課程物件
 * @returns {object} 正規化後的課程物件
 */
const normalizeCourse = (c) => {
    const copy = { ...(c || {}) };

    // 1. 處理學分 (credit/credits/creditsTotal)
    copy.credit = Number(copy.credit ?? copy.credits ?? copy.creditsTotal ?? 0) || 0;
    copy.credits = copy.credit;

    // 2. 處理名稱 (可能為物件或字串)
    if (copy.name && typeof copy.name === 'object') {
        copy.name = (copy.name.zh || copy.name.en || '');
    }

    // 3. 處理時間 (確保為陣列且 period 為字串)
    if (Array.isArray(copy.time)) {
        copy.time = copy.time.map(t => ({
            day: Number(t.day),
            period: String(t.period)
        }));
    } else if (copy.time && typeof copy.time === 'object') {
        // 處理物件格式的時間 { 1: ['1', '2'], 2: ['3'] } 或 { mon: ['1'] }
        const newTime = [];
        const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

        for (const k in copy.time) {
            const dayIdx = (dayMap[k] !== undefined ? dayMap[k] : (Number(k) || null));
            if (!dayIdx) continue;

            const periods = copy.time[k];
            if (Array.isArray(periods)) {
                periods.forEach(p => {
                    newTime.push({ day: dayIdx, period: String(p) });
                });
            }
        }
        copy.time = newTime;
    } else {
        copy.time = [];
    }

    // 4. 處理教師 (可能為陣列或物件)
    if (Array.isArray(copy.teacher)) {
        copy.teacher = copy.teacher.map(t => (typeof t === 'object' ? (t.name || '') : t)).join('、');
    } else if (typeof copy.teacher === 'object' && copy.teacher !== null) {
        copy.teacher = copy.teacher.name || '';
    }

    // 5. 處理 ID (避免物件導致 crash)
    if (typeof copy.id === 'object' && copy.id !== null) {
        copy.id = String(copy.id);
    }

    return copy;
};

/**
 * 檢查課程時間是否與現有網格衝突
 * @param {object} grid - 當前網格 { 'day_period': courseId }
 * @param {object} course - 欲加入的課程 (已正規化)
 * @returns {Set} 衝突的課程 ID 集合
 */
const checkConflicts = (grid, course) => {
    const conflictIds = new Set();

    course.time.forEach(t => {
        const parts = String(t.period).split('-');
        const startStr = parts[0];
        const endStr = parts[1] || startStr;

        const startIndex = PERIODS.findIndex(p => String(p.id) === String(startStr));
        const endIndex = PERIODS.findIndex(p => String(p.id) === String(endStr));

        if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
            // 標準節次範圍
            for (let i = startIndex; i <= endIndex; i++) {
                const periodId = PERIODS[i].id;
                const key = `${t.day}_${periodId}`;
                if (grid[key]) conflictIds.add(grid[key]);
            }
        } else {
            // 非標準節次或直接數值 fallback
            const [start, end] = String(t.period).split('-').map(Number);
            if (!isNaN(start)) {
                for (let p = start; p <= (end || start); p++) {
                    const key = `${t.day}_${p}`;
                    if (grid[key]) conflictIds.add(grid[key]);
                }
            } else {
                const key = `${t.day}_${t.period}`;
                if (grid[key]) conflictIds.add(grid[key]);
            }
        }
    });

    return conflictIds;
};

/**
 * 將課程加入網格
 * @param {object} grid - 當前網格
 * @param {object} course - 課程資料
 * @returns {object} 新的網格
 */
const updateGrid = (grid, course) => {
    const newGrid = { ...grid };
    course.time.forEach(t => {
        const parts = String(t.period).split('-');
        const startStr = parts[0];
        const endStr = parts[1] || startStr;

        const startIndex = PERIODS.findIndex(p => String(p.id) === String(startStr));
        const endIndex = PERIODS.findIndex(p => String(p.id) === String(endStr));

        if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
            for (let i = startIndex; i <= endIndex; i++) {
                const periodId = PERIODS[i].id;
                const key = `${t.day}_${periodId}`;
                newGrid[key] = course.id;
            }
        } else {
            const [start, end] = String(t.period).split('-').map(Number);
            if (!isNaN(start)) {
                for (let p = start; p <= (end || start); p++) {
                    const key = `${t.day}_${p}`;
                    newGrid[key] = course.id;
                }
            } else {
                const key = `${t.day}_${t.period}`;
                newGrid[key] = course.id;
            }
        }
    });
    return newGrid;
};

// --- Main Component ---

const Scheduler = ({ currentSemester }) => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState('timetable');

    // State Initialization
    const [selectedCourseIds, setSelectedCourseIds] = useState(() => {
        try {
            const saved = localStorage.getItem('simulation_selectedIds');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const [courseData, setCourseData] = useState(() => {
        try {
            const saved = localStorage.getItem('simulation_courseData');
            const parsed = saved ? JSON.parse(saved) : {};
            // 載入時立即正規化所有課程資料，避免舊資料導致 crash
            const normalized = {};
            Object.keys(parsed).forEach(key => {
                normalized[key] = normalizeCourse(parsed[key]);
            });
            return normalized;
        } catch (e) { return {}; }
    });

    const [grid, setGrid] = useState({});
    const [isDragging, setIsDragging] = useState(false);

    // Resizable Panel State
    const [leftWidth, setLeftWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef(null);
    const leftPanelRef = useRef(null);

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem('simulation_selectedIds', JSON.stringify(selectedCourseIds));
    }, [selectedCourseIds]);

    useEffect(() => {
        localStorage.setItem('simulation_courseData', JSON.stringify(courseData));
    }, [courseData]);

    // Grid Reconstruction Effect
    useEffect(() => {
        let newGrid = {};
        selectedCourseIds.forEach(id => {
            const course = courseData[id];
            if (course) {
                // 確保從 storage 讀出的資料也是安全的
                const safeCourse = normalizeCourse(course);
                newGrid = updateGrid(newGrid, safeCourse);
            }
        });
        setGrid(newGrid);
    }, [selectedCourseIds, courseData]);

    // Drag & Drop Handlers
    const handleDropOnTable = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        // 1. 解析資料
        const rawJson = e.dataTransfer.getData('application/json');
        let newCourse = null;
        try {
            if (rawJson) newCourse = JSON.parse(rawJson);
        } catch (err) { /* ignore */ }

        const draggedCourseId = Number(e.dataTransfer.getData('courseId')) || (newCourse && Number(newCourse.id));

        // 2. 基本驗證
        if (!draggedCourseId || selectedCourseIds.includes(draggedCourseId)) return;
        if (!newCourse) return; // 必須有完整資料才能加入

        // 3. 正規化與完整性檢查
        const normalizedCourse = normalizeCourse(newCourse);
        if (normalizedCourse.time.length === 0) {
            addToast('此課程無固定上課時間，無法排入課表！', 'warning');
            return;
        }

        // 4. 衝突檢查
        const conflictIds = checkConflicts(grid, normalizedCourse);
        if (conflictIds.size > 0) {
            const names = Array.from(conflictIds).map(id => {
                const c = courseData[id];
                // 嘗試獲取名稱，處理各種可能的格式
                if (!c) return `ID:${id}`;
                if (typeof c.name === 'string') return c.name;
                if (typeof c.name === 'object') return c.name.zh || c.name.en || `ID:${id}`;
                return `ID:${id}`;
            });
            addToast(`衝堂：與已排課程衝突 (${names.join('、')})`, 'error');
            return;
        }

        // 5. 更新狀態
        setSelectedCourseIds(prev => [...prev, draggedCourseId]);
        setCourseData(prev => ({ ...prev, [draggedCourseId]: normalizedCourse }));
        addToast(`已加入課程：${normalizedCourse.name}`, 'success');
    }, [selectedCourseIds, grid, courseData, addToast]);

    // 新增：直接加入課程 (給手機版按鈕使用)
    const handleAddCourse = useCallback((course) => {
        const courseId = Number(course.id);
        if (selectedCourseIds.includes(courseId)) {
            addToast('此課程已在課表中', 'warning');
            return;
        }

        const normalizedCourse = normalizeCourse(course);
        if (normalizedCourse.time.length === 0) {
            addToast('此課程無固定上課時間，無法排入課表！', 'warning');
            return;
        }

        const conflictIds = checkConflicts(grid, normalizedCourse);
        if (conflictIds.size > 0) {
            const names = Array.from(conflictIds).map(id => {
                const c = courseData[id];
                if (!c) return `ID:${id}`;
                if (typeof c.name === 'string') return c.name;
                if (typeof c.name === 'object') return c.name.zh || c.name.en || `ID:${id}`;
                return `ID:${id}`;
            });
            addToast(`衝堂：與已排課程衝突 (${names.join('、')})`, 'error');
            return;
        }

        setSelectedCourseIds(prev => [...prev, courseId]);
        setCourseData(prev => ({ ...prev, [courseId]: normalizedCourse }));
        addToast(`已加入課程：${normalizedCourse.name}`, 'success');
    }, [selectedCourseIds, grid, courseData, addToast]);

    const handleRemoveCourse = useCallback((courseIdToRemove) => {
        setSelectedCourseIds(prev => prev.filter(id => id !== courseIdToRemove));
        setCourseData(prev => {
            const newCourses = { ...prev };
            delete newCourses[courseIdToRemove];
            return newCourses;
        });
    }, []);

    const handleClearAll = useCallback(() => {
        if (window.confirm('確定要清空所有已選課程嗎？')) {
            setSelectedCourseIds([]);
            setCourseData({});
            addToast('已清空所有課程', 'info');
        }
    }, [addToast]);

    // Credit Calculation
    const credits = useMemo(() => {
        return selectedCourseIds.reduce((acc, id) => {
            const c = courseData[id];
            if (!c) return acc;

            const credit = (c.credit ?? c.credits ?? 0);
            acc.total += credit;

            const type = c.courseType || '';
            if (['○', '△', '●', '▲'].some(sym => type.includes(sym)) || type.includes('必修')) {
                acc.required += credit;
            } else if (['☆', '★'].some(sym => type.includes(sym)) || type.includes('選修')) {
                acc.elective += credit;
            } else {
                acc.elective += credit;
            }
            return acc;
        }, { total: 0, required: 0, elective: 0 });
    }, [selectedCourseIds, courseData]);

    // Global Drag Listeners
    useEffect(() => {
        const handleGlobalDragStart = () => setIsDragging(true);
        const handleGlobalDragEnd = () => setIsDragging(false);
        window.addEventListener('dragstart', handleGlobalDragStart);
        window.addEventListener('dragend', handleGlobalDragEnd);
        return () => {
            window.removeEventListener('dragstart', handleGlobalDragStart);
            window.removeEventListener('dragend', handleGlobalDragEnd);
        };
    }, []);

    // Resizing Logic
    const startResizing = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e) => {
        if (isResizing && containerRef.current && leftPanelRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;

            requestAnimationFrame(() => {
                if (newWidth >= 250 && newWidth <= 600) {
                    leftPanelRef.current.style.width = `${newWidth}px`;
                    setLeftWidth(newWidth);
                }
            });
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    return (
        <div className="simulation-containers">
            <div className="simulation-header-bar">
                <div>
                    <div className="simulation-title">排課模擬器</div>
                    <div className="simulation-subtitle">
                        <span className="simulation-subtitle-desktop">拖曳左側課程至右側課表以進行模擬排課</span>
                        <span className="simulation-subtitle-mobile">加入課程來模擬課表</span>
                    </div>
                </div>
            </div>

            <div className="simulation-mobile-tabs">
                <button
                    className={`simulation-mobile-tab ${activeTab === 'search' ? 'active' : ''}`}
                    onClick={() => setActiveTab('search')}
                >
                    課程搜尋
                </button>
                <button
                    className={`simulation-mobile-tab ${activeTab === 'timetable' ? 'active' : ''}`}
                    onClick={() => setActiveTab('timetable')}
                >
                    模擬課表
                </button>
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
                {/* Left Panel */}
                <div
                    className={`simulation-left-panel ${activeTab === 'search' ? 'mobile-active' : 'mobile-hidden'}`}
                    style={{ width: `${leftWidth}px` }}
                    ref={leftPanelRef}
                >
                    <CourseSearchPanel
                        addedCourseIds={selectedCourseIds}
                        currentSemester={currentSemester}
                        onAddCourse={handleAddCourse}
                    />
                </div>

                {/* Resizer */}
                <div
                    className={`simulation-resizer ${isResizing ? 'resizing' : ''}`}
                    onMouseDown={startResizing}
                    title="拖曳調整寬度"
                >
                    <div className="simulation-resizer-line" />
                </div>

                {/* Right Panel */}
                <div
                    className={`simulation-right-panel ${activeTab === 'timetable' ? 'mobile-active' : 'mobile-hidden'}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropOnTable}
                >
                    {isDragging && (
                        <div className="simulation-drag-overlay">
                            <span className="simulation-drag-text">放開以加入課程</span>
                        </div>
                    )}

                    <TimeTable
                        scheduleGrid={grid}
                        courseData={courseData}
                        onRemoveCourse={handleRemoveCourse}
                    />

                    <div className="simulation-list-container">
                        <div className="simulation-list-header">
                            <h4>已選課程清單 ({selectedCourseIds.length})</h4>
                            {selectedCourseIds.length > 0 && (
                                <button onClick={handleClearAll} className="simulation-clear-button">
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
                                    // 安全顯示名稱
                                    const displayName = course
                                        ? (typeof course.name === 'object' ? (course.name.zh || course.name.en) : course.name)
                                        : '未知課程';

                                    return (
                                        <div key={id} className="simulation-course-item">
                                            <div className="simulation-course-info">
                                                <div className="simulation-course-name">{displayName}</div>
                                                <div className="simulation-course-details">
                                                    {course?.id} / {course?.credit ?? course?.credits}學分 / {course?.teacher}
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