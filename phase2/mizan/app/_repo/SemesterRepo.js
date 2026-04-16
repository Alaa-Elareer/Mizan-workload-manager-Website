import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function getSemesters() {
  return await prisma.semester.findMany({
    orderBy: {
      id: 'asc'
    }
  });
}

export async function getDefaultSemesterId() {
  const defaultSemester = await prisma.semester.findFirst({
    where: {
      isDefault: true
    }
  });
  return defaultSemester?.id || null;
}
