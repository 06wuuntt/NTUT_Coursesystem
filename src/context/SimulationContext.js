import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../components/ui/Toast';
import { PERIODS } from '../constants/periods';
import { standardizeCourse } from '../api/CourseService';

const SimulationContext = createContext();

export const useSimulation = () => {
    const context = useContext(SimulationContext);
    if (!context) {
        throw new Error('useSimulation must be used within a SimulationProvider');
    }
    return context;
};

// Helper: Check Conflicts
const checkConflicts = (grid, course) => {
    const conflictIds = new Set();
    if (!course.time) return conflictIds;

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
                if (grid[key]) conflictIds.add(grid[key]);
            }
        } else {
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

// Helper: Update Grid
const updateGrid = (currentGrid, courseData, selectedIds) => {
    const newGrid = {};
    selectedIds.forEach(id => {
        const course = courseData[id];
        if (!course) return;

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
    });
    return newGrid;
};

export const SimulationProvider = ({ children }) => {
    const { addToast } = useToast();

    // 1. State
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
            const normalized = {};
            Object.keys(parsed).forEach(key => {
                normalized[key] = standardizeCourse(parsed[key]);
            });
            return normalized;
        } catch (e) { return {}; }
    });

    const [grid, setGrid] = useState({});

    // 2. Sync to LocalStorage
    useEffect(() => {
        localStorage.setItem('simulation_selectedIds', JSON.stringify(selectedCourseIds));
    }, [selectedCourseIds]);

    useEffect(() => {
        localStorage.setItem('simulation_courseData', JSON.stringify(courseData));
    }, [courseData]);

    // 3. Rebuild Grid when data changes
    useEffect(() => {
        setGrid(updateGrid({}, courseData, selectedCourseIds));
    }, [selectedCourseIds, courseData]);

    // 4. Actions
    const addCourse = useCallback((rawCourse) => {
        const normalized = standardizeCourse(rawCourse);

        // Validation
        if (!normalized.time || normalized.time.length === 0) {
            addToast('此課程無固定時間，無法加入排課模擬器', 'warning');
            return false;
        }

        if (selectedCourseIds.includes(normalized.id)) {
            addToast('此課程已在排課模擬器中', 'info');
            return false;
        }

        // Conflict Check
        const conflictIds = checkConflicts(grid, normalized);
        if (conflictIds.size > 0) {
            const names = Array.from(conflictIds).map(id => {
                const c = courseData[id];
                if (!c) return `ID:${id}`;
                return (typeof c.name === 'string' ? c.name : c.name?.zh || c.name?.en || `ID:${id}`);
            });
            addToast(`衝堂：與已排課程衝突 (${names.join('、')})`, 'error');
            return false;
        }

        // Add
        setSelectedCourseIds(prev => [...prev, normalized.id]);
        setCourseData(prev => ({ ...prev, [normalized.id]: normalized }));
        addToast(`已加入課程：${normalized.name}`, 'success');
        return true;
    }, [selectedCourseIds, grid, courseData, addToast]);

    const removeCourse = useCallback((courseId) => {
        const idStr = String(courseId);
        setSelectedCourseIds(prev => prev.filter(id => String(id) !== idStr));
        setCourseData(prev => {
            const newData = { ...prev };
            delete newData[idStr];
            return newData;
        });
    }, []);

    const clearAll = useCallback(() => {
        setSelectedCourseIds([]);
        setCourseData({});
        addToast('已清空所有課程', 'info');
    }, [addToast]);

    // 5. Derived State (Credits)
    const credits = useMemo(() => {
        return selectedCourseIds.reduce((acc, id) => {
            const c = courseData[id];
            if (!c) return acc;

            const credit = c.credit || 0;
            acc.total += Number(credit);

            const type = c.courseType || '';
            if (['○', '△', '●', '▲'].some(sym => type.includes(sym)) || type.includes('必修')) {
                acc.required += Number(credit);
            } else if (['☆', '★'].some(sym => type.includes(sym)) || type.includes('選修')) {
                acc.elective += Number(credit);
            } else {
                acc.elective += Number(credit);
            }
            return acc;
        }, { total: 0, required: 0, elective: 0 });
    }, [selectedCourseIds, courseData]);

    const value = {
        selectedCourseIds,
        courseData,
        grid,
        credits,
        addCourse,
        removeCourse,
        clearAll,
        checkConflicts: (course) => checkConflicts(grid, standardizeCourse(course))
    };

    return (
        <SimulationContext.Provider value={value}>
            {children}
        </SimulationContext.Provider>
    );
};
