import fs from 'fs';
import path from 'path';

const assessmentsFilePath = path.join(process.cwd(), 'data', 'assessments.json');

// Helper function to read assessments
const readAssessments = () => {
  try {
    const data = fs.readFileSync(assessmentsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading assessments file:', error);
    return {};
  }
};

// Helper function to calculate course workload
const calculateCourseWorkload = (assessments) => {
  return {
    totalEffortHours: assessments.reduce((sum, a) => sum + Number(a.effort_hours), 0),
    assessmentCount: assessments.length,
    byType: assessments.reduce((acc, a) => {
      if (!acc[a.type]) {
        acc[a.type] = {
          count: 0,
          totalEffortHours: 0,
          totalWeight: 0
        };
      }
      acc[a.type].count++;
      acc[a.type].totalEffortHours += Number(a.effort_hours);
      acc[a.type].totalWeight += Number(a.weight);
      return acc;
    }, {}),
    upcomingDeadlines: assessments
      .filter(a => new Date(a.due_date) > new Date())
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5)
      .map(a => ({
        title: a.title,
        type: a.type,
        due_date: a.due_date,
        effort_hours: a.effort_hours,
        weight: a.weight
      }))
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userRole = req.headers['user-role'];
  const programPrefix = req.query.program; // e.g., 'CMPS' for CS courses

  if (!userRole) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const allAssessments = readAssessments();
    let relevantCourses = {};

    // Filter courses based on user role and program
    if (userRole === 'coordinator' && programPrefix) {
      // For coordinator, get all courses in their program
      Object.entries(allAssessments).forEach(([courseId, courseData]) => {
        if (courseId.startsWith(programPrefix)) {
          relevantCourses[courseId] = courseData;
        }
      });
    } else if (userRole === 'student') {
      // For student, get their registered courses
      // In a real app, this would come from a student's registration data
      // For now, we'll return all courses as a demonstration
      relevantCourses = allAssessments;
    } else {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Calculate workload summary for each course
    const workloadSummary = Object.entries(relevantCourses).reduce((acc, [courseId, courseData]) => {
      acc[courseId] = {
        course_name: courseData.course_name,
        workload: calculateCourseWorkload(courseData.assessments)
      };
      return acc;
    }, {});

    // Calculate overall statistics
    const overallStats = {
      totalCourses: Object.keys(relevantCourses).length,
      totalAssessments: Object.values(workloadSummary).reduce(
        (sum, course) => sum + course.workload.assessmentCount, 
        0
      ),
      totalEffortHours: Object.values(workloadSummary).reduce(
        (sum, course) => sum + course.workload.totalEffortHours, 
        0
      ),
      averageEffortPerCourse: Object.values(workloadSummary).reduce(
        (sum, course) => sum + course.workload.totalEffortHours, 
        0
      ) / Object.keys(relevantCourses).length,
      upcomingDeadlines: Object.entries(workloadSummary)
        .flatMap(([courseId, data]) => 
          data.workload.upcomingDeadlines.map(deadline => ({
            ...deadline,
            courseId,
            course_name: data.course_name
          }))
        )
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 10)
    };

    res.status(200).json({
      courses: workloadSummary,
      overall: overallStats
    });

  } catch (error) {
    console.error('Error generating workload summary:', error);
    res.status(500).json({ error: 'Failed to generate workload summary' });
  }
}
