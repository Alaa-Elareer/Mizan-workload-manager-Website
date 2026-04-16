import fs from 'fs';
import path from 'path';

const commentsFilePath = path.join(process.cwd(), 'data', 'comments.json');

// Helper function to read comments
const readComments = () => {
  try {
    const data = fs.readFileSync(commentsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading comments file:', error);
    return {};
  }
};

// Helper function to write comments
const writeComments = (data) => {
  try {
    fs.writeFileSync(commentsFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing to comments file:', error);
    return false;
  }
};

// Helper function to validate user role
const canAddComment = (role) => {
  return ['student', 'instructor', 'coordinator'].includes(role);
};

export default async function handler(req, res) {
  const { method } = req;
  const userRole = req.headers['user-role'];

  // Validate user authentication
  if (!userRole) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  switch (method) {
    case 'GET':
      try {
        const { courseId } = req.query;
        const comments = readComments();

        if (!courseId) {
          return res.status(400).json({ error: 'Course ID is required' });
        }

        // Return comments for the specified course, or empty array if none exist
        res.status(200).json(comments[courseId]?.comments || []);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
      }
      break;

    case 'POST':
      try {
        if (!canAddComment(userRole)) {
          return res.status(403).json({ error: 'Unauthorized to add comments' });
        }

        const { courseId, title, body, author } = req.body;

        if (!courseId || !title || !body || !author) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const comments = readComments();

        if (!comments[courseId]) {
          comments[courseId] = { comments: [] };
        }

        // Add new comment
        const newComment = {
          id: Date.now().toString(),
          title,
          body,
          author,
          role: userRole,
          createdAt: new Date().toISOString()
        };

        comments[courseId].comments.push(newComment);

        if (writeComments(comments)) {
          res.status(201).json(newComment);
        } else {
          res.status(500).json({ error: 'Failed to save comment' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
      }
      break;

    case 'DELETE':
      try {
        const { courseId, commentId } = req.body;
        const comments = readComments();

        if (!comments[courseId]) {
          return res.status(404).json({ error: 'Course not found' });
        }

        const comment = comments[courseId].comments.find(c => c.id === commentId);

        // Only allow users to delete their own comments or coordinators to delete any comment
        if (!comment || (comment.author !== req.headers['user-id'] && userRole !== 'coordinator')) {
          return res.status(403).json({ error: 'Unauthorized to delete this comment' });
        }

        comments[courseId].comments = comments[courseId].comments.filter(c => c.id !== commentId);

        if (writeComments(comments)) {
          res.status(200).json({ message: 'Comment deleted successfully' });
        } else {
          res.status(500).json({ error: 'Failed to delete comment' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete comment' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
