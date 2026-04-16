import { useState, useEffect } from 'react';
import styles from '../styles/AssessmentCalendar.module.css';

export default function AssessmentCalendar({ assessments }) {
    const [calendarDays, setCalendarDays] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [assessmentsByDate, setAssessmentsByDate] = useState({});
    const [syncStatus, setSyncStatus] = useState({});

    useEffect(() => {
        generateCalendarDays(currentMonth);
        organizeAssessmentsByDate();
    }, [currentMonth, assessments]);

    const generateCalendarDays = (date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const days = [];

        // Add empty slots for days before the first day of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(date.getFullYear(), date.getMonth(), i));
        }

        setCalendarDays(days);
    };

    const organizeAssessmentsByDate = () => {
        const organized = {};
        
        Object.entries(assessments).forEach(([courseId, courseData]) => {
            courseData.assessments.forEach(assessment => {
                const date = new Date(assessment.due_date);
                const dateKey = date.toISOString().split('T')[0];
                
                if (!organized[dateKey]) {
                    organized[dateKey] = [];
                }
                
                organized[dateKey].push({
                    ...assessment,
                    courseId,
                    courseName: courseData.course_name
                });
            });
        });

        setAssessmentsByDate(organized);
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const handleGoogleCalendarSync = async (assessment) => {
        const assessmentId = `${assessment.courseId}-${assessment.title}`;
        setSyncStatus(prev => ({ ...prev, [assessmentId]: 'syncing' }));

        try {
            const response = await fetch('/api/google-calendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ assessment }),
            });

            if (!response.ok) {
                throw new Error('Failed to sync with Google Calendar');
            }

            setSyncStatus(prev => ({ ...prev, [assessmentId]: 'synced' }));
            setTimeout(() => {
                setSyncStatus(prev => {
                    const newStatus = { ...prev };
                    delete newStatus[assessmentId];
                    return newStatus;
                });
            }, 3000);

        } catch (error) {
            console.error('Error syncing with Google Calendar:', error);
            setSyncStatus(prev => ({ ...prev, [assessmentId]: 'error' }));
            setTimeout(() => {
                setSyncStatus(prev => {
                    const newStatus = { ...prev };
                    delete newStatus[assessmentId];
                    return newStatus;
                });
            }, 3000);
        }
    };

    const getSyncButtonText = (assessment) => {
        const assessmentId = `${assessment.courseId}-${assessment.title}`;
        const status = syncStatus[assessmentId];
        
        switch (status) {
            case 'syncing':
                return 'Syncing...';
            case 'synced':
                return 'Synced ✓';
            case 'error':
                return 'Sync Failed!';
            default:
                return 'Sync to Google Calendar';
        }
    };

    const getSyncButtonClass = (assessment) => {
        const assessmentId = `${assessment.courseId}-${assessment.title}`;
        const status = syncStatus[assessmentId];
        
        switch (status) {
            case 'syncing':
                return styles.syncing;
            case 'synced':
                return styles.synced;
            case 'error':
                return styles.error;
            default:
                return '';
        }
    };

    return (
        <div className={styles.calendar}>
            <div className={styles.header}>
                <button onClick={handlePrevMonth}>&larr;</button>
                <h2>
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={handleNextMonth}>&rarr;</button>
            </div>

            <div className={styles.weekdays}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className={styles.weekday}>{day}</div>
                ))}
            </div>

            <div className={styles.days}>
                {calendarDays.map((day, index) => (
                    <div 
                        key={index} 
                        className={`${styles.day} ${!day ? styles.empty : ''}`}
                    >
                        {day && (
                            <>
                                <span className={styles.dayNumber}>{day.getDate()}</span>
                                {assessmentsByDate[formatDate(day)]?.map((assessment, i) => (
                                    <div 
                                        key={i} 
                                        className={`${styles.assessment} ${styles[assessment.type.toLowerCase().replace(' ', '-')]}`}
                                    >
                                        <div className={styles.assessmentContent}>
                                            <strong>{assessment.title}</strong>
                                            <p>{assessment.courseId}</p>
                                            <button 
                                                onClick={() => handleGoogleCalendarSync(assessment)}
                                                className={`${styles.syncButton} ${getSyncButtonClass(assessment)}`}
                                                disabled={syncStatus[`${assessment.courseId}-${assessment.title}`] === 'syncing'}
                                            >
                                                {getSyncButtonText(assessment)}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
