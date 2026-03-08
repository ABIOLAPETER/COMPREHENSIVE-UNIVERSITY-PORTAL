# Comprehensive University Portal API

A production-ready REST API for managing university academic operations — built with Node.js, TypeScript, and MongoDB. The system handles student course registration, faculty and department management, semester workflows, result management, and role-based access control for both students and administrators.

**Live API:** https://comprehensive-university-portal-production-6f10.up.railway.app

---

## Features

**Authentication & Security**
- JWT-based authentication with access and refresh token rotation
- HttpOnly cookies for secure token storage
- Role-based access control (Admin, Student)
- Rate limiting with Redis backing
- Token blacklisting on logout

**Academic Administration**
- Faculty and department management
- Course creation with automatic level and semester derivation from course code
- Session and semester lifecycle management (open, lock, close)
- Student profile management

**Course Registration**
- Draft → Submit → Approve workflow
- Carry-over course detection based on published results
- Credit unit validation (18–24 unit range enforced)
- Prevents registration above current level unless carry-over
- Admin approval and rejection of submitted registrations

**Results & GPA**
- Result entry per course per student
- GPA calculation per semester
- CGPA calculation across sessions
- Published/unpublished result states

**Infrastructure**
- Redis caching for performance-critical routes
- Structured logging with Winston
- Global error handling with custom AppError classes
- Environment-based configuration

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
| Logging | Winston |
| Deployment | Railway |

---

## Project Structure

```
api/
├── src/
│   ├── config/          # Database, environment config
│   ├── modules/
│   │   ├── identity/    # Auth — login, logout, refresh, token rotation
│   │   ├── student/     # Student profiles
│   │   ├── faculty/     # Faculty management
│   │   ├── department/  # Department management
│   │   ├── course/      # Course management
│   │   ├── registration/# Course registration workflow
│   │   ├── result/      # Results and grading
│   │   ├── semester/    # Semester management
│   │   └── session/     # Academic session management
│   └── shared/
│       ├── errors/      # Custom AppError classes
│       ├── middleware/  # Auth, rate limiting, request context
│       └── utils/       # Logger, Redis client, helpers
├── dist/                # Compiled output
└── package.json
```

---

## API Reference

Base URL: `https://comprehensive-university-portal-production-6f10.up.railway.app/v1/api`

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login and receive tokens | Public |
| POST | `/auth/logout` | Logout and blacklist token | Required |
| POST | `/auth/refresh` | Refresh access token via cookie | Public |
| GET | `/auth/users` | Get all users | Admin |

### Students
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/students/user/:userId` | Get student profile by user ID | Required |
| GET | `/students` | Get all students | Admin |

### Faculties
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/faculties` | Get all faculties | Required |
| POST | `/faculties` | Create faculty | Admin |

### Departments
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/departments` | Get all departments | Required |
| GET | `/departments?faculty=id` | Filter by faculty | Required |
| POST | `/departments` | Create department | Admin |

### Courses
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/courses` | Get all courses | Required |
| GET | `/courses?department=id` | Filter by department | Required |
| GET | `/courses/eligible/:studentId` | Get eligible courses for student | Required |
| POST | `/courses` | Create course | Admin |

### Course Registration
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/registrations/draft` | Create draft registration | Student |
| GET | `/registrations/current` | Get current semester registration | Student |
| GET | `/registrations` | Get all registrations | Admin |
| GET | `/registrations?status=SUBMITTED` | Filter by status | Admin |
| POST | `/registrations/:id/courses` | Add course to draft | Student |
| DELETE | `/registrations/:id/courses/:courseId` | Remove course from draft | Student |
| PATCH | `/registrations/:id/submit` | Submit registration | Student |
| PATCH | `/registrations/:id/approve` | Approve registration | Admin |
| PATCH | `/registrations/:id/reject` | Reject registration | Admin |

### Semesters & Sessions
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/semesters/active` | Get active semester | Required |
| POST | `/semesters` | Create semester | Admin |
| GET | `/sessions/active` | Get active session | Required |
| POST | `/sessions` | Create session | Admin |

---

## Registration Workflow

```
Student creates DRAFT
        ↓
  Adds courses (18–24 credit units)
        ↓
  Submits registration → status: SUBMITTED
        ↓
  Admin reviews courses
        ↓
  Approves → status: APPROVED
  or
  Rejects → status: REJECTED
```

**Business rules enforced:**
- Students cannot register courses above their current level (unless carry-over)
- All failed (carry-over) courses must be registered before new courses
- Total credit units must be between 18 and 24
- Registration is locked once submitted — no modifications allowed
- Admin can only approve SUBMITTED registrations

---

## Running Locally

**Prerequisites:** Node.js 18+, MongoDB, Redis

```bash
# Clone the repo
git clone https://github.com/ABIOLAPETER/COMPREHENSIVE-UNIVERSITY-PORTAL.git
cd COMPREHENSIVE-UNIVERSITY-PORTAL/api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your values

# Run in development
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
```

---

## Key Design Decisions

**Refresh token rotation** — Every token refresh issues a new refresh token and invalidates the old one, preventing token replay attacks.

**Carry-over detection** — The system queries published results to automatically identify failed courses and enforces their registration before new courses can be added.

**Request serialization on frontend** — Checkbox changes during course registration are queued and processed serially to prevent race conditions from rapid user interactions.

**Targeted cache invalidation** — Rather than clearing entire cache namespaces, only affected keys are invalidated on mutation, reducing unnecessary database load.

---

## Author

**Peter Abiola**
- GitHub: [@ABIOLAPETER](https://github.com/ABIOLAPETER)
- LinkedIn: linkedin.com/in/your-linkedin

---

## License

MIT
