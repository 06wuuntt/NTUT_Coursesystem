import React from 'react';
import { MOCK_PERIODS } from '../../constants/mockData';

const styles = {
    // 外層容器會允許水平滾動，讓表格可以更寬
    outer: {
        overflowX: 'auto',
        width: '100%',
    },
    table: {
        minWidth: '1100px', // 強制表格較寬以擴大顯示範圍
        minHeight: '700px',
        borderCollapse: 'collapse',
        textAlign: 'center',
        tableLayout: 'fixed',
    },
    th: {
        border: '1px solid #ccc',
        padding: '12px',
        backgroundColor: '#eee',
        fontSize: '14px',
    },
    td: {
        border: '1px solid #ccc',
        padding: '12px',
        minHeight: '120px',
        verticalAlign: 'middle',
        position: 'relative',
        cursor: 'default',
        backgroundColor: '#f9f9f9', // 允許拖曳區的背景色
    },
    periodCell: {
        backgroundColor: '#f7f7f7',
        fontWeight: 'bold',
    },
    courseBlock: (isConflict) => ({
        backgroundColor: isConflict ? '#ffdddd' : '#d9edf7',
        border: isConflict ? '1px solid #d9534f' : '1px solid #bce8f1',
        borderRadius: '4px',
        padding: '5px',
        fontSize: '0.8em',
        height: '50%',
        lineHeight: '1.2',
        fontWeight: 'bold',
        color: isConflict ? '#a94442' : '#31708f',
        position: 'absolute', // 讓方塊可以重疊
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        zIndex: 10,
    }),
    location: {
        fontSize: '0.85em',
        fontWeight: 'normal',
        color: '#666',
        marginTop: '6px',
    },
    dragOver: {
        boxShadow: '0 0 10px 3px rgba(0, 123, 255, 0.5)',
        backgroundColor: '#e6f7ff',
    },
};

const DayNames = ['節次', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

/**
 * 排課模擬器課表
 * @param {object} scheduleGrid - 包含課程 ID 和位置的網格
 * @param {Array} courseData - 包含所有已選課程的完整資訊
 * @param {function} onRemoveCourse - 移除課程的回調函數
 */
const SchedulerTable = ({ scheduleGrid, courseData, onRemoveCourse }) => {
    // 建立一個集合來追蹤哪些格子是衝突的
    const conflictGrid = {};

    // 檢查網格內是否有時間衝突的課程 (簡化：只檢查格子內是否有重複 ID)
    Object.values(scheduleGrid).forEach(courseId => {
        // 這裡需要更複雜的邏輯來檢查不同課程在同一個格子的情況
        // 由於我們只顯示課程方塊，只要 grid[key] 有值就代表有課。
    });

    const handleDragOver = (e) => {
        e.preventDefault(); // 允許拖曳放下
        // e.currentTarget.style.backgroundColor = '#e6f7ff'; // 可以視覺化拖曳目標
    };

    const handleDrop = (e, dayIndex, periodId) => {
        e.preventDefault();
        // 獲取被拖曳的課程 ID
        const draggedCourseId = e.dataTransfer.getData("courseId");

        if (draggedCourseId && onRemoveCourse) {
            // 實際排課邏輯由父組件處理
            // 我們可以將課程 ID 和拖曳目標（DayIndex, PeriodId）傳遞給父組件，但排課操作是針對左側課程列表，而不是單一格子。
            // 為了簡化，我們只允許從左側列表拖曳到整個課表，而不是精確到格子。
            // **重要：由於我們需要將課程排入所有上課時間，這裡只處理移除邏輯。**
        }
    };

    // 點擊課程方塊來移除課程
    const handleCourseClick = (courseId) => {
        if (window.confirm(`確定要從課表中移除此課程 (ID: ${courseId}) 嗎？`)) {
            onRemoveCourse(courseId);
        }
    }


    return (
        <div style={styles.outer}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        {DayNames.map(day => (
                            <th key={day} style={styles.th}>{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody onDragOver={handleDragOver} onDrop={(e) => handleDrop(e)}>
                    {MOCK_PERIODS.map(period => (
                        <tr key={period.id}>
                            <td style={{ ...styles.td, ...styles.periodCell }}>
                                {period.id} ({period.time})
                            </td>

                            {[1, 2, 3, 4, 5, 6, 7].map(dayIndex => {
                                const key = `${dayIndex}_${period.id}`;
                                const courseId = scheduleGrid[key];
                                const course = courseId ? courseData[courseId] : null;

                                return (
                                    <td
                                        key={key}
                                        style={styles.td}
                                    >
                                        {course && (
                                            <div
                                                style={styles.courseBlock(conflictGrid[key])}
                                                onClick={() => handleCourseClick(courseId)}
                                            >
                                                {course.name}
                                                <div style={styles.location}>{course.location}</div>
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SchedulerTable;