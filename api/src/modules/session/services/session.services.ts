
import { ISession, SessionModel } from "../model/session.model";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError";
import { validateSessionCreation } from "../../../shared/utils/validate";
import { CreateSessionDto, ActivateSessionDto } from "../dtos/session.dtos";
import { redisClient } from "../../../shared/utils/redis";

export class SessionService {

    static async createSession(data: CreateSessionDto): Promise<ISession> {
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
        await redisClient.del(`sessions:all`)

        return session;
    }

    // Activate session
    // ↓
    static async activateSession(data: ActivateSessionDto): Promise<ISession> {
        const session = await SessionModel.findById(data.sessionId);
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
            await redisClient.del(`sessions:active`)
            return session;
        }
    }


    static async getActiveSession(): Promise<ISession> {
        const cacheKey = `sessions:active`
        const cached = await redisClient.get(cacheKey)
        if (cached) return JSON.parse(cached);

        const session = await SessionModel.findOne({ isActive: true });
        if (!session) {
            throw new NotFoundError("No active session found");
        }
        await redisClient.setex(cacheKey, 2160000, JSON.stringify(session))
        return session;
    }

    static async getAllSessions(): Promise<ISession[]> {
        const cacheKey = `sessions:all`
        const cached = await redisClient.get(cacheKey)
        if (cached) return JSON.parse(cached);
        const sessions = await SessionModel.find().sort({ createdAt: -1 });
        await redisClient.setex(cacheKey, 2160000, JSON.stringify(sessions))

        return sessions;
    }

}