import { useState, useEffect } from 'react';
import styles from '../styles/WorkloadSummary.module.css';

export default function WorkloadSummary({ program }) {
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            fetchWorkloadSummary(JSON.parse(storedUser));
        }
    }, [program]);

    const fetchWorkloadSummary = async (userData) => {
        try {
            setIsLoading(true);
            setError('');

            const url = program 
                ? `/api/workload-summary?program=${program}`
                : '/api/workload-summary';

            const response = await fetch(url, {
                headers: {
                    'user-role': userData?.role || '',
                    'user-id': userData?.username || ''
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch workload summary');
            }

            const data = await response.json();
            setSummary(data);
        } catch (error) {
            console.error('Error fetching workload summary:', error);
            setError(error.message || 'Failed to load workload summary');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading workload summary...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.error}>
                <h3>Error Loading Summary</h3>
                <p>{error}</p>
                <button 
                    onClick={() => fetchWorkloadSummary(user)}
                    className={styles.retryButton}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className={styles.noData}>
                <h3>No Data Available</h3>
                <p>No workload summary data is currently available.</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.overallStats}>
                <h2>Overall Statistics</h2>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <h3>Total Courses</h3>
                        <p>{summary.overall.totalCourses}</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Total Assessments</h3>
                        <p>{summary.overall.totalAssessments}</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Total Effort Hours</h3>
                        <p>{summary.overall.totalEffortHours}</p>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Average Effort per Course</h3>
                        <p>{summary.overall.averageEffortPerCourse.toFixed(1)} hours</p>
                    </div>
                </div>
            </div>

            <div className={styles.upcomingDeadlines}>
                <h2>Upcoming Deadlines</h2>
                {summary.overall.upcomingDeadlines.length > 0 ? (
                    <div className={styles.deadlinesList}>
                        {summary.overall.upcomingDeadlines.map((deadline, index) => (
                            <div key={index} className={styles.deadline}>
                                <div className={styles.deadlineHeader}>
                                    <h3>{deadline.title}</h3>
                                    <span className={`${styles.type} ${styles[deadline.type.toLowerCase().replace(' ', '-')]}`}>
                                        {deadline.type}
                                    </span>
                                </div>
                                <p className={styles.courseName}>{deadline.course_name}</p>
                                <div className={styles.deadlineDetails}>
                                    <span>Due: {formatDate(deadline.due_date)}</span>
                                    <span>Effort: {deadline.effort_hours} hours</span>
                                    <span>Weight: {deadline.weight}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.noDeadlines}>No upcoming deadlines</p>
                )}
            </div>

            <div className={styles.courseBreakdown}>
                <h2>Course Breakdown</h2>
                {Object.entries(summary.courses).map(([courseId, data]) => (
                    <div key={courseId} className={styles.courseCard}>
                        <h3>{courseId} - {data.course_name}</h3>
                        <div className={styles.courseStats}>
                            <div>
                                <strong>Total Effort:</strong> {data.workload.totalEffortHours} hours
                            </div>
                            <div>
                                <strong>Total Assessments:</strong> {data.workload.assessmentCount}
                            </div>
                        </div>
                        <div className={styles.typeBreakdown}>
                            {Object.entries(data.workload.byType).map(([type, stats]) => (
                                <div key={type} className={styles.typeStats}>
                                    <h4>{type}</h4>
                                    <p>Count: {stats.count}</p>
                                    <p>Effort: {stats.totalEffortHours} hours</p>
                                    <p>Weight: {stats.totalWeight}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
