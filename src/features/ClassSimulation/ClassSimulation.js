import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import TimeTable from './TimeTable';
import CourseSearchPanel from './CourseSearchPanel';
import SelectedCoursesList from './SelectedCoursesList';
import { useToast } from '../../components/ui/Toast';
import { useSimulation } from '../../context/SimulationContext';
import './ClassSimulation.css';

// --- Main Component ---

const Scheduler = ({ currentSemester }) => {
    const { addToast } = useToast();
    const {
        selectedCourseIds,
        courseData,
        grid,
        credits,
        addCourse,
        removeCourse,
        clearAll
    } = useSimulation(); // Use Context

    const [activeTab, setActiveTab] = useState('timetable');
    const [isDragging, setIsDragging] = useState(false);

    // Resizable Panel State
    const [leftWidth, setLeftWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef(null);
    const leftPanelRef = useRef(null);
    const timetableRef = useRef(null);

    // NOTE: Initialization, persistence, grid reconstruction, and credit calculation 
    // are now handled by SimulationProvider.

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

        // 3. 委派 Context 處理加入邏輯 (含驗證、衝堂檢查、正規化)
        addCourse(newCourse);

    }, [selectedCourseIds, addCourse]);

    // 新增：直接加入課程 (給手機版按鈕使用)
    const handleAddCourse = useCallback((course) => {
        addCourse(course);
    }, [addCourse]);

    const handleRemoveCourse = useCallback((courseIdToRemove) => {
        removeCourse(courseIdToRemove);
    }, [removeCourse]);

    const handleClearAll = useCallback(() => {
        clearAll();
    }, [clearAll]);

    // Export Function
    const handleExport = useCallback(async () => {
        const elementToCapture = timetableRef.current?.querySelector('.simulation-timetable-container') || timetableRef.current;
        if (!elementToCapture) return;

        addToast('正在匯出課表...', 'info');

        // Use setTimeout to allow the Toast to render before the main thread freezes
        setTimeout(async () => {
            try {
                const canvas = await html2canvas(elementToCapture, {
                    scale: 2, // High resolution
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true,
                    // Use onclone to modify the cloned document before capturing
                    onclone: (clonedDoc) => {
                        // 1. Force Mobile Width (390px)
                        const container = clonedDoc.querySelector('.simulation-timetable-container');
                        if (container) {
                            container.style.width = '390px';
                            container.style.padding = '4px';
                            container.style.height = 'auto';
                            container.style.overflow = 'visible';
                            container.style.borderRadius = '0';
                        }

                        // 2. Adjust Grid Column Widths for Mobile
                        const grid = clonedDoc.querySelector('.simulation-timetable-grid-container');
                        if (grid) {
                            // Shrink the time column to 25px by replacing the hardcoded 60px
                            // Note: We access the inline style directly or computed style if needed.
                            // Since TimeTable.js writes inline gridTemplateColumns, we can modify it.
                            if (grid.style.gridTemplateColumns) {
                                grid.style.gridTemplateColumns = grid.style.gridTemplateColumns.replace('60px', '25px');
                            }
                            grid.style.gap = '1px';
                            grid.style.padding = '1px';
                            grid.style.width = '100%';
                        }

                        // 3. Adjust Font Sizes for Legibility
                        clonedDoc.querySelectorAll('.simulation-timetable-header-cell').forEach(el => {
                            el.style.fontSize = '12px';
                            el.style.padding = '4px 0';
                            el.style.minHeight = '30px';
                        });
                        clonedDoc.querySelectorAll('.simulation-timetable-time-cell').forEach(el => {
                            el.style.fontSize = '10px';
                            el.style.minHeight = '40px';
                            el.style.padding = '0';
                        });
                        clonedDoc.querySelectorAll('.simulation-timetable-course-cell').forEach(el => {
                            el.style.minHeight = '40px';
                        });


                        // 4. Style Cards (Solid Color & Small Text)
                        const clonedCards = clonedDoc.querySelectorAll('[data-export-target="card"]');
                        clonedCards.forEach(card => {
                            card.style.fontSize = '10px';
                            card.style.padding = '2px';
                            card.style.borderRadius = '4px';
                            card.style.border = 'none';
                        });
                    }
                });

                const link = document.createElement('a');
                link.download = `schedule-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                addToast('匯出成功！', 'success');

            } catch (error) {
                console.error('Export failed:', error);
                addToast('匯出失敗，請稍後再試', 'error');
            }
        }, 100);
    }, [addToast]);

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
        <div className="page-container simulation-containers">
            <div className="simulation-header-bar">
                <div>
                    <div className="page-title">排課模擬器</div>
                    <div className="page-subtitle">
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
                    <div className="simulation-credit-display">
                        <span className="simulation-credit-label">必修</span>
                        <span className="simulation-credit-value">{credits.required}</span>
                    </div>
                    <div className="simulation-credit-display">
                        <span className="simulation-credit-label">選修</span>
                        <span className="simulation-credit-value">{credits.elective}</span>
                    </div>
                    <div className="simulation-credit-display">
                        <span className="simulation-credit-label">總學分</span>
                        <span className="simulation-credit-value">{credits.total}</span>
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

                    <div className="simulation-timetable-section" ref={timetableRef}>
                        <TimeTable
                            scheduleGrid={grid}
                            courseData={courseData}
                            onRemoveCourse={handleRemoveCourse}
                        />
                    </div>

                    <div className="simulation-courselist-section">
                        <SelectedCoursesList
                            addedCoursesData={courseData}
                            onRemoveCourse={handleRemoveCourse}
                            onClearAll={handleClearAll}
                            onExport={handleExport}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Scheduler;
