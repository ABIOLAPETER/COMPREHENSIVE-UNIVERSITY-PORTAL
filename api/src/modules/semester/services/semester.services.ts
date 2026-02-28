import { SemesterModel, SemesterNames } from "../model/semester.model";
import { SessionModel } from "../../session/model/session.model";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError";
import { validateSemesterCreation } from "../../../shared/utils/validate";


export class SemesterService {
    // Implement semester-related business logic here

    static async createSemester(data: {
        name: SemesterNames;
        sessionId: string;
    }) {
        // Validate input data
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

        const semester = await SemesterModel.create({
            name,
            session: sessionId,
        });

        return semester;



        // Check for existing semester
        // Create new semester
    }

    static async activateSemester(semesterId: string) {
        const semester = await SemesterModel.findById(semesterId);
        if (!semester) {
            throw new NotFoundError("Semester not found");
        }
        if (semester.isActive) {
            return semester; // Already active
        }

        const session = await SessionModel.findById(semester.session);
        if (!session) {
            throw new NotFoundError("Associated session not found");
        }

        if (!session.isActive) {
            throw new ValidationError("Cannot activate semester because its session is not active");
        }
        // Deactivate any currently active semester in the same session
        await SemesterModel.updateMany(
            { session: semester.session, isActive: true },
            { isActive: false }
        );
        // Activate the specified semester
        semester.isActive = true;
        return await semester.save();
    }


    static async getActiveSemester() {
        const semester = await SemesterModel
            .findOne({ isActive: true })
            .populate("session");

        if (!semester) {
            throw new NotFoundError("No active semester found");
        }

        const session = semester.session as any;

        if (!session || !session.isActive) {
            throw new ValidationError(
                "Active semester belongs to an inactive session"
            );
        }

        return semester;
    }


    static async lockRegistration() {
        const semester = await this.getActiveSemester()

        if (!semester) {
            throw new NotFoundError("no semester found")
        }

        semester.isLocked = true
        
        await semester.save()
        return semester;
    }

}