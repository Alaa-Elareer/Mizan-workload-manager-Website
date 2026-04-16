import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

class SectionRepo {
  async getSectionById(sectionCRN) {
    return await prisma.section.findUnique({
      where: { crn: sectionCRN },
      include: {
        students: true,
        assessments: true,
        comments: {
          include: {
            author: true,
            replies: true
          }
        }
      }
    });
  }

  async getSections(user, semesterId) {
    console.log("SectionRepo.getSections - Semester ID:", semesterId);

    if (!user) return [];

    // Base query with semester filter
    const baseQuery = {
      where: {
        semester: semesterId
      }
    };

    // Add role-specific filters
    if (user.isStudent) {
      return await prisma.section.findMany({
        ...baseQuery,
        where: {
          ...baseQuery.where,
          students: {
            some: {
              id: user.id
            }
          }
        },
        include: {
          students: true,
          assessments: true,
          comments: {
            include: {
              author: true,
              replies: true
            }
          }
        }
      });
    }

    if (user.isInstructor) {
      return await prisma.section.findMany({
        ...baseQuery,
        where: {
          ...baseQuery.where,
          instructorId: user.id
        },
        include: {
          students: true,
          assessments: true,
          comments: {
            include: {
              author: true,
              replies: true
            }
          }
        }
      });
    }

    if (user.isCoordinator) {
      return await prisma.section.findMany({
        ...baseQuery,
        where: {
          ...baseQuery.where,
          program: user.program
        },
        include: {
          students: true,
          assessments: true,
          comments: {
            include: {
              author: true,
              replies: true
            }
          }
        }
      });
    }

    return [];
  }
}

export default new SectionRepo();
