import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "../src/modules/identity/routes/identity.routes";
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

const app = express();
// Middlewares
app.use(cors());
app.use(express.json());
app.use(helmet());


connectDB()


app.use(requestContextMiddleware)
app.use(gatewayRateLimiter);
app.use(attachRedis)
app.use(log)

app.use('/v1/api/auth', authRoutes);
app.use('/v1/api/session', sessionRouter);
app.use('/v1/api/semester', semesterRouter);
app.use('/v1/api/departments', departmentRouter);
app.use('/v1/api/faculties', facultyRouter);
app.use('/v1/api/register', registrationRouter);
app.use('/v1/api/course', courseRouter);
app.use('/v1/api/result', resultRouter);
app.use('/v1/api/students', studentRouter);
app.use('v1/api/cgpa', cgpaRouter)
app.use('v1/api/gpa', gpaRouter)

export default app;
