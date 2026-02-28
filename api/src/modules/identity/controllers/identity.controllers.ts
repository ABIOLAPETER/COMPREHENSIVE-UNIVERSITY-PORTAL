import { AuthService } from "../services/identity.service";
import { Request, Response } from "express";
import { logger } from "../../../shared/utils/logger";
import {  AppError } from "../../../shared/errors/AppError";

export class IdentityController {
    static async signup(req: Request, res: Response) {
        try {
            const { email, password, firstName, lastName} = req.body;
            if (!email || !password || !firstName || !lastName) {

                return res.status(400).json({ error: "Missing required fields" });
             }
            const result = await AuthService.signup({
                email,
                password,
                firstName,
                lastName
            });
            res.status(201).json({
                message: "Signup successful",
                ...result,
            });
        } catch (err) {
            logger.error("Signup error", err);
            res.status(400).json(
                { error: err instanceof AppError ? err.message : "Signup failed" }
            );
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;   
            if (!email || !password) {
                logger.warn("Login attempt with missing credentials");
                return res.status(400).json(
                    { error: "Missing credentials" }
                );
            }
            const result = await AuthService.login({
                email,
                password
            });

            logger.info(`User ${email} logged in successfully`)
            res.status(200).json({
                message: "Login successful",
                ...result,
            });
        } catch (err) {
            logger.error("Login error", err);
            res.status(401).json({ error: err instanceof AppError ? err.message : "Invalid credentials" });
        }
}


    static async refreshToken(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                logger.warn("Refresh token attempt with missing token");
                return res.status(400).json({ error: "Missing refresh token" }
                );
            }
            const result = await AuthService.refreshTokens(refreshToken);
            res.status(200).json({
                message: "Token refreshed",
                ...result,
            });
        } catch (err) {
            logger.error("Refresh token error", err);
            res.status(401).json({ error: err instanceof AppError ? err.message : "Invalid refresh token" });
        }   

}

    static async logout(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;  
            await AuthService.logout(refreshToken);
            res.status(200).json({ message: "Logged out successfully" });
        } catch (err) {
            logger.error("Logout error", err);
            res.status(400).json(
                { error: err instanceof AppError ? err.message : "Logout failed" }
            );
        }
    }
    static async getUsers(req: Request, res: Response) {
        try {
            const users = await AuthService.getUsers();
            res.status(200).json({ message: "Got Users" ,
                users
             });
        } catch (err) {
            logger.error("getting users error", err);
            res.status(400).json(
                { error: err instanceof AppError ? err.message : "couldnt get users" }
            );
        }
    }
}