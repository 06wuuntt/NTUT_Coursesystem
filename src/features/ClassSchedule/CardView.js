import React from 'react';

const styles = {
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        padding: '10px',
    },
    card: {
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: '1.4em',
        color: '#0056b3',
        marginBottom: '5px',
        borderBottom: '2px solid #0056b3',
        paddingBottom: '5px',
    },
    info: {
        fontSize: '0.9em',
        marginBottom: '4px',
    },
    time: {
        fontWeight: 'bold',
        color: '#d9534f',
    }
};

const DayNames = ['一', '二', '三', '四', '五', '六', '日'];

/**
 * 卡片形式課表顯示
 * @param {Array} courses - 課程列表
 */
const CardView = ({ courses }) => {
    if (!courses || courses.length === 0) {
        return <p style={{textAlign: 'center', color: '#666'}}>該班級目前沒有課程資料。</p>;
    }

    return (
        <div style={styles.cardGrid}>
            {courses.map(course => (
                <div key={course.id} style={styles.card}>
                    <h4 style={styles.title}>{course.name} ({course.credits}學分)</h4>
                    <p style={styles.info}>授課教師: {course.teacher}</p>
                    <p style={styles.info}>上課地點: {course.location}</p>
                    <p style={styles.info}>
                        上課時間: {course.time.map((t, index) => (
                            <span key={index} style={styles.time}>
                                {DayNames[t.day - 1]} / {t.period} 節 {index < course.time.length - 1 ? '；' : ''}
                            </span>
                        ))}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default CardView;