import React, { useState, useEffect, useMemo } from 'react';
import { fetchCourseStandards, fetchStandardsDepartments } from '../../api/CourseService';
import StandardSearchForm from './StandardSearchForm';
import StandardResults from './StandardResults';

const styles = {
  container: {
    margin: '0 auto',
    padding: '0 20px',
    maxWidth: '1100px',
  },
  error: {
    padding: '16px',
    backgroundColor: '#FEF2F2',
    color: '#EF4444',
    borderRadius: '8px',
    textAlign: 'center',
    marginTop: '20px',
    border: '1px solid #FECACA',
  }
};

const CourseStandards = ({ currentSemester, semesterOptions = [] }) => {
  const yearOptions = useMemo(() => {
    const years = new Set();
    (semesterOptions || []).forEach(s => {
      const year = String(s.value).split('-')[0];
      if (year) years.add(year);
    });
    return Array.from(years)
      .sort((a, b) => Number(b) - Number(a))
      .map(y => ({ value: y, label: `${y} 學年度` }));
  }, [semesterOptions]);

  // 預設不選取任何年份，讓使用者自行選擇
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [standards, setStandards] = useState(null);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [fullStandardsData, setFullStandardsData] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState('');

  useEffect(() => {
    async function loadDepartmentOptions() {
      if (!selectedYear) {
        setDepartmentOptions([]);
        setFullStandardsData(null);
        setLoadingOptions(false);
        return;
      }

      setLoadingOptions(true);
      setError('');

      try {
        const { departmentOptions: depts, fullData } = await fetchStandardsDepartments(selectedYear);
        setDepartmentOptions(depts || []);
        setFullStandardsData(fullData || null);
        setSelectedProgram('');
        setSelectedDeptId('');
        setStandards(null);
      } catch (err) {
        setError(`載入系所選項失敗: ${err.message}`);
        setDepartmentOptions([]);
        setFullStandardsData(null);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadDepartmentOptions();
  }, [selectedYear]);

  // 由 fullStandardsData 或 departmentOptions 產生學程 (括號內的學程) 選項
  const programOptions = useMemo(() => {
    if (!fullStandardsData) return [];
    return Object.keys(fullStandardsData).map(p => ({ value: p, label: p }));
  }, [fullStandardsData]);

  useEffect(() => {
    async function loadStandards() {
      if (!selectedYear || !selectedDeptId) return;
      setIsLoading(true);
      setError('');
      try {
        const result = await fetchCourseStandards(selectedYear, selectedDeptId, fullStandardsData);
        setStandards(result);
      } catch (err) {
        setError(`載入課程標準失敗: ${err.message}`);
        setStandards(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadStandards();
  }, [selectedYear, selectedDeptId, fullStandardsData]);

  // Note: manual search button removed. Standards auto-load when year+department selected.

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'year') {
      setSelectedYear(value);
    } else if (name === 'program') {
      setSelectedProgram(value);
      // reset department selection when program changes
      setSelectedDeptId('');
    } else if (name === 'department') {
      setSelectedDeptId(value);
    }
    setStandards(null);
    setError('');
  };

  const currentDeptLabel = departmentOptions.find(d => d.value === selectedDeptId)?.label || '';
  const currentYearLabel = yearOptions.find(y => y.value === selectedYear)?.label || selectedYear;

  return (
    <div style={styles.container}>
      <div style={{ fontSize: '40px', fontWeight: 'Bold' }}>課程標準</div>
      <div style={{ fontSize: '14px', color: '#888888', marginBottom: '70px' }}>查看各系所的課程規劃與學分要求</div>

      <StandardSearchForm
        selectedYear={selectedYear}
        selectedProgram={selectedProgram}
        selectedDeptId={selectedDeptId}
        yearOptions={yearOptions}
        programOptions={programOptions}
        departmentOptions={departmentOptions}
        loadingOptions={loadingOptions}
        onChange={handleChange}
      />

      {error && <div style={styles.error}>{error}</div>}

      <StandardResults
        standards={standards}
        currentYearLabel={currentYearLabel}
        currentDeptLabel={currentDeptLabel}
      />
    </div>
  );
};

export default CourseStandards;