import { SessionService } from "../services/session.services";
import { Request, Response } from "express";
import { logger } from "../../../shared/utils/logger";
import { AppError } from "../../../shared/errors/AppError";



export class SessionController {
    static async createSession(req: Request, res: Response) {
        try {
            const { startYear, endYear } = req.body;
            const session = await SessionService.createSession({
                startYear,
                endYear,
            });
            res.status(201).json({
                message: "Session created successfully",
                session,
            });
        } catch (err) {
            logger.error("Create session error", err);

            if (err instanceof AppError) {
                return res.status(err.statusCode).json({ error: err.message });
            }

            return res.status(500).json({ error: "Internal server error" });
        }

    }




    static async activateSession(req: Request, res: Response) {
    try {
        const { sessionId } = req.params;
        
        const session = await SessionService.activateSession(sessionId.toString());
        res.status(200).json({
            message: "Session activated successfully",
            session,
        });
    } catch (err) {
        logger.error("Activate session error", err);
        res.status(400).json(
            { error: err instanceof AppError ? err.message : "Activate session failed" }
        );
    }
}


    static async getActiveSession(req: Request, res: Response) {
    try {
        const session = await SessionService.getActiveSession();
        res.status(200).json({
            message: "Active session retrieved successfully",
            session,
        });
    } catch (err) {
        logger.error("Get active session error", err);
        res.status(400).json(
            { error: err instanceof AppError ? err.message : "Get active session failed" }
        );
    }
}

    static async getAllSessions(req: Request, res: Response) {
    try {
        const sessions = await SessionService.getAllSessions();
        res.status(200).json({
            message: "Sessions retrieved successfully",
            sessions,
        });
    } catch (err) {
        logger.error("Get all sessions error", err);
        res.status(400).json(
            { error: err instanceof AppError ? err.message : "Get all sessions failed" }
        );
    }
}
}