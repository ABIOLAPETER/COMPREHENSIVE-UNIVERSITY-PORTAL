🎓 UNIVERSITY PORTAL SYSTEM — ARCHITECTURE & DEVELOPMENT GUIDELINES
1️⃣ PROJECT OVERVIEW
System Name:

University Academic Management Portal

Purpose:

To manage academic operations including:

User authentication

Student academic records

Course management

Semester registration

Result processing

Graduation eligibility

Administrative academic control

This is a Modular Monolith designed for future microservice extraction.

2️⃣ CORE SYSTEM ACTORS

The system supports three primary roles:

1. STUDENT

Registers courses

Views results

Tracks CGPA

Checks graduation status

2. LECTURER

Uploads student results

Views course enrollments

Updates grades

3. ADMIN

Creates courses

Opens/closes semesters

Creates sessions

Promotes students

Manages departments and faculties

Controls system-wide academic flow

3️⃣ ROLE-BASED ACCESS CONTROL (RBAC)
Roles:

STUDENT

LECTURER

ADMIN

Authorization Rules:
Action	Student	Lecturer	Admin
Login	✅	✅	✅
Register Courses	✅	❌	❌
Upload Results	❌	✅	❌
Create Course	❌	❌	✅
Open Semester	❌	❌	✅
View Own Result	✅	❌	❌
View All Results	❌	✅	✅

All protected routes must:

Verify JWT

Verify role via middleware

Never perform role checks inside controllers.

4️⃣ SYSTEM ARCHITECTURE
Architecture Type:

Modular Monolith

Folder Structure:
src/
  config/
  shared/
  modules/
    identity/
    student/
    course/
    registration/
    result/
    admin/


Each module contains:

controllers/
services/
repositories/
models/
dtos/
routes/

5️⃣ MODULE RESPONSIBILITIES
🔐 Identity Module
Purpose:

Manages authentication and user identity.

Stores:

email

password (hashed)

role

Responsibilities:

Register user

Login user

Issue JWT

Password reset

Role validation

Does NOT:

Handle academic logic

Handle GPA

Handle credit units

👨‍🎓 Student Module
Purpose:

Manages student academic identity.

Stores:

matricNumber

entryType (JAMB | DE)

departmentId

facultyId

currentLevel

totalPassedCreditUnits

currentCGPA

graduationStatus

Business Rules:

JAMB → Must pass 144 credit units

DE → Must pass 130 credit units

Graduation eligibility calculated here

Responsibilities:

Get student profile

Update level

Update passed credit units

Check graduation eligibility

📚 Course Module
Purpose:

Manages course structure.

Stores:

courseCode (e.g., MTH 331)

title

creditUnit

semester (1 or 2)

level

type (CORE | ELECTIVE)

departmentId

Responsibilities:

Create course (Admin only)

Update course

List courses by level and semester

Validate semester match

Validate level match

📝 Registration Module
Purpose:

Handles semester registration.

Stores:

studentId

sessionId

semester

courses[]

totalCreditUnits

registrationStatus (DRAFT | SUBMITTED | LOCKED)

Rules Enforced:

Minimum 18 CU

Maximum 24 CU

Failed courses must be registered first

Course semester must match active semester

Course level must match student level

Responsibilities:

Start registration

Validate course selection

Save registration

Lock registration after submission

This module orchestrates:

Student module

Course module

Result module

📊 Result Module
Purpose:

Manages academic results.

Stores:

studentId

courseId

score

grade

gradePoint

passOrFail

Responsibilities:

Lecturer uploads result

Calculate GPA per semester

Calculate CGPA

Update passed credit units

Trigger graduation eligibility check

🏫 Admin Module
Purpose:

Controls academic lifecycle.

Responsibilities:

Create academic session (e.g., 2025/2026)

Open semester

Close semester

Promote students

Lock results

View reports

6️⃣ MULTI-DEPARTMENT & MULTI-FACULTY SUPPORT

System supports:

Faculty

id

name

Department

id

name

facultyId

Each:

Course belongs to Department

Student belongs to Department

Department belongs to Faculty

This allows:

Filtering courses by department

Admin control per faculty

Scalable academic structure

7️⃣ SYSTEM FLOW (ACADEMIC LIFECYCLE)

Admin creates session.

Admin opens semester.

Students log in.

Students register courses.

Registration module validates:

Credit unit range

Failed course inclusion

Semester matching

Lecturer uploads results.

Result module calculates GPA.

Student module updates credit units.

Graduation eligibility checked.

8️⃣ DEVELOPMENT RULES (NON-NEGOTIABLE)
Rule 1:

Modules must not directly query another module’s database model.

Rule 2:

Business logic must live in services, not controllers.

Rule 3:

Controllers must only:

Accept request

Call service

Return response

Rule 4:

RBAC must be middleware-based.

Rule 5:

Validation logic must be centralized.

Rule 6:

Think in domain actions, not CRUD.

Examples:

PromoteStudent()

SubmitRegistration()

CalculateCGPA()

CheckGraduationEligibility()

9️⃣ DATABASE DESIGN STRATEGY

Initial Phase:
Single MongoDB database.

Collections:

users

students

faculties

departments

courses

registrations

results

sessions

Future Phase:
Each module can be extracted to its own database.

🔟 FUTURE SCALABILITY PATH

After system stabilizes:

Extract Identity Service

Extract Registration Service

Introduce event-driven updates

Possibly rewrite heavy module in Go

Architecture already supports this.

🎯 FINAL OBJECTIVE

You are building:

A domain-driven academic management system

With enforced business rules

With structured RBAC

With scalable modular boundaries

With microservice-ready design

This is not a CRUD tutorial project.

This is a real system.

If you want next, I can write:

🔥 A complete entity relationship breakdown

🔥 A clean API endpoint map

🔥 A milestone-by-milestone build roadmap

🔥 Or a database schema design blueprint

You’re building something serious now.