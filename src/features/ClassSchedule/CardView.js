import React, { useState } from 'react';

const styles = {
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
        padding: '8px',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #F1F5F9',
        padding: '20px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'pointer',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    cardTitle: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#1E293B',
        margin: 0,
        lineHeight: '1.4',
    },
    courseId: {
        fontSize: '0.85rem',
        color: '#64748B',
        fontFamily: 'monospace',
    },
    typeBadge: {
        fontSize: '0.8rem',
        color: '#0369A1',
        backgroundColor: '#E0F2FE',
        padding: '4px 8px',
        borderRadius: '6px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
    },
    cardBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    information: {
        display: 'flex',
        fontSize: '0.9rem',
        color: '#475569',
        alignItems: 'center',
        lineHeight: '1.5',
    },
    divider: {
        height: '1px',
        backgroundColor: '#aaaaaaff',
        margin: '4px 0',
    },
};

const Icons = {
    Clock: () => (
        <svg style={{ width: '16px', height: '16px', marginRight: '8px', color: '#94A3B8', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    User: () => (
        <svg style={{ width: '16px', height: '16px', marginRight: '8px', color: '#94A3B8', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Location: () => (
        <svg style={{ width: '16px', height: '16px', marginRight: '8px', color: '#94A3B8', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Star: () => (
        <svg style={{ width: '16px', height: '16px', marginRight: '8px', color: '#94A3B8', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    ),
};

const formatTime = (timeArray) => {
    if (!timeArray || timeArray.length === 0) return '無時間資訊';

    const dayMap = ['日', '一', '二', '三', '四', '五', '六'];
    const grouped = {};

    timeArray.forEach(t => {
        if (!grouped[t.day]) grouped[t.day] = [];
        grouped[t.day].push(t.period);
    });

    const parts = [];
    // Sort days (1 to 7)
    Object.keys(grouped).sort().forEach(dayIdx => {
        const dayName = dayMap[dayIdx] || dayIdx;
        const periods = grouped[dayIdx].join(', ');
        parts.push(`${dayName} / ${periods}`);
    });

    return parts.join('；');
};

const SingleCard = ({ course }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                ...styles.card,
                transform: isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered ? '0 12px 20px -8px rgba(0, 0, 0, 0.15)' : styles.card.boxShadow
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={styles.cardHeader}>
                <div style={styles.titleContainer}>
                    <div style={styles.cardTitle}>{course.name}</div>
                    <div style={styles.courseId}>#{course.id}</div>
                </div>
                <div style={styles.typeBadge}>{course.type}</div>
            </div>

            <div style={styles.divider} />

            <div style={styles.cardBody}>
                <div style={styles.information}>
                    <Icons.User />
                    <span>{course.teacher}</span>
                </div>
                <div style={styles.information}>
                    <Icons.Clock />
                    <span>{formatTime(course.time)}</span>
                </div>
                <div style={styles.information}>
                    <Icons.Location />
                    <span>{course.location}</span>
                </div>
                <div style={styles.information}>
                    <Icons.Star />
                    <span>{course.credits} 學分</span>
                </div>
            </div>
        </div>
    );
};

const CardView = ({ courses }) => {
    if (!courses || courses.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#94A3B8',
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                border: '2px dashed #E2E8F0'
            }}>
                <p style={{ margin: 0, fontSize: '1.1rem' }}>該班級目前沒有課程資料</p>
            </div>
        );
    }

    return (
        <div style={styles.cardGrid}>
            {courses.map(course => (
                <SingleCard key={course.id} course={course} />
            ))}
        </div>
    );
};

export default CardView;
