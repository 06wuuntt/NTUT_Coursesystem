import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faClock, faMapMarkerAlt, faUser, faBook, faInfoCircle, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import './CourseDetail.css';

const CourseDetail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const course = location.state?.course;

    if (!course) {
        return (
            <div className="course-detail-container">
                <div className="course-detail-not-found">
                    <h2>找不到課程資料</h2>
                    <p>請從課表頁面點擊課程卡片進入。</p>
                    <button className="course-detail-back-btn" onClick={() => navigate(-1)}>
                        <FontAwesomeIcon icon={faArrowLeft} /> 返回上一頁
                    </button>
                </div>
            </div>
        );
    }

    const formatTime = (timeArray) => {
        if (!timeArray || timeArray.length === 0) return '無時間資訊';
        return timeArray.map((t, i) => (
            <div key={i} className="course-detail-tag">
                週{t.day} 第 {t.period} 節
            </div>
        ));
    };

    return (
        <div className="course-detail-container">
            <button className="course-detail-back-btn" onClick={() => navigate(-1)}>
                <FontAwesomeIcon icon={faArrowLeft} /> 返回列表
            </button>

            <div className="course-detail-header">
                <h1 className="course-detail-title">{course.name}</h1>
                <div className="course-detail-subtitle">
                    <span className="course-detail-badge">{course.code}</span>
                    <span>{course.credits} 學分</span>
                    <span>{course.hours} 時數</span>
                    <span>{course.type}</span>
                </div>
            </div>

            <div className="course-detail-card">
                <div className="course-detail-section">
                    <h3 className="course-detail-section-title">
                        <FontAwesomeIcon icon={faInfoCircle} /> 基本資訊
                    </h3>
                    <div className="course-detail-grid">
                        <div className="course-detail-item">
                            <span className="course-detail-label">開課班級</span>
                            <span className="course-detail-value">{course.class || '未指定'}</span>
                        </div>
                        <div className="course-detail-item">
                            <span className="course-detail-label">選別</span>
                            <span className="course-detail-value">{course.type || '未指定'}</span>
                        </div>
                        <div className="course-detail-item">
                            <span className="course-detail-label">學分/時數</span>
                            <span className="course-detail-value">{course.credits} / {course.hours}</span>
                        </div>
                        <div className="course-detail-item">
                            <span className="course-detail-label">人數限制</span>
                            <span className="course-detail-value">{course.maxStudents || '無限制'}</span>
                        </div>
                    </div>
                </div>

                <div className="course-detail-section">
                    <h3 className="course-detail-section-title">
                        <FontAwesomeIcon icon={faUser} /> 教學團隊
                    </h3>
                    <div className="course-detail-grid">
                        <div className="course-detail-item">
                            <span className="course-detail-label">授課教師</span>
                            <span className="course-detail-value">{course.teacher || '未安排'}</span>
                        </div>
                        {/* 如果有助教或其他資訊可以在這裡添加 */}
                    </div>
                </div>

                <div className="course-detail-section">
                    <h3 className="course-detail-section-title">
                        <FontAwesomeIcon icon={faClock} /> 上課時間與地點
                    </h3>
                    <div className="course-detail-grid">
                        <div className="course-detail-item">
                            <span className="course-detail-label">上課時間</span>
                            <div className="course-detail-value course-detail-time-value">
                                {formatTime(course.time)}
                            </div>
                        </div>
                        <div className="course-detail-item">
                            <span className="course-detail-label">上課地點</span>
                            <span className="course-detail-value">{course.location || '未指定'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;
