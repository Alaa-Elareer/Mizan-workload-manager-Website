import { useState, useEffect } from 'react';
import styles from '../styles/AssessmentForm.module.css';

export default function AssessmentForm({ assessment, onSubmit, buttonText = "Submit" }) {
    const [formData, setFormData] = useState(assessment || {
        title: '',
        type: '',
        due_date: '',
        effort_hours: '',
        weight: '',
        phase: ''
    });
    const [error, setError] = useState('');
    const [existingAssessments, setExistingAssessments] = useState([]);

    useEffect(() => {
        // Load existing assessments for validation
        fetch('/api/assessments')
            .then(res => res.json())
            .then(data => {
                const allAssessments = Object.values(data).flatMap(course => course.assessments);
                setExistingAssessments(allAssessments);
            })
            .catch(error => console.error('Error loading assessments:', error));
    }, []);

    const validateAssessment = () => {
        // Count existing assessments by type (excluding current assessment if editing)
        const assessmentsToCheck = assessment 
            ? existingAssessments.filter(a => a !== assessment)
            : existingAssessments;

        const counts = assessmentsToCheck.reduce((acc, curr) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
        }, {});

        // Validation rules
        if (formData.type === 'Final Exam' && counts['Final Exam'] >= 1) {
            return 'Only one final exam can be added';
        }
        if (formData.type === 'Midterm' && counts['Midterm'] >= 2) {
            return 'Maximum of two midterm exams allowed';
        }
        if (formData.type === 'Homework' && counts['Homework'] >= 8) {
            return 'Maximum of 8 homework assignments allowed';
        }
        if (formData.type === 'Project') {
            const phase = parseInt(formData.phase);
            if (isNaN(phase) || phase < 1 || phase > 4) {
                return 'Project phase must be between 1 and 4';
            }
        }

        // Check for duplicate due dates
        const dueDateExists = assessmentsToCheck.some(a => a.due_date === formData.due_date);
        if (dueDateExists) {
            return 'An assessment with this due date already exists';
        }

        return '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationError = validateAssessment();
        if (validationError) {
            setError(validationError);
            return;
        }
        onSubmit(formData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
                <label htmlFor="title">Title:</label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                />
            </div>

            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.formGroup}>
                <label htmlFor="type">Type:</label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={(e) => {
                        const type = e.target.value;
                        const counts = existingAssessments.reduce((acc, curr) => {
                            acc[curr.type] = (acc[curr.type] || 0) + 1;
                            return acc;
                        }, {});
                        
                        // Auto-generate title based on type
                        let title = type;
                        if (type === 'Homework') {
                            title = `Homework ${(counts['Homework'] || 0) + 1}`;
                        } else if (type === 'Midterm') {
                            title = `Midterm ${(counts['Midterm'] || 0) + 1}`;
                        } else if (type === 'Project') {
                            const nextPhase = (counts['Project'] || 0) + 1;
                            title = `Project Phase ${nextPhase}`;
                            setFormData(prev => ({
                                ...prev,
                                phase: nextPhase.toString()
                            }));
                        }
                        
                        setFormData(prev => ({
                            ...prev,
                            type,
                            title
                        }));
                    }}
                    required
                >
                    <option value="">Select Type</option>
                    <option value="Homework">Homework</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Final Exam">Final Exam</option>
                    <option value="Project">Project</option>
                </select>
            </div>

            {formData.type === 'Project' && (
                <div className={styles.formGroup}>
                    <label htmlFor="phase">Project Phase (1-4):</label>
                    <input
                        type="number"
                        id="phase"
                        name="phase"
                        value={formData.phase}
                        onChange={handleChange}
                        min="1"
                        max="4"
                        required
                    />
                </div>
            )}

            <div className={styles.formGroup}>
                <label htmlFor="due_date">Due Date:</label>
                <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="effort_hours">Effort Hours:</label>
                <input
                    type="number"
                    id="effort_hours"
                    name="effort_hours"
                    value={formData.effort_hours}
                    onChange={handleChange}
                    min="1"
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="weight">Weight (%):</label>
                <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    required
                />
            </div>

            <button type="submit" className={styles.submitButton}>
                {buttonText}
            </button>
        </form>
    );
}
