# Mizān Project Phase 2 - Grading Sheet Functionality Documentation

## Database Schema Design
- [x] Properly defined Prisma schema with all required models:
  - User model with proper fields and relations
  - Section model with proper fields and relations
  - Assessment model with proper fields and relation to Section
  - Comment model with proper fields and relations (author, section, and self-reference)
  - AssessmentType model for assessment type options
  - Semester model for semester data

- [x] Properly implemented many-to-many relationship between User and Section
- [x] Properly implemented one-to-many relationships between models
- [x] Appropriate field types and constraints
- [x] Auto-increment IDs for Assessment and Comment models
- [x] Proper self-reference relationship in Comment model for replies

## Database Repositories Implementation

### UserRepository
- [x] Implemented getUsers() method to fetch all users from database
- [x] Implemented getUserById(id) method to fetch a specific user by ID
- [x] Implemented getUserByEmail(email) method to fetch a user by email
- [x] Implemented login(email, password) method to authenticate users
- [x] Implemented getStudentCourseWorkload(studentId, semesterId) to calculate student workload
- [x] Implemented proper error handling for database operations

### CourseRepository
- [x] Implemented getSemesters() method to fetch all semesters
- [x] Implemented getSections(user, semesterId) to fetch sections filtered by user and semester
- [x] Implemented getSectionDetails(crn) to fetch detailed section information
- [x] Implemented createAssessment(assessment) to add new assessments
- [x] Implemented updateAssessment(assessment) to modify existing assessments
- [x] Implemented deleteAssessment(id) to remove assessments
- [x] Implemented getAssessmentTypes() to fetch all assessment types
- [x] Implemented createComment(comment) to add new comments
- [x] Implemented proper error handling for database operations

## Database Seeding
- [x] Properly implemented seed.js to populate the database with initial data
- [x] Created modular seed functions for each entity type
- [x] Properly handled relationships during seeding
- [x] Implemented upsert mechanism to avoid duplicate records

## Code Quality and Best Practices
- [x] Used Prisma client efficiently for database operations
- [x] Implemented proper database-level filtering and aggregation
- [x] Maintained consistent error handling throughout repositories
- [x] Properly managed database connections
- [x] Followed naming conventions and code organization
- [x] Added appropriate comments for code clarity

## Unit Testing
- [x] Tested all repository methods with various scenarios
- [x] Ensured proper error handling in edge cases
- [x] Tested with different user roles (student, instructor)
- [x] Verified data integrity across relationships

## Additional Requirement Implementations
- [x] Auto-assignment of IDs for new entities
- [x] Setting createdBy to current logged-in user for new entities
- [x] Setting createdDate to current date/time for new entities
- [x] Proper handling of registeredSections format in User model
