import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { promises as fs } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const prisma = new PrismaClient()

// Function to load JSON files
async function loadJSON(path) {
  const filePath = join(dirname(__dirname), path)
  const data = await fs.readFile(filePath, 'utf8')
  return JSON.parse(data)
}

async function seedAssessmentTypes() {
  console.log('Seeding assessment types...')
  const assessmentTypes = await loadJSON('data/assessment-types.json')
  for (const type of assessmentTypes) {
    await prisma.assessmentType.upsert({
      where: { id: type.id },
      update: {},
      create: type,
    })
  }
}

async function seedSemesters() {
  console.log('Seeding semesters...')
  const semesters = await loadJSON('data/semesters.json')
  for (const semester of semesters) {
    await prisma.semester.upsert({
      where: { id: semester.id },
      update: {},
      create: semester,
    })
  }
}

async function seedUsers() {
  console.log('Seeding users...')
  const users = await loadJSON('data/users.json')
  for (const user of users) {
    // Remove registeredSections from user data as it's a relation
    const { registeredSections, ...userData } = user
    
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: userData,
    })
  }
}

async function seedSections() {
  console.log('Seeding sections...')
  const sections = await loadJSON('data/sections.json')
  for (const section of sections) {
    await prisma.section.upsert({
      where: { crn: section.crn },
      update: {},
      create: section,
    })
  }
}

async function seedUserSectionRelations() {
  console.log('Seeding user-section relations...')
  const users = await loadJSON('data/users.json')
  for (const user of users) {
    if (user.registeredSections && user.registeredSections.length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          registeredSections: {
            connect: user.registeredSections.map(section => ({
              crn: section.crn
            }))
          }
        }
      })
    }
  }
}

async function seedAssessments() {
  console.log('Seeding assessments...')
  const assessments = await loadJSON('data/assessments.json')
  for (const assessment of assessments) {
    await prisma.assessment.upsert({
      where: { id: assessment.id },
      update: {},
      create: {
        ...assessment,
        dueDate: new Date(assessment.dueDate)
      },
    })
  }
}

async function seedComments() {
  console.log('Seeding comments...')
  const comments = await loadJSON('data/comments.json')
  // First pass: Create all comments without replies
  for (const comment of comments) {
    await prisma.comment.upsert({
      where: { id: comment.id },
      update: {},
      create: {
        ...comment,
        createdDate: new Date(comment.createdDate)
      },
    })
  }
}

async function main() {
  try {
    // Seed in order of dependencies
    await seedAssessmentTypes()
    await seedSemesters()
    await seedUsers()
    await seedSections()
    await seedUserSectionRelations()
    await seedAssessments()
    await seedComments()
    
    console.log('Database seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
