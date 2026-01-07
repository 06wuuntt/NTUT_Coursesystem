import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CardView.css';

const Icons = {
    Clock: () => (
        <svg className="card-view-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    User: () => (
        <svg className="card-view-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Location: () => (
        <svg className="card-view-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Star: () => (
        <svg className="card-view-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    ),
    Note: () => (
        <svg className="card-view-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

const SingleCard = ({ course, currentSemester }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/course/${course.id}`, {
            state: {
                course,
                semesterId: currentSemester
            }
        });
    };

    return (
        <div
            className="card-view-card"
            onClick={handleClick}
        >
            <div className="card-view-header">
                <div className="card-view-title-container">
                    <div className="card-view-title">{course.name}</div>
                    <div className="card-view-id">#{course.id}</div>
                </div>
                <div className="card-view-badge">{course.type}</div>
            </div>

            <div className="card-view-divider" />

            <div className="card-view-body">
                <div className="card-view-info">
                    <Icons.User />
                    <span>{course.teacher || '無教師資訊'}</span>
                </div>
                <div className="card-view-info">
                    <Icons.Clock />
                    <span>{formatTime(course.time)}</span>
                </div>
                <div className="card-view-info">
                    <Icons.Location />
                    <span>{course.location}</span>
                </div>
                <div className="card-view-info">
                    <Icons.Star />
                    <span>{course.credits} 學分</span>
                </div>
                {course.notes && (
                    <div className="card-view-info">
                        <Icons.Note />
                        <span>{course.notes}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const CardView = ({ courses, currentSemester }) => {
    if (!courses || courses.length === 0) {
        return (
            <div className="card-view-empty">
                <p className="card-view-empty-text">該班級目前沒有課程資料</p>
            </div>
        );
    }

    return (
        <div className="card-view-grid">
            {courses.map(course => (
                <SingleCard key={course.id} course={course} currentSemester={currentSemester} />
            ))}
        </div>
    );
};

export default CardView;
