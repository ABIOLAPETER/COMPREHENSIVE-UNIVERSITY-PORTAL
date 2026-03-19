import express from "express";
import cors from "cors";
import helmet from "helmet";
import identityRouter from "./modules/identity/routes/identity.routes";
import { requestContextMiddleware } from "./shared/middleware/globalContextmidlleware";
import { gatewayRateLimiter } from "./shared/middleware/rate-limiter.midlleware";
import { attachRedis } from "./shared/middleware/redis.middleware";
import { log } from "./shared/middleware/routehelper";
import sessionRouter from "./modules/session/routes/session.routes";
import semesterRouter from "./modules/semester/routes/semester.routes";
import facultyRouter from "./modules/faculty/routes/faculty.routes";
import resultRouter from "./modules/result/routes/result.routes";
import registrationRouter from "./modules/registration/routes/registration.routes";
import courseRouter from "./modules/course/routes/course.routes";
import departmentRouter from "./modules/department/routes/department.routes";
import studentRouter from "./modules/student/routes/student.routes";
import gpaRouter from "./modules/result/routes/gpa.routes";
import cgpaRouter from "./modules/result/routes/cgpa.routes";
import { connectDB } from "./config/Database";
import healthCheck from "./modules/identity/routes/health.routes";
import { errorHandler } from "./shared/middleware/error.middleware";
const app = express();
// Middlewares
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));

app.use(express.json());
app.use(helmet());


connectDB()


app.use(requestContextMiddleware)
app.use(gatewayRateLimiter);
app.use(attachRedis)
app.use(log)

app.use('/v1/api/auth', identityRouter);
app.use('/v1/api/session', sessionRouter);
app.use('/v1/api/semesters', semesterRouter);
app.use('/v1/api/departments', departmentRouter);
app.use('/v1/api/faculties', facultyRouter);
app.use('/v1/api/registrations', registrationRouter);
app.use('/v1/api/courses', courseRouter);
app.use('/v1/api/results', resultRouter);
app.use('/v1/api/students', studentRouter);
app.use('/v1/api/cgpa', cgpaRouter)
app.use('/v1/api/gpa', gpaRouter)
app.use('/health', healthCheck)

app.use(errorHandler)
export default app;
