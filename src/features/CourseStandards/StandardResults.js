import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import './StandardResults.css';

const CourseTable = ({ courses }) => {
    const getTypeClass = (type) => {
        switch (type) {
            case '△': return 'course-type-badge type-general-required';
            case '▲': return 'course-type-badge type-professional-required';
            case '★': return 'course-type-badge type-professional-elective';
            case '☆': return 'course-type-badge type-core-required';
            default: return 'course-type-badge type-default';
        }
    };

    const getTypeName = (type) => {
        switch (type) {
            case '△': return '共同必修';
            case '▲': return '專業必修';
            case '★': return '專業選修';
            case '☆': return '核心必修';
            default: return type;
        }
    };

    return (
        <div className="course-table-container">
            <table className="course-table">
                <thead>
                    <tr>
                        <th className="course-th">年級</th>
                        <th className="course-th">學期</th>
                        <th className="course-th">類別</th>
                        <th className="course-th" style={{ width: '40%' }}>課程名稱</th>
                        <th className="course-th">學分</th>
                        <th className="course-th">時數</th>
                    </tr>
                </thead>
                <tbody>
                    {courses.map((course, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'course-row-even' : 'course-row-odd'}>
                            <td className="course-td" data-label="年級">{course.year}</td>
                            <td className="course-td" data-label="學期">{course.sem}</td>
                            <td className="course-td" data-label="類別">
                                <span className={getTypeClass(course.type)}>
                                    {getTypeName(course.type)}
                                </span>
                            </td>
                            <td className="course-td" data-label="課程名稱">{course.name}</td>
                            <td className="course-td" data-label="學分">{course.credit}</td>
                            <td className="course-td" data-label="時數">{course.hours}</td>
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

    // 定義顯示順序：共同必修 -> 核心必修 -> 專業必修 -> 專業選修
    const sortOrder = ['△', '☆', '▲', '★'];

    const sortedKeys = Object.keys(groups).sort((a, b) => {
        const idxA = sortOrder.indexOf(a);
        const idxB = sortOrder.indexOf(b);
        // 如果都在列表中，依照列表順序排序
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        // 如果 a 在列表中，排前面
        if (idxA !== -1) return -1;
        // 如果 b 在列表中，排前面
        if (idxB !== -1) return 1;
        // 都不在列表中，依照字母順序
        return a.localeCompare(b);
    });

    return (
        <div className="course-group-container">
            {sortedKeys.map((type) => (
                <CourseGroup
                    key={type}
                    type={type}
                    courses={groups[type]}
                    typeLabel={typeLabel}
                />
            ))}
        </div>
    );
};

const CourseGroup = ({ type, courses, typeLabel }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="course-group-card">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`course-group-header ${isOpen ? 'course-group-header-open' : ''}`}
            >
                <h5 className="course-group-title">
                    <span className="course-group-indicator"></span>
                    {typeLabel(type)}
                    <span className="course-group-count">
                        {courses.length}
                    </span>
                </h5>
                <span className="course-group-arrow" style={{ transform: isOpen ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                    <FontAwesomeIcon icon={faChevronLeft} />
                </span>
            </div>

            {isOpen && (
                <div className="course-group-content">
                    <CourseTable courses={courses} />
                </div>
            )}
        </div>
    );
};

const StandardResults = ({ standards, currentYearLabel, currentDeptLabel }) => {
    if (!standards) return null;

    return (
        <div className="standard-results">
            <div className="standard-results-header">
                <h3 className="standard-results-title">
                    {currentYearLabel} {currentDeptLabel}
                </h3>
                <p className="standard-results-subtitle">畢業標準與課程規劃</p>
            </div>

            <div className="summary-card">
                <div className="summary-item">
                    <div className="summary-label">共同必修</div>
                    <div className="summary-value">{standards.generalRequired}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-label">專業必修</div>
                    <div className="summary-value">{standards.professionalRequired}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-label">專業選修</div>
                    <div className="summary-value">{standards.professionalElective}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-label">跨域及自由選修</div>
                    <div className="summary-value">{standards.freeElective}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-label">最低畢業總學分</div>
                    <div className="summary-value">{standards.graduationTotal}</div>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <h4 className="section-title">
                    詳細課程列表 ({standards.courses.length} 門)
                </h4>
                <GroupedCourseTables courses={standards.courses} />
            </div>

            <div>
                <h4 className="section-title">
                    畢業規則說明
                </h4>
                <ul className="rules-list">
                    {standards.rules.map((rule, index) => (
                        <li key={index} className="rule-item">
                            <span className="rule-bullet">•</span>
                            <div dangerouslySetInnerHTML={{ __html: rule }} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default StandardResults;
