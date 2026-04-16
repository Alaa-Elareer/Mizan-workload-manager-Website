import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'assessments.json');

// Helper function to read the JSON file
const readAssessments = () => {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading assessments file:', error);
    return {};
  }
};

// Helper function to write to the JSON file
const writeAssessments = (data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing to assessments file:', error);
    return false;
  }
};

// Helper function to validate user role
const validateUserRole = (req) => {
  // In a real application, this would verify JWT/session token
  // For now, we'll check the role from request headers
  const role = req.headers['user-role'];
  if (!role) {
    return { error: 'Authentication required' };
  }
  if (role !== 'instructor' && role !== 'coordinator') {
    return { error: 'Unauthorized. Only instructors and coordinators can modify assessments' };
  }
  return null;
};

// Helper function to validate assessment
const validateAssessment = async (courseId, newAssessment, existingAssessments) => {
  // Count assessments by type
  const counts = existingAssessments.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {});

  // Validation rules
  if (newAssessment.type === 'Final Exam' && counts['Final Exam'] >= 1) {
    return 'Only one final exam can be added';
  }
  if (newAssessment.type === 'Midterm' && counts['Midterm'] >= 2) {
    return 'Maximum of two midterm exams allowed';
  }
  if (newAssessment.type === 'Homework' && counts['Homework'] >= 8) {
    return 'Maximum of 8 homework assignments allowed';
  }
  if (newAssessment.type === 'Project') {
    const phase = parseInt(newAssessment.phase);
    if (isNaN(phase) || phase < 1 || phase > 4) {
      return 'Project phase must be between 1 and 4';
    }
  }

  // Check for duplicate due dates
  const dueDateExists = existingAssessments.some(a => 
    a.due_date === newAssessment.due_date
  );
  if (dueDateExists) {
    return 'An assessment with this due date already exists';
  }

  return null;
};

export default async function handler(req, res) {
  const { method } = req;

  // Validate user role for non-GET requests
  if (method !== 'GET') {
    const roleError = validateUserRole(req);
    if (roleError) {
      return res.status(401).json(roleError);
    }
  }

  try {
    switch (method) {
      case 'GET':
        // Return all assessments
        const assessments = readAssessments();
        res.status(200).json(assessments);
        break;

      case 'POST':
        // Add new assessment
        const { courseId, assessment } = req.body;
        const data = readAssessments();
        
        if (!data[courseId]) {
          return res.status(404).json({ error: 'Course not found' });
        }

        // Validate assessment
        const validationError = await validateAssessment(
          courseId,
          assessment,
          data[courseId].assessments
        );
        
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        data[courseId].assessments.push(assessment);
        
        if (writeAssessments(data)) {
          res.status(200).json({ message: 'Assessment added successfully' });
        } else {
          res.status(500).json({ error: 'Failed to save assessment' });
        }
        break;

      case 'PUT':
        // Update existing assessment
        const updateData = req.body;
        const currentData = readAssessments();
        
        if (!currentData[updateData.courseId] || !currentData[updateData.courseId].assessments[updateData.index]) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        // Get all assessments except the one being updated
        const otherAssessments = currentData[updateData.courseId].assessments.filter((_, i) => i !== updateData.index);
        
        // Validate updated assessment
        const updateValidationError = await validateAssessment(
          updateData.courseId,
          updateData.assessment,
          otherAssessments
        );
        
        if (updateValidationError) {
          return res.status(400).json({ error: updateValidationError });
        }

        currentData[updateData.courseId].assessments[updateData.index] = updateData.assessment;
        
        if (writeAssessments(currentData)) {
          res.status(200).json({ message: 'Assessment updated successfully' });
        } else {
          res.status(500).json({ error: 'Failed to update assessment' });
        }
        break;

      case 'DELETE':
        // Delete assessment
        const deleteData = req.body;
        const existingData = readAssessments();
        
        if (!existingData[deleteData.courseId] || !existingData[deleteData.courseId].assessments[deleteData.index]) {
          return res.status(404).json({ error: 'Assessment not found' });
        }

        existingData[deleteData.courseId].assessments.splice(deleteData.index, 1);
        
        if (writeAssessments(existingData)) {
          res.status(200).json({ message: 'Assessment deleted successfully' });
        } else {
          res.status(500).json({ error: 'Failed to delete assessment' });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
