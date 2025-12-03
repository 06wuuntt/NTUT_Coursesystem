import React from 'react';
import { MOCK_PERIODS } from '../../constants/mockData';

const styles = {
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'center',
        tableLayout: 'fixed',
    },
    th: {
        border: '1px solid #ccc',
        padding: '10px',
        backgroundColor: '#eee',
    },
    td: {
        border: '1px solid #ccc',
        padding: '5px',
        minHeight: '80px',
        verticalAlign: 'top',
        position: 'relative',
    },
    periodCell: {
        backgroundColor: '#f7f7f7',
        fontWeight: 'bold',
    },
    courseBlock: {
        backgroundColor: '#d9edf7',
        border: '1px solid #bce8f1',
        borderRadius: '4px',
        padding: '5px',
        fontSize: '0.85em',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        lineHeight: '1.2',
        fontWeight: 'bold',
        color: '#31708f',
    },
    location: {
        fontSize: '0.75em',
        fontWeight: 'normal',
        color: '#666',
        marginTop: '3px',
    }
};

const DayNames = ['節次', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

/**
 * 時間表形式課表顯示
 * @param {Array} courses - 課程列表
 */
const TimeTableView = ({ courses }) => {
    // 建立一個網格結構來存放課程 (Day[1-7] x Period[1-10])
    // 每個格子會是一個陣列，允許多堂課重疊
    const grid = {}; // 例如：grid['1_3'] = [courseA, courseB]

    // 填充網格
    courses.forEach(course => {
        course.time.forEach(t => {
            // 處理 '3-5' 這種連續節次
            const [start, end] = t.period.split('-').map(Number);
            for (let p = start; p <= (end || start); p++) {
                const key = `${t.day}_${p}`; // e.g., '1_3'
                if (!grid[key]) grid[key] = [];
                grid[key].push({
                    name: course.name,
                    location: course.location,
                    id: course.id,
                });
            }
        });
    });

    return (
        <table style={styles.table}>
            <thead>
                <tr>
                    {DayNames.map(day => (
                        <th key={day} style={styles.th}>{day}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {MOCK_PERIODS.map(period => (
                    <tr key={period.id}>
                        {/* 第一欄：節次與時間 */}
                        <td style={{...styles.td, ...styles.periodCell}}>
                            {period.id} ({period.time})
                        </td>
                        
                        {/* 星期一到日 (1 到 7) */}
                        {[1, 2, 3, 4, 5, 6, 7].map(dayIndex => {
                            const key = `${dayIndex}_${period.id}`;
                            const cell = grid[key] || [];

                            return (
                                <td key={key} style={styles.td}>
                                    {cell.length === 0 && null}
                                    {cell.length === 1 && (
                                        <div style={styles.courseBlock} title={cell[0].name}>
                                            {cell[0].name}
                                            <div style={styles.location}>{cell[0].location}</div>
                                        </div>
                                    )}
                                    {cell.length > 1 && (
                                        <div style={{ padding: 8, backgroundColor: '#fff4e6', borderRadius: 4, border: '1px dashed #f0ad4e' }}>
                                            <div style={{ fontWeight: 'bold', color: '#8a6d3b' }}>多堂課包含於此</div>
                                            <div style={{ fontSize: '0.85em', color: '#8a6d3b' }}>請點選卡片形式以查看該時段課程</div>
                                        </div>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TimeTableView;