import React, { useState, useEffect, useRef } from 'react';
import TimeTable from './TimeTable';
import CourseSearchPanel from './CourseSearchPanel';

const styles = {
    containers: {
        margin: '0 auto',
        maxWidth: '1100px', // Allow full width for resizing
        padding: '0 20px',
        boxSizing: 'border-box',
    },
    container: {
        display: 'flex',
        height: 'calc(100vh - 80px)',
        marginTop: '20px',
        position: 'relative', // For absolute positioning if needed
    },
    leftPanel: (width) => ({
        width: `${width}px`,
        minWidth: '250px',
        maxWidth: '600px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        // transition: 'width 0.05s ease-out', // REMOVED: Transition causes lag during drag
    }),
    resizer: {
        width: '8px',
        cursor: 'col-resize',
        backgroundColor: 'transparent',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 10,
        margin: '0 4px',
        transition: 'background-color 0.2s',
    },
    resizerLine: {
        width: '2px',
        height: '40px',
        backgroundColor: '#CBD5E1',
        borderRadius: '1px',
    },
    rightPanel: {
        flexGrow: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        border: '1px solid #F1F5F9',
        overflow: 'hidden', // 讓內部 TimeTable 處理滾動
        display: 'flex',
        flexDirection: 'column',
        minWidth: '400px', // Prevent right panel from becoming too small
    },
    headerBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        maxWidth: '1200px', // Keep header centered/constrained
        margin: '0 auto 20px auto',
    },
    title: {
        fontSize: '40px',
        fontWeight: 'Bold'
    },
    subtitle: {
        fontSize: '14px',
        color: '#888888',
        marginBottom: '20px'
    },
    creditDisplay: {
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#0369A1',
        backgroundColor: '#E0F2FE',
        padding: '8px 16px',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    dragOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(241, 245, 249, 0.8)',
        backdropFilter: 'blur(4px)',
        border: '3px dashed #94A3B8',
        borderRadius: '16px',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    dragText: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#475569',
    },
    listContainer: {
        marginTop: 'auto',
        borderTop: '1px solid #F1F5F9',
        backgroundColor: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        height: '250px', // Fixed height for the list area
    },
    listHeader: {
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    clearButton: {
        padding: '6px 12px',
        fontSize: '0.85rem',
        color: '#EF4444',
        backgroundColor: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    courseList: {
        overflowY: 'auto',
        padding: '10px 20px',
        flexGrow: 1,
    },
    courseItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 12px',
        marginBottom: '8px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    removeButton: {
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        backgroundColor: '#F1F5F9',
        color: '#64748B',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '14px',
        marginLeft: '10px',
        transition: 'background-color 0.2s',
    },
    emptyState: {
        textAlign: 'center',
        color: '#94A3B8',
        padding: '30px',
        fontSize: '0.9rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
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

        // 若沒有 JSON，回退到單純的 ID lookup（舊有 mock 行為）
        const draggedCourseId = Number(e.dataTransfer.getData("courseId")) || (newCourse && Number(newCourse.id));

        if (!draggedCourseId || selectedCourseIds.includes(draggedCourseId)) {
            return; // 課程已存在或無效 ID
        }

        if (!newCourse) {
            // 如果沒有 JSON 且沒有 mock data，則無法還原課程資訊
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

    // 新增：清空所有課程
    const handleClearAll = () => {
        if (window.confirm('確定要清空所有已選課程嗎？')) {
            setSelectedCourseIds([]);
            setCourseData({});
            setGrid({});
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
        <div style={styles.containers}>
            <div style={styles.headerBar}>
                <div>
                    <div style={styles.title}>排課模擬器</div>
                    <div style={styles.subtitle}>拖曳左側課程至右側課表以進行模擬排課</div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ ...styles.creditDisplay, backgroundColor: '#F8FAFC', color: '#64748B', padding: '6px 14px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>必修</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155' }}>{credits.required}</span>
                    </div>
                    <div style={{ ...styles.creditDisplay, backgroundColor: '#F8FAFC', color: '#64748B', padding: '6px 14px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>選修</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155' }}>{credits.elective}</span>
                    </div>
                    <div style={styles.creditDisplay}>
                        <span>總學分</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>{credits.total}</span>
                    </div>
                </div>
            </div>

            <div style={styles.container} ref={containerRef}>
                {/* 左欄：課程搜尋與拖曳源 */}
                <div style={styles.leftPanel(leftWidth)} ref={leftPanelRef}>
                    <CourseSearchPanel addedCourseIds={selectedCourseIds} currentSemester={currentSemester} />
                </div>

                {/* Resizer Handle */}
                <div
                    style={{
                        ...styles.resizer,
                        backgroundColor: isResizing ? '#E2E8F0' : 'transparent'
                    }}
                    onMouseDown={startResizing}
                    title="拖曳調整寬度"
                >
                    <div style={styles.resizerLine} />
                </div>

                {/* 右欄：課表與放置目標 */}
                <div
                    style={styles.rightPanel}
                    onDragOver={(e) => e.preventDefault()} // 允許拖曳到課表區域
                    onDrop={handleDropOnTable}
                >
                    {/* 拖曳時的視覺回饋 */}
                    {isDragging && (
                        <div style={styles.dragOverlay}>
                            <span style={styles.dragText}>放開以加入課程</span>
                        </div>
                    )}

                    {/* 課表 */}
                    <TimeTable
                        scheduleGrid={grid}
                        courseData={courseData}
                        onRemoveCourse={handleRemoveCourse}
                    />

                    {/* 下方：已選課程列表 */}
                    <div style={styles.listContainer}>
                        <div style={styles.listHeader}>
                            <h4 style={{ margin: 0 }}>已選課程清單 ({selectedCourseIds.length})</h4>
                            {selectedCourseIds.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    style={styles.clearButton}
                                >
                                    全部刪除
                                </button>
                            )}
                        </div>
                        <div style={styles.courseList}>
                            {selectedCourseIds.length === 0 ? (
                                <div style={styles.emptyState}>尚未選擇任何課程</div>
                            ) : (
                                selectedCourseIds.map(id => {
                                    const course = courseData[id];
                                    return (
                                        <div key={id} style={styles.courseItem}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold' }}>{course.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                    {course.id} / {course.credit ?? course.credits}學分 / {course.teacher}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveCourse(id)}
                                                style={styles.removeButton}
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
