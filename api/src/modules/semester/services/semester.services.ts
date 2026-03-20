import { ISemester, SemesterModel, SemesterNames } from "../model/semester.model";
import { SessionModel } from "../../session/model/session.model";
import { BadRequestError, ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError";
import { validateSemesterCreation } from "../../../shared/utils/validate";
import { redisClient } from "../../../shared/utils/redis";
import { CreateSemesterDto } from "../dtos/semester.dtos";

const ACTIVE_SEMESTER_KEY = "semester:active";

export class SemesterService {

  static async createSemester(data: CreateSemesterDto): Promise<ISemester> {
    validateSemesterCreation(data);

    const { name, sessionId } = data;

    const existingSession = await SessionModel.findById(sessionId);
    if (!existingSession) {
      throw new NotFoundError("Session not found");
    }

    const existingSemester = await SemesterModel.findOne({ name, session: sessionId });
    if (existingSemester) {
      throw new ConflictError("Semester with this name already exists in the session");
    }

    const semester = await SemesterModel.create({ name, session: sessionId });

    // Invalidate active semester cache — new semester may affect active state
    await redisClient.del(ACTIVE_SEMESTER_KEY);

    return semester;
  }

  static async activateSemester(semesterId: string): Promise<ISemester> {
    const semester = await SemesterModel.findById(semesterId);
    if (!semester) {
      throw new NotFoundError("Semester not found");
    }

    if (semester.isActive) {
      return semester;
    }

    const session = await SessionModel.findById(semester.session);
    if (!session) {
      throw new NotFoundError("Associated session not found");
    }

    if (!session.isActive) {
      throw new ValidationError("Cannot activate semester because its session is not active");
    }

    await SemesterModel.updateMany(
      { session: semester.session, isActive: true },
      { isActive: false }
    );

    semester.isActive = true;
    const updated = await semester.save();

    // Invalidate cache — active semester changed
    await redisClient.del(ACTIVE_SEMESTER_KEY);

    return updated;
  }

  static async getActiveSemester(): Promise<ISemester> {
    const cached = await redisClient.get(ACTIVE_SEMESTER_KEY);
    if (cached) return JSON.parse(cached);

    const semester = await SemesterModel
      .findOne({ isActive: true })
      .populate("session");

    if (!semester) {
      throw new NotFoundError("No active semester found");
    }

    const session = semester.session as any;
    if (!session?.isActive) {
      throw new ValidationError("Active semester belongs to an inactive session");
    }

    await redisClient.setex(ACTIVE_SEMESTER_KEY, 3600, JSON.stringify(semester));

    return semester;
  }

  static async lockRegistration(): Promise<ISemester> {
    const semester = await this.getActiveSemester();

    if (semester.isLocked) {
      return semester;
    }

    const updated = await SemesterModel.findByIdAndUpdate(
      semester._id,
      { isLocked: true },
      { new: true }
    );

    if(!updated){
      throw new BadRequestError("cannot update")
    }

    // Invalidate cache — semester state changed
    await redisClient.del(ACTIVE_SEMESTER_KEY);

    return updated;
  }
}