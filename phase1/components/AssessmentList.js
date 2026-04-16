import { useState, useEffect } from 'react';
import styles from '../styles/AssessmentList.module.css';

export default function AssessmentList({ assessments, courseId, onDelete, onEdit }) {
    const [selectedCourse, setSelectedCourse] = useState(courseId || '');
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const filteredAssessments = selectedCourse 
        ? { [selectedCourse]: assessments[selectedCourse] }
        : assessments;

    return (
        <div className={styles.container}>
            <div className={styles.filterSection}>
                <select 
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className={styles.courseSelect}
                >
                    <option value="">All Courses</option>
                    {Object.keys(assessments).map(courseId => (
                        <option key={courseId} value={courseId}>
                            {courseId} - {assessments[courseId].course_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.assessmentGrid}>
                {Object.entries(filteredAssessments).map(([courseId, courseData]) => (
                    <div key={courseId} className={styles.courseSection}>
                        <h2 className={styles.courseTitle}>
                            {courseId} - {courseData.course_name}
                        </h2>
                        <div className={styles.assessmentList}>
                            {courseData.assessments.map((assessment, index) => (
                                <div key={index} className={styles.assessmentCard}>
                                    <div className={styles.assessmentHeader}>
                                        <h3>{assessment.title}</h3>
                                        <span className={`${styles.type} ${styles[assessment.type.toLowerCase().replace(' ', '-')]}`}>
                                            {assessment.type}
                                        </span>
                                    </div>
                                    <div className={styles.assessmentDetails}>
                                        <p>Due: {formatDate(assessment.due_date)}</p>
                                        <p>Effort: {assessment.effort_hours} hours</p>
                                        <p>Weight: {assessment.weight}%</p>
                                        {assessment.phase && (
                                            <p>Phase: {assessment.phase}</p>
                                        )}
                                    </div>
                                    {user?.role === 'instructor' && (
                                        <div className={styles.actions}>
                                            <button 
                                                onClick={() => onEdit(courseId, index, assessment)}
                                                className={styles.editButton}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => onDelete(courseId, index)}
                                                className={styles.deleteButton}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
