import { SessionService } from "../services/session.services";
import { Request, Response, NextFunction } from "express";
import { ActivateSessionDto, CreateSessionDto } from "../dtos/session.dtos";

export class SessionController {
    static async createSession(
        req: Request<{}, {}, CreateSessionDto>, 
        res: Response,
        next: NextFunction
    ) {
        try {
            const session = await SessionService.createSession(req.body);
            res.status(201).json({
                success: true,
                message: "Session created successfully",
                data: session,
            });
        } catch (err) {
            next(err)
            }

    }




    static async activateSession(
        req: Request<ActivateSessionDto>, 
        res: Response,
        next: NextFunction
    ) {
    try {
        
        const session = await SessionService.activateSession(req.params);
        res.status(200).json({
            success: true,
            message: "Session activated successfully",
            data: session,
        });
    } catch (err) {
        next(err)
    }
}


    static async getActiveSession(
        req: Request, 
        res: Response,
        next: NextFunction
    ) {
    try {
        const session = await SessionService.getActiveSession();
        res.status(200).json({
            success: true,
            message: "Active session retrieved successfully",
            data: session,
        });
    } catch (err) {
       next(err)
    }
}

    static async getAllSessions(
        req: Request, 
        res: Response,
        next: NextFunction
    ) {
    try {
        const sessions = await SessionService.getAllSessions();
        res.status(200).json({
            success: true,
            message: "All Sessions retrieved successfully",
            sessions,
        });
    } catch (err) {
        next(err)
    }
}
}