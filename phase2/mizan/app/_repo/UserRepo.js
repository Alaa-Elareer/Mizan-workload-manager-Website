import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

class UserRepo {
  async getUser(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        registeredSections: true
      }
    });

    if (!user) return null;

    // Add computed properties
    user.name = `${user.firstName} ${user.lastName}`;
    user.isStudent = user.role === "Student";
    user.isInstructor = user.role === "Instructor";
    user.isCoordinator = user.role === "Coordinator";

    // Remove password for security
    delete user.password;
    
    return user;
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        registeredSections: true
      }
    });

    // Check if user exists and password matches
    if (!user || user.password !== password) {
      throw new Error("Incorrect username or password.");
    }

    // Add computed properties
    user.name = `${user.firstName} ${user.lastName}`;
    user.isStudent = user.role === "Student";
    user.isInstructor = user.role === "Instructor";
    user.isCoordinator = user.role === "Coordinator";

    // Remove password for security
    delete user.password;
    
    return user;
  }
}

export default new UserRepo();
