import { useState, useEffect } from 'react';
import styles from '../styles/CourseComments.module.css';

export default function CourseComments({ courseId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState({ title: '', body: '' });
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        if (user && courseId) {
            fetchComments();
        }
    }, [user, courseId]);

    const fetchComments = async () => {
        if (!user || !courseId) return;
        
        try {
            const response = await fetch(`/api/comments?courseId=${courseId}`, {
                headers: {
                    'user-role': user.role
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }

            const data = await response.json();
            setComments(data);
        } catch (error) {
            setError('Failed to load comments');
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!newComment.title.trim() || !newComment.body.trim()) {
            setError('Title and comment are required');
            return;
        }

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-role': user?.role || '',
                    'user-id': user?.username || ''
                },
                body: JSON.stringify({
                    courseId,
                    ...newComment,
                    author: user.username
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            const newCommentData = await response.json();
            setComments(prev => [...prev, newCommentData]);
            setNewComment({ title: '', body: '' });
        } catch (error) {
            setError('Failed to add comment');
            console.error('Error:', error);
        }
    };

    const handleDelete = async (commentId) => {
        try {
            const response = await fetch('/api/comments', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'user-role': user?.role || '',
                    'user-id': user?.username || ''
                },
                body: JSON.stringify({
                    courseId,
                    commentId
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete comment');
            }

            setComments(prev => prev.filter(comment => comment.id !== commentId));
        } catch (error) {
            setError('Failed to delete comment');
            console.error('Error:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return <div className={styles.loading}>Loading comments...</div>;
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Course Comments</h2>
            
            {error && <div className={styles.error}>{error}</div>}

            {user && (user.role === 'student' || user.role === 'coordinator' || user.role === 'instructor') && (
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formHeader}>
                        {user.role === 'student' && (
                            <p className={styles.formDescription}>
                                Use this form to report issues or request workload changes for the instructor's consideration.
                            </p>
                        )}
                        {user.role === 'coordinator' && (
                            <p className={styles.formDescription}>
                                Use this form to report issues or suggest workload adjustments for the instructor's consideration.
                            </p>
                        )}
                        {user.role === 'instructor' && (
                            <p className={styles.formDescription}>
                                Use this form to respond to feedback and provide justifications for workload decisions.
                            </p>
                        )}
                    </div>
                    <div className={styles.formGroup}>
                        <input
                            type="text"
                            placeholder={user.role === 'instructor' ? "Response Title" : "Issue/Request Title"}
                            value={newComment.title}
                            onChange={(e) => setNewComment(prev => ({ ...prev, title: e.target.value }))}
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <textarea
                            placeholder={user.role === 'instructor' 
                                ? "Provide your response and justification..."
                                : "Describe the issue or workload change request..."}
                            value={newComment.body}
                            onChange={(e) => setNewComment(prev => ({ ...prev, body: e.target.value }))}
                            className={styles.textarea}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.submitButton}>
                        {user.role === 'instructor' ? 'Add Response' : 'Submit Request'}
                    </button>
                </form>
            )}

            <div className={styles.commentsList}>
                {comments.length === 0 ? (
                    <p className={styles.noComments}>No comments yet</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className={styles.comment}>
                            <div className={styles.commentHeader}>
                                <h3 className={styles.commentTitle}>{comment.title}</h3>
                                {(user?.username === comment.author || user?.role === 'coordinator') && (
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className={styles.deleteButton}
                                        aria-label="Delete comment"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <p className={styles.commentBody}>{comment.body}</p>
                            <div className={styles.commentMeta}>
                                <span className={styles.author}>
                                    {comment.author} ({comment.role})
                                </span>
                                <span className={styles.date}>
                                    {formatDate(comment.createdAt)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
