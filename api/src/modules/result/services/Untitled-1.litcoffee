/ Test question:
In your university portal — a student drops a course from their registration. This requires:

Removing the course from the registration document
Updating the student's total registered credit units

Write the transaction for this operation. You have:

RegistrationModel with a courses array and a totalCredits field
StudentModel with a registeredCredits field
The course being dropped has creditUnits: 3
You have registrationId, courseId, studentId available

Take your time 🔥 Sonnet 4.6ExtendedClaude is AI and can make mistakes. Please double-check responses.Share


static async dropCourse(courseId: string, registrationId: string, studentId: string){
    const session = await mongoose.startSession()

    try {
         session.startTransaction();
         const registration = await registrationModel.findById(registrationId, {session})
         if(registration){
            throw new Error("no registration available)
         }

         const course = registration.courses.find(course => courses.course.toString() === courseId)

         if (!course){
            throw new Error("no course found)
         }

         registration.courses.pull(course._id)

         await StudentModel.findByIdAndUpdate(studentId, {registeredCredits: registeredCredits - 3}, {session})

         await session.commitTransaction();
    
      
    } catch (error) {
        await session.abortTransaction();
    throw error;
    } finally{
        session.endSession();
    }
}


SELECT 
    r.status = "APPROVED",
    r.student_id,
    c.title,
    c.credit_units,
FROM registration r JOIN courses c ON r.course_id = c.id 
ORDER BY c.credit_units ASC;

-- students table
id, name, email, level, department_id

-- departments table
id, name, faculty

-- results table
id, student_id, course_title, score, grade, semester

Write a SQL query that:

Gets all students in level 300
Joins with departments to get the department name and faculty
Joins with results to get their grades
Filters only results from "FIRST" semester
Returns student name, department name, faculty, course_title, grade
Orders by student name alphabetically


SELECT
    s.name,
    d.name,
    d.faculty,
    r.course_title,
    r.grade
FROM students s 
JOIN 
    departments d ON s.department_id = d.id,
    results r ON s.id = r.student_id 
WHERE
    s.level = 300
HAVING 
    r.semester = 'FIRST'
ORDER BY s.name ASC
    
    
-- students table
id, name, email, level, department_id

-- results table
id, student_id, score, grade, semester, session

Write a SQL query that:

Joins students with results
Groups by student — calculating their average score and total number of courses taken
Filters only students whose average score is above 60
Filters only results from session "2024/2025"
Returns student name, average score, total courses
Orders by average score highest first

Hints:

AVG() calculates average
COUNT() counts rows
You need both WHERE and HAVING in this query
Round the average score to 2 decimal places using ROUND(AVG(score), 2)

Take your time 🔥


SELECT 
    s.name, 
    avg_score AS ROUND(AVG(r.score), 2),
    COUNT(avg_score) AS total_courses
JOIN results r ON s.id = r.student_id
WHERE 
    r.session = '2024/2025'
GROUP BY 
    s.id
HAVING 
    avg_score > 60,
ORDER BY avg_score DESC


<!-- SELECT
  s.name,
  ROUND(AVG(r.score), 2) AS avg_score,
  COUNT(r.id) AS total_courses
FROM students s
JOIN results r ON s.id = r.student_id
WHERE r.session = '2024/2025'
GROUP BY s.id, s.name
HAVING ROUND(AVG(r.score), 2) > 60
ORDER BY avg_score DESC; -->

SELECT      -- 1. what to return
FROM        -- 2. which table
JOIN        -- 3. bring in other tables
WHERE       -- 4. filter rows
GROUP BY    -- 5. group rows
HAVING      -- 6. filter groups
ORDER BY    -- 7. sort
LIMIT       -- 8. how many



Test question:
You have this Prisma schema:
model Course {
  id            Int            @id @default(autoincrement())
  title         String
  creditUnits   Int
  departmentId  Int
  department    Department     @relation(fields: [departmentId], references: [id])
  registrations Registration[]
}

model Registration {
  id        Int     @id @default(autoincrement())
  status    String
  studentId Int
  courseId  Int
  student   Student @relation(fields: [studentId], references: [id])
  course    Course  @relation(fields: [courseId], references: [id])
}
Write Prisma queries for these three things:

Get all APPROVED registrations and include the course title and creditUnits
Create a new registration with studentId: 5, courseId: 3, status: "PENDING"
Update all PENDING registrations for studentId: 5 to APPROVED

Take your time 🔥


const approvedRegistration = await prisma.Registration.findMany({
    where: {status = 'APPROVED'}
    include: { Courses: true}, 
    select: {
        Courses.title: true,
        Courses.creditUnits: true
    }
});


const newRegistration = await prisma.Registration.create({
    data: {
        status: 'PENDING',
        studentId: 5,
        courseId: 3
    }
})

const updatedRegistration = await prisma.Registration.update({
    where: {
        studentId : 5
    },
    data: {
        status: 'APPROVED'
    }
})

// 1. Get all APPROVED registrations with course details
const approvedRegistrations = await prisma.registration.findMany({
  where: { status: 'APPROVED' },
  select: {
    status: true,
    course: {
      select: {
        title: true,
        creditUnits: true
      }
    }
  }
});

// 2. Create new registration
const newRegistration = await prisma.registration.create({
  data: {
    status: 'PENDING',
    studentId: 5,
    courseId: 3
  }
});

// 3. Update all PENDING registrations for student 5
const updatedRegistrations = await prisma.registration.updateMany({
  where: {
    studentId: 5,
    status: 'PENDING'
  },
  data: { status: 'APPROVED' }
});


You have this Prisma schema:
prismamodel Student {
  id           Int            @id @default(autoincrement())
  name         String
  email        String         @unique
  level        Int
  departmentId Int
  department   Department     @relation(fields: [departmentId], references: [id])
  registrations Registration[]
}

model Department {
  id       Int       @id @default(autoincrement())
  name     String
  faculty  String
  students Student[]
}

model Course {
  id            Int            @id @default(autoincrement())
  title         String
  creditUnits   Int
  registrations Registration[]
}

model Registration {
  id        Int     @id @default(autoincrement())
  status    String
  semester  String
  session   String
  studentId Int
  courseId  Int
  student   Student @relation(fields: [studentId], references: [id])
  course    Course  @relation(fields: [courseId], references: [id])
}
Write Prisma queries for these four things:

Get all level 300 students and include their department name and faculty
Get all APPROVED registrations for session "2024/2025" — include the student name and course title
Count how many PENDING registrations exist in the database
Delete all CANCELLED registrations older than a specific cutoffDate variable — hint: use lt (less than) for date comparison

Take your time — think each one through before writing 🔥

const students = await prisma.student.findMany({
    where: {
        level: 300
    },
    select: {
        level: true,
        department: {
            select : {
                name: true,
                faculty: true
            }
        }
    }
})

const approvedRegistrations = await prisma.registration.findMany({
    where: {
        session : '2024/2025'
    },
    select : {
        session : true,
        student: {
            select : {
                name: true
            }
        },
        course : {
            select : {
                title: true
            }
        }
    }
})

const pendingRegCount = await prisma.registration.count({
    where: {
        status: 'PENDING'
    },
})

static async deleteRegistration(){
    const cutOffDate = new Date()
    try{
       const registrations  =  await prisma.registration.findMany({
        where :{
            createdAt: 
        }
       })
    }catch(err){

    }
} 

i wanted to follow the above method then i noticecd that the registration model has no timestamp for creation so how will this work??


// 1. Level 300 students with department
const students = await prisma.student.findMany({
  where: { level: 300 },
  select: {
    name: true,
    level: true,
    department: {
      select: {
        name: true,
        faculty: true
      }
    }
  }
});

// 2. Approved registrations for 2024/2025
const approvedRegistrations = await prisma.registration.findMany({
  where: {
    status: 'APPROVED',
    session: '2024/2025'
  },
  select: {
    session: true,
    student: {
      select: { name: true }
    },
    course: {
      select: { title: true }
    }
  }
});

// 3. Count pending registrations
const pendingCount = await prisma.registration.count({
  where: { status: 'PENDING' }
});

// 4. Delete old cancelled registrations
const cutoffDate = new Date('2024-01-01');
await prisma.registration.deleteMany({
  where: {
    status: 'CANCELLED',
    createdAt: { lt: cutoffDate }
  }
});

import { redisClient } from '../shared/utils/redis';
static async getStudentResults(studentId: string, session: string) {
    const cacheKey = `results:${studentId}:${session}`
    const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);  // return immediately
  }
  const results = await ResultModel.find({ studentId, session })
    .populate("course", "title creditUnits");
  return results;
  await redisClient.setex(cacheKey, 86400, JSON.stringify(courses));
}


i do not think there is any need for invalidation, why because results in my own view do not change after being publised excepth there are errors which would being check when the result is drafted for change. the only ti,,e we will need to invalidate the cache is if there is a new result to be published so publidhing a result should trigger the invslidation of these cached results 


static async publishResultService(resultId: string) {

    const result = await ResultModel.findByIdAndUpdate(resultId, {status: ResultStatus.PUBLISHED}, {new: true});
    await redisClient.del('results:${result.student}:${result.session}');

    return result;
  }



Do these three things:
Add Redis caching to this function
Design a good cache key
Write the invalidation — where would you call it and what triggers it?


// Cached getter
static async getStudentResults(studentId: string, session: string) {
  const cacheKey = `results:${studentId}:${session}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const results = await ResultModel.find({ studentId, session })
    .populate("course", "title creditUnits");

  await redisClient.setex(cacheKey, 86400, JSON.stringify(results));
  return results;
}

// Invalidation on publish
static async publishResult(resultId: string) {
  const result = await ResultModel.findByIdAndUpdate(
    resultId,
    { status: ResultStatus.PUBLISHED },
    { new: true }
  );

  if (!result) {
    throw new AppError("Result not found", 404);
  }

  await redisClient.del(`results:${result.studentId}:${result.session}`);
  return result;
}
