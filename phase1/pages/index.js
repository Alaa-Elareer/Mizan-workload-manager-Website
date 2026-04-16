import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AssessmentList from '../components/AssessmentList';
import AssessmentForm from '../components/AssessmentForm';
import AssessmentCalendar from '../components/AssessmentCalendar';
import CourseComments from '../components/CourseComments';
import WorkloadSummary from '../components/WorkloadSummary';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [assessments, setAssessments] = useState({});
  const [isAddingAssessment, setIsAddingAssessment] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', or 'summary'
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    // Check for authenticated user
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (!user) return;
    // Load assessments from our JSON file
    fetch('/api/assessments', {
      headers: {
        'user-role': user.role || ''
      }
    })
      .then(res => res.json())
      .then(data => setAssessments(data))
      .catch(error => console.error('Error loading assessments:', error));
  }, [user]);

  const handleAddAssessment = (newAssessment) => {
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }

    const updatedAssessments = {
      ...assessments,
      [selectedCourse]: {
        ...assessments[selectedCourse],
        assessments: [...assessments[selectedCourse].assessments, newAssessment]
      }
    };

    // Update via API
    fetch('/api/assessments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-role': user?.role || ''
      },
      body: JSON.stringify({
        courseId: selectedCourse,
        assessment: newAssessment
      }),
    })
      .then(res => res.json())
      .then(() => {
        setAssessments(updatedAssessments);
        setIsAddingAssessment(false);
      })
      .catch(error => console.error('Error adding assessment:', error));
  };

  const handleEditAssessment = (courseId, index, assessment) => {
    setEditingAssessment({ courseId, index, assessment });
  };

  const handleUpdateAssessment = (updatedAssessment) => {
    const { courseId, index } = editingAssessment;
    const updatedAssessments = {
      ...assessments,
      [courseId]: {
        ...assessments[courseId],
        assessments: assessments[courseId].assessments.map((a, i) => 
          i === index ? updatedAssessment : a
        )
      }
    };

    // Update via API
    fetch('/api/assessments', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'user-role': user?.role || ''
      },
      body: JSON.stringify({
        courseId,
        index,
        assessment: updatedAssessment
      }),
    })
      .then(res => res.json())
      .then(() => {
        setAssessments(updatedAssessments);
        setEditingAssessment(null);
      })
      .catch(error => console.error('Error updating assessment:', error));
  };

  const handleDeleteAssessment = (courseId, index) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    const updatedAssessments = {
      ...assessments,
      [courseId]: {
        ...assessments[courseId],
        assessments: assessments[courseId].assessments.filter((_, i) => i !== index)
      }
    };

    // Delete via API
    fetch('/api/assessments', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'user-role': user?.role || ''
      },
      body: JSON.stringify({
        courseId,
        index
      }),
    })
      .then(res => res.json())
      .then(() => {
        setAssessments(updatedAssessments);
      })
      .catch(error => console.error('Error deleting assessment:', error));
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Mizān - Workload Management</title>
        <meta name="description" content="Workload management web app for students and instructors" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Welcome to Mizān
          </h1>
          {user && (
            <div className={styles.userInfo}>
              <span>Logged in as: {user.username} ({user.role})</span>
              <button
                onClick={() => {
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className={styles.logoutButton}
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <div className={styles.viewToggle}>
          <button
            onClick={() => setViewMode('list')}
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
          >
            Assessment List
          </button>
          {user?.role === 'student' && (
            <button
              onClick={() => setViewMode('calendar')}
              className={`${styles.viewButton} ${viewMode === 'calendar' ? styles.active : ''}`}
            >
              Calendar View
            </button>
          )}
          {(user?.role === 'student' || user?.role === 'coordinator') && (
            <button
              onClick={() => setViewMode('summary')}
              className={`${styles.viewButton} ${viewMode === 'summary' ? styles.active : ''}`}
            >
              Workload Summary
            </button>
          )}
        </div>

        <div className={styles.controls}>
          {!isAddingAssessment && !editingAssessment && (
            <div className={styles.addSection}>
              <div className={styles.courseSelectWrapper}>
                {(user?.role === 'student' || user?.role === 'coordinator') && (
                  <p className={styles.selectDescription}>
                    Select a course to view or add comments about workload concerns
                  </p>
                )}
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setShowComments(false);
                  }}
                  className={styles.courseSelect}
                >
                  <option value="">Select Course</option>
                  {Object.entries(assessments).map(([courseId, courseData]) => (
                    <option key={courseId} value={courseId}>
                      {courseId} - {courseData.course_name}
                    </option>
                  ))}
                </select>
              </div>
              {user?.role === 'instructor' && (
                <button
                  onClick={() => setIsAddingAssessment(true)}
                  className={styles.addButton}
                  disabled={!selectedCourse}
                >
                  Add Assessment
                </button>
              )}
              {selectedCourse && (
                <button
                  onClick={() => setShowComments(!showComments)}
                  className={`${styles.viewButton} ${showComments ? styles.active : ''}`}
                  id='toggleCommentsButton'
                >
                  {showComments 
                    ? 'Hide Comments' 
                    : user?.role === 'instructor'
                      ? 'Show Comments'
                      : 'Add/View Workload Comments'}
                </button>
              )}
            </div>
          )}

          {isAddingAssessment && (
            <div className={styles.formSection}>
              <h2>Add New Assessment</h2>
              <AssessmentForm
                onSubmit={handleAddAssessment}
                buttonText="Add Assessment"
              />
              <button
                onClick={() => setIsAddingAssessment(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          )}

          {editingAssessment && (
            <div className={styles.formSection}>
              <h2>Edit Assessment</h2>
              <AssessmentForm
                assessment={editingAssessment.assessment}
                onSubmit={handleUpdateAssessment}
                buttonText="Update Assessment"
              />
              <button
                onClick={() => setEditingAssessment(null)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {showComments && selectedCourse && (
          <CourseComments courseId={selectedCourse} />
        )}

        {viewMode === 'calendar' && user?.role === 'student' ? (
          <AssessmentCalendar assessments={assessments} />
        ) : viewMode === 'summary' ? (
          <WorkloadSummary program={user?.role === 'coordinator' ? 'CMPS' : null} />
        ) : (
          <AssessmentList
            assessments={assessments}
            onDelete={handleDeleteAssessment}
            onEdit={handleEditAssessment}
          />
        )}
      </main>
    </div>
  );
}
