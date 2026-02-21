
import { SessionModel} from "../model/session.model";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError";
import { logger } from "../../../shared/utils/logger";
import {validateSessionCreation} from "../../../shared/utils/validate";


export class SessionService {

    static async createSession(data: {
        startYear: number;
        endYear: number;
    }) {
        const { startYear, endYear } = data;
        if (!startYear || !endYear) {
            throw new ValidationError("Missing required fields");
        }

        validateSessionCreation({ startYear, endYear });

        const name = `${startYear}/${endYear}`;

        if (endYear !== startYear + 1) {
            throw new ValidationError(
                "Academic session must span exactly one year (e.g. 2024/2025)"
            );
        }

        if (await SessionModel.findOne({ name })) {
            throw new ConflictError("Session with this name already exists");
        }

        const session = await SessionModel.create({
            name,
            startYear,
            endYear,
        });

        return session;
    }

    // Activate session
    // ↓
    static async activateSession(sessionId: string) {
        const session = await SessionModel.findById(sessionId);
        if (!session) {
            throw new NotFoundError("Session not found");
        }      
        if (session.isActive) {
            return session; // Already active  
        } else {
            await SessionModel.updateMany({ isActive: true }, { isActive: false });
            // Activate new session
            session.isActive = true;
            await session.save();
            return session;
        }
    }


    static async getActiveSession() {
        const session = await SessionModel.findOne({ isActive: true });
        if (!session) {
            throw new NotFoundError("No active session found");
        }
        return session;
    }

    static async getAllSessions() {
        const sessions = await SessionModel.find().sort({ createdAt: -1 });
        return sessions;
    }

}