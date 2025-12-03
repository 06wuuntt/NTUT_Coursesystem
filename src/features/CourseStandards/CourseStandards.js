import React, { useState, useEffect, useMemo } from 'react';
import SelectInput from '../../components/forms/SelectInput';
import { fetchCourseStandards, fetchStandardsDepartments } from '../../api/CourseService';

const styles = {
  container: { maxWidth: '800px', margin: '0 auto' },
  form: { padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  results: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#e6f7ff',
    border: '1px solid #b3d9ff',
    borderRadius: '8px',
  },
  resultItem: {
    fontSize: '18px',
    marginBottom: '10px',
    borderBottom: '1px dotted #ccc',
    paddingBottom: '5px',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '16px',
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

  const initialYear = currentSemester ? String(currentSemester).split('-')[0] : (yearOptions[0]?.value || '');
  const [selectedYear, setSelectedYear] = useState(initialYear);
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
      <h2>課程標準查詢</h2>

      <div style={styles.form}>
        <SelectInput
          label="入學年分"
          name="year"
          value={selectedYear}
          onChange={handleChange}
          options={yearOptions}
        />

        {loadingOptions ? (
          <div style={{ ...styles.error, color: '#007bff' }}>正在載入系所選項...</div>
        ) : (
          <>
            <SelectInput
              label="學程"
              name="program"
              value={selectedProgram}
              onChange={handleChange}
              options={programOptions}
            />

            <SelectInput
              label="系所"
              name="department"
              value={selectedDeptId}
              onChange={handleChange}
              options={departmentOptions
                .filter(d => !selectedProgram || String(d.value).startsWith(`${selectedProgram}-`))
                .map(d => ({
                  // 移除 label 中的括號部分，例如 "電機系 (四技)" -> "電機系"
                  value: d.value,
                  label: String(d.label).replace(/\s*\(.+\)\s*$/, '')
                }))}
            />
          </>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {standards && (
        <div style={styles.results}>
          <h3>{currentYearLabel} - {currentDeptLabel} 畢業標準</h3>

          <div style={{ display: 'flex', justifyContent: 'space-around', margin: '20px 0' }}>
            <p style={styles.resultItem}>必修學分總計: {standards.requiredCredits} 學分</p>
            <p style={styles.resultItem}>選修學分總計: {standards.electiveCredits} 學分</p>
            <p style={{ ...styles.resultItem, fontWeight: 'bold', color: '#d9534f' }}>最低畢業總學分: {standards.graduationTotal} 學分</p>
          </div>

          <hr />

          <h4>詳細課程列表 ({standards.courses.length} 門)</h4>
          <GroupedCourseTables courses={standards.courses} />

          <h4 style={{ marginTop: '20px' }}>畢業規則說明</h4>
          <ul style={{ textAlign: 'left', fontSize: '0.9em', paddingLeft: '20px' }}>
            {standards.rules.map((rule, index) => (
              <li key={index} dangerouslySetInnerHTML={{ __html: rule }}></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const CourseTable = ({ courses }) => {
  const tableStyles = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' };
  const thStyles = { border: '1px solid #ccc', padding: '8px', backgroundColor: '#f0f0f0', textAlign: 'center' };
  const tdStyles = { border: '1px solid #eee', padding: '8px', textAlign: 'center' };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyles}>
        <thead>
          <tr>
            <th style={thStyles}>年級</th>
            <th style={thStyles}>學期</th>
            <th style={thStyles}>類別</th>
            <th style={thStyles}>課程名稱</th>
            <th style={thStyles}>學分</th>
            <th style={thStyles}>時數</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course, index) => (
            <tr key={index}>
              <td style={tdStyles}>{course.year}</td>
              <td style={tdStyles}>{course.sem}</td>
              <td style={{ ...tdStyles, fontWeight: 'bold', color: course.type === '▲' ? '#007bff' : '#5cb85c' }}>
                {course.type === '△'
                  ? '共同必修'
                  : course.type === '▲'
                    ? '專業必修'
                    : course.type === '★'
                      ? '專業選修'
                      : course.type === '☆'
                        ? '核心必修'
                        : course.type}
              </td>
              <td style={{ ...tdStyles, textAlign: 'left' }}>{course.name}</td>
              <td style={tdStyles}>{course.credit}</td>
              <td style={tdStyles}>{course.hours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 將課程按照 type 分組並呈現多個分組表格
const GroupedCourseTables = ({ courses }) => {
  const groups = useMemo(() => {
    if (!courses || !Array.isArray(courses)) return {};
    return courses.reduce((acc, c) => {
      const key = c.type || '其他';
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    }, {});
  }, [courses]);

  const typeLabel = (type) => {
    return type === '△' ? '共同必修' : type === '▲' ? '專業必修' : type === '★' ? '專業選修' : type === '☆' ? '核心必修' : type;
  };

  return (
    <div>
      {Object.keys(groups).map((type) => (
        <div key={type} style={{ marginBottom: '20px' }}>
          <h5 style={{ marginBottom: '8px' }}>{typeLabel(type)} ({groups[type].length} 門)</h5>
          <CourseTable courses={groups[type]} />
        </div>
      ))}
    </div>
  );
};

export default CourseStandards;