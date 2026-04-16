import { PrismaClient } from '@prisma/client'
import { capitalize } from '../actions/utils'
const prisma = new PrismaClient()

class AssessmentRepo {
  async getAssessmentTypes() {
    return await prisma.assessmentType.findMany()
  }

  async getAssessmentById(id) {
    // Ensure id is a JS number
    const assessmentId = Number(id)
    return await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { section: true }
    })
  }

  async getAssessmentsBySection(sectionCRN) {
    return await prisma.assessment.findMany({
      where: { sectionCRN },
      include: { section: true },
      orderBy: { id: 'asc' }
    })
  }

  async countAssessmentsByType(sectionCRN, type) {
    return await prisma.assessment.count({
      where: { sectionCRN, type }
    })
  }

  async countAssessmentsByDueDate(sectionCRN, dueDate) {
    return await prisma.assessment.count({
      where: { sectionCRN, dueDate: new Date(dueDate) }
    })
  }

  async getAssessments(user, semesterId, sectionCRN) {
    if (!user && (!sectionCRN || sectionCRN === 'all')) return []

    let whereClause = {}
    if (sectionCRN && sectionCRN !== 'all') {
      whereClause = { sectionCRN }
    } else {
      if (user.isStudent) {
        whereClause = {
          section: {
            semester: semesterId,
            students: { some: { id: user.id } }
          }
        }
      } else if (user.isInstructor) {
        whereClause = {
          section: { semester: semesterId, instructorId: user.id }
        }
      } else if (user.isCoordinator) {
        whereClause = {
          section: { semester: semesterId, program: user.program }
        }
      }
    }

    return await prisma.assessment.findMany({
      where: whereClause,
      include: { section: true },
      orderBy: { sectionCRN: 'asc' }
    })
  }

  async addAssessment(assessment) {
    // Exclude any id field to let Prisma auto-generate
    const { id, ...data } = assessment
    return await prisma.assessment.create({
      data: {
        ...data,
        // Convert dueDate to Date
        dueDate: new Date(data.dueDate)
      },
      include: { section: true }
    })
  }

  async updateAssessment(updatedAssessment) {
    const { id, ...data } = updatedAssessment
    const assessmentId = Number(id)
    return await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        ...data,
        dueDate: new Date(data.dueDate)
      },
      include: { section: true }
    })
  }

  async deleteAssessment(id) {
    const assessmentId = Number(id)
    await prisma.assessment.delete({ where: { id: assessmentId } })
  }

  async generateAssessmentTitle(sectionCRN, type) {
    const count = (await this.countAssessmentsByType(sectionCRN, type)) + 1
    return type === 'project'
      ? `Project Phase ${count}`
      : `${capitalize(type)} ${count}`
  }

  async getAssessmentSummary(user, semesterId) {
    const assessments = await this.getAssessments(user, semesterId, 'all')
    const summaryMap = {}

    assessments.forEach(a => {
      const key = `${a.sectionCRN}-${a.type}`
      if (!summaryMap[key]) {
        summaryMap[key] = {
          sectionCRN: a.sectionCRN,
          courseName: `${a.section.courseCode} - ${a.section.courseName}`,
          type: a.type,
          count: 0,
          effortHours: 0
        }
      }
      summaryMap[key].count += 1
      summaryMap[key].effortHours += a.effortHours || 0
    })

    return Object.values(summaryMap)
  }
}

export default new AssessmentRepo()
