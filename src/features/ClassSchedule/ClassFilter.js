import React, { useState, useEffect, useMemo } from 'react';
import SelectInput from '../../components/forms/SelectInput';
import Loader from '../../components/ui/Loader';
import { fetchDepartmentClasses } from '../../api/CourseService';
import './ClassFilter.css';

/**
 * 班級篩選器：處理系所和班級的兩層連動選擇
 * @param {string} currentSemester - 從父組件傳入的學期 ID
 * @param {function} onFilterChange - 當班級選定時回傳班級唯一 ID
 */

const ClassFilter = ({ onFilterChange, currentSemester, initialClassId }) => {
    // *** 新增狀態：追蹤三層選擇 ***
    const [selectedCategory, setSelectedCategory] = useState(''); // 新增類別
    const [selectedDeptName, setSelectedDeptName] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');

    // 新增狀態：儲存 API 獲取的原始系所清單
    const [departmentsData, setDepartmentsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- 獲取系所班級選項 (當學期改變時觸發) ---
    useEffect(() => {
        if (!currentSemester) return;
        setLoading(true);
        setError(null);

        async function loadDepartments() {
            try {
                const data = await fetchDepartmentClasses(currentSemester);
                setDepartmentsData(data);

                // 如果有初始值，嘗試還原狀態
                if (initialClassId) {
                    let found = false;
                    // 遍歷所有系所尋找該班級
                    for (const dept of data) {
                        const targetClass = dept.classes.find(c => c.id === initialClassId);
                        if (targetClass) {
                            setSelectedCategory(dept.category);
                            setSelectedDeptName(dept.name);
                            setSelectedClassId(initialClassId);
                            found = true;
                            break;
                        }
                    }

                    // 如果找不到初始班級 (可能換學期了)，則重置
                    if (!found) {
                        setSelectedCategory('');
                        setSelectedDeptName('');
                        setSelectedClassId('');
                        onFilterChange(null);
                    }
                } else {
                    // 沒有初始值，重設所有選擇
                    setSelectedCategory('');
                    setSelectedDeptName('');
                    setSelectedClassId('');
                    onFilterChange(null);
                }
            } catch (err) {
                setError(`載入篩選器選項失敗: ${err.message}`);
                setDepartmentsData([]);
            } finally {
                setLoading(false);
            }
        }
        loadDepartments();
        // Note: do NOT include `onFilterChange` in deps — its identity may change and
        // cause this effect to re-run and clear user selection unexpectedly.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSemester]); // Remove initialClassId from deps to prevent re-run when parent updates it back

    // --- 篩選邏輯 ---

    // 1. 取得所有不重複的 Category 選項
    const categories = Array.from(new Set(departmentsData.map(d => d.category))).filter(c => c); // 移除空值
    const categoryOptions = categories.map(c => ({ value: c, label: c }));

    // 2. 篩選出選定 Category 下的所有系所
    const filteredDepartments = departmentsData.filter(d => d.category === selectedCategory);
    const deptOptions = filteredDepartments.map(d => ({ value: d.name, label: d.name }));

    // 3. 篩選出選定系所下的所有班級
    const selectedDepartment = filteredDepartments.find(d => d.name === selectedDeptName);
    const classes = selectedDepartment?.classes || [];
    // 注意: class.id 是我們在 API 層構建的唯一 ID，class.label 是班級名稱
    const classOptions = classes.map(c => ({
        value: c.id, // e.g., '電機系-電機二乙'
        label: c.label,
        classCode: c.classCode // 新增 classCode 以供回傳
    }));


    // --- 處理函數 ---

    // 處理類別變動
    const handleCategoryChange = (e) => {
        const newCategory = e.target.value;
        setSelectedCategory(newCategory);
        setSelectedDeptName(''); // 重設系所和班級
        setSelectedClassId('');
        onFilterChange(null);
    };

    // 處理系所變動
    const handleDeptChange = (e) => {
        setSelectedDeptName(e.target.value);
        setSelectedClassId(''); // 重設班級
        onFilterChange(null);
    };

    // 處理班級變動
    const handleClassChange = (e) => {
        const selectedId = e.target.value;
        setSelectedClassId(selectedId);

        // 找出被選定的班級物件
        const selectedClass = classes.find(c => c.id === selectedId || String(c.classCode ?? '') === selectedId);


        // 傳回 class.id（數字代碼）給父元件，供後端以代碼精確比對
        const valueToReturn = String(selectedId);
        onFilterChange(valueToReturn);
    };

    // 確保當上層篩選變動時，下層選單的值是清空的
    useEffect(() => {
        if (selectedDeptName && !filteredDepartments.some(d => d.name === selectedDeptName)) {
            setSelectedDeptName('');
            setSelectedClassId('');
            onFilterChange(null);
        }
        if (selectedClassId && !classes.some(c => c.id === selectedClassId)) {
            setSelectedClassId('');

            // NOTE: avoid calling onFilterChange(null) here to prevent transient clearing
            // Parent will only be cleared when department changes or user explicitly clears selection
        }
    }, [selectedCategory, selectedDeptName, selectedClassId, filteredDepartments, classes, onFilterChange]);


    if (loading) return <Loader />;
    if (error) return <div className="class-filter-error">⚠️ {error}</div>;


    return (
        <div className="class-filter-container">
            {/* 1. 類別篩選 */}
            <div className="class-filter-block">
                <SelectInput
                    label="學院"
                    name="category"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    options={categoryOptions}
                />
            </div>

            {/* 2. 系所篩選 */}
            <div className="class-filter-block">
                <SelectInput
                    label="系所"
                    name="department"
                    value={selectedDeptName}
                    onChange={handleDeptChange}
                    options={deptOptions}
                    disabled={!selectedCategory}
                />
            </div>

            {/* 3. 班級篩選 */}
            <div className="class-filter-block">
                <SelectInput
                    label="班級"
                    name="class"
                    value={selectedClassId}
                    onChange={handleClassChange}
                    options={classOptions}
                    disabled={!selectedDeptName}
                />
            </div>
        </div>
    );
};

export default ClassFilter;