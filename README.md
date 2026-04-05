# Comprehensive University Portal API

A production-ready REST API for managing university academic operations — built with Node.js, TypeScript, and MongoDB. The system handles student admissions, course registration, fee payments, faculty and department management, semester workflows, result management, lecturer management, and role-based access control for students, lecturers, and administrators.

**Live API:** https://comprehensive-university-portal-production-6f10.up.railway.app

---

## Features

**Authentication & Security**
- JWT-based authentication with access and refresh token rotation
- HttpOnly cookies for secure token storage
- Role-based access control (Admin, Student, Lecturer)
- Rate limiting with Redis backing
- Token blacklisting on logout
- Logout from all devices

**Admissions**
- Admin-managed admission database
- Student account activation via JAMB registration number
- Automatic matric number generation on activation
- Entry type support — UTME and Direct Entry

**Academic Administration**
- Faculty and department management
- Course creation with automatic level and semester derivation from course code
- Session and semester lifecycle management (open, lock, close)
- Student profile management
- Admin dashboard stats

**Course Registration**
- Draft → Submit → Approve workflow
- Carry-over course detection based on published results
- Credit unit validation (18–24 unit range enforced)
- Prevents registration above current level unless carry-over
- Admin approval and rejection of submitted registrations
- Registration history

**Fee Payments**
- Paystack payment integration
- Payment initiation and verification
- Webhook handling for automatic payment confirmation
- Fee payment required before registration submission

**Results & GPA**
- Lecturer result entry per course (bulk upload)
- Admin result publishing — per result, per course, per semester
- GPA calculation per semester
- CGPA calculation across all sessions
- Full academic transcript grouped by session and semester

**Lecturer Management**
- Admin creates lecturer accounts
- Course assignment per lecturer
- Lecturer views assigned courses and registered students
- Bulk result upload per course

**Infrastructure**
- Redis caching for performance-critical routes
- Structured logging with Winston
- Global error handling with custom AppError classes
- Environment-based configuration
- Deployed on Railway

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Cache | Redis (ioredis) |
| Auth | JWT (jsonwebtoken) |
| Payments | Paystack |
| Logging | Winston |
| Deployment | Railway |

---

## Project Structure

```
api/
├── src/
│   ├── config/
│   ├── modules/
│   │   ├── identity/        # Auth — login, logout, refresh, activation
│   │   ├── admission/       # Admission records management
│   │   ├── student/         # Student profiles
│   │   ├── lecturer/        # Lecturer management and result upload
│   │   ├── faculty/         # Faculty management
│   │   ├── department/      # Department management
│   │   ├── course/          # Course management
│   │   ├── registration/    # Course registration workflow
│   │   ├── result/          # Results and grading
│   │   ├── gpa/             # GPA per semester
│   │   ├── cgpa/            # CGPA across sessions
│   │   ├── semester/        # Semester management
│   │   ├── session/         # Academic session management
│   │   ├── Payments/        # Paystack payment integration
│   │   └── admin/           # Admin dashboard and management
│   └── shared/
│       ├── errors/          # Custom AppError classes
│       ├── middleware/      # Auth, rate limiting, request context
│       └── utils/           # Logger, Redis client, helpers
├── dist/
└── package.json
```

---

## API Reference

Base URL: `https://comprehensive-university-portal-production-6f10.up.railway.app/v1/api`

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login | Public |
| POST | `/auth/activate` | Activate student account | Public |
| POST | `/auth/logout` | Logout | Required |
| POST | `/auth/logout-all` | Logout all devices | Required |
| POST | `/auth/refresh` | Refresh access token | Public |
| PATCH | `/auth/change-password` | Change password | Required |
| GET | `/auth/users` | Get all users | Admin |

### Admin
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/admin/stats` | Dashboard statistics | Admin |
| GET | `/admin/students` | All students | Admin |
| GET | `/admin/lecturers` | All lecturers | Admin |
| GET | `/admin/courses` | All courses | Admin |
| PATCH | `/admin/reset-password/:userId` | Reset user password | Admin |

### Students
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/students/user/:userId` | Get student profile | Required |

### Faculties
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/faculties` | Get all faculties | Required |
| POST | `/faculties` | Create faculty | Admin |
| PATCH | `/faculties/:id` | Update faculty | Admin |
| DELETE | `/faculties/:id` | Delete faculty | Admin |

### Departments
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/departments` | Get all departments | Required |
| GET | `/departments?faculty=id` | Filter by faculty | Required |
| GET | `/departments/:id` | Get single department | Required |
| POST | `/departments` | Create department | Admin |
| PATCH | `/departments/:id` | Update department | Admin |
| DELETE | `/departments/:id` | Delete department | Admin |

### Courses
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/courses?department=id` | Get courses by department | Required |
| GET | `/courses/eligible/:studentId` | Get eligible courses for student | Required |
| POST | `/courses` | Create course | Admin |
| PATCH | `/courses/:id` | Update course | Admin |

### Course Registration
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/registrations/draft` | Create draft registration | Student |
| GET | `/registrations/current` | Get current registration | Student |
| GET | `/registrations/my-registrations` | Registration history | Student |
| GET | `/registrations` | Get all registrations | Admin |
| GET | `/registrations?status=SUBMITTED` | Filter by status | Admin |
| POST | `/registrations/:id/courses` | Add course to draft | Student |
| DELETE | `/registrations/:id/courses/:courseId` | Remove course from draft | Student |
| PATCH | `/registrations/:id/submit` | Submit registration | Student |
| PATCH | `/registrations/:id/approve` | Approve registration | Admin |
| PATCH | `/registrations/:id/reject` | Reject registration | Admin |

### Payments
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/payments/initiate` | Initiate fee payment | Student |
| GET | `/payments/verify/:reference` | Verify payment | Student |
| POST | `/payments/webhook` | Paystack webhook | Public |
| GET | `/payments/my-payments` | My payment history | Student |

### Semesters & Sessions
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/semesters/active` | Get active semester | Required |
| POST | `/semesters` | Create semester | Admin |
| PATCH | `/semesters/:id/activate` | Activate semester | Admin |
| PATCH | `/semesters/lock` | Lock registration | Admin |
| GET | `/session/active` | Get active session | Required |
| POST | `/session` | Create session | Admin |
| PATCH | `/session/:id/activate` | Activate session | Admin |

### Results
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/results/my-results` | My published results | Student |
| GET | `/results/my-results?session=id` | Results by session | Student |
| GET | `/results/my-results/:courseId` | Result for course | Student |
| GET | `/results/transcript` | Full academic transcript | Student |
| POST | `/results/create` | Create draft result | Admin |
| PATCH | `/results/publish/result/:resultId` | Publish single result | Admin |
| PATCH | `/results/publish/course/:courseId` | Publish by course | Admin |
| PATCH | `/results/publish/semester/:semesterId` | Publish by semester | Admin |

### GPA & CGPA
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/gpa/my-gpa` | Current semester GPA | Student |
| GET | `/gpa/my-gpa?semesterId=x&sessionId=y` | GPA for specific semester | Student |
| GET | `/cgpa/my-cgpa` | Cumulative GPA | Student |

### Lecturers
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/lecturers` | Create lecturer | Admin |
| POST | `/lecturers/:id/courses/:courseId` | Assign course | Admin |
| DELETE | `/lecturers/:id/courses/:courseId` | Remove course | Admin |
| GET | `/lecturers/my-courses` | My assigned courses | Lecturer |
| GET | `/lecturers/my-students` | My registered students | Lecturer |
| GET | `/lecturers/profile` | My profile | Lecturer |
| PATCH | `/lecturers/profile` | Update profile | Lecturer |
| POST | `/lecturers/courses/:courseId/results` | Upload results | Lecturer |
| GET | `/lecturers/courses/:courseId/results` | View results | Lecturer |

---

## Registration Workflow

```
Admin uploads admission list
        ↓
Student receives activation link
        ↓
Student activates account with JAMB reg number
        ↓
Matric number assigned automatically
        ↓
Student creates DRAFT registration
        ↓
Student adds courses (18–24 credit units)
        ↓
Student pays school fees via Paystack
        ↓
Student submits registration → SUBMITTED
        ↓
Admin reviews and approves → APPROVED
        ↓
Lecturer uploads results
        ↓
Admin publishes results
        ↓
GPA and CGPA calculated automatically
```

---

## Running Locally

**Prerequisites:** Node.js 18+, MongoDB, Redis

```bash
git clone https://github.com/ABIOLAPETER/COMPREHENSIVE-UNIVERSITY-PORTAL.git
cd COMPREHENSIVE-UNIVERSITY-PORTAL/api
npm install
cp .env.example .env
# Fill in your values
npm run dev
```

**Environment variables:**
```env
PORT=2003
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
REDIS_URL=redis://localhost:6379
ADMIN_EMAIL=your_admin_email
PAYSTACK_SECRET_KEY=sk_test_your_key
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
```

---

## Author

**Abiola Peter Boluwatife**
- GitHub: [@ABIOLAPETER](https://github.com/ABIOLAPETER)
- Email: peterboluwatife69@gmail.com

---

## License

MIT
