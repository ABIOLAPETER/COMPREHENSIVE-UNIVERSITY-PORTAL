import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { AppError } from "../errors/AppError";

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    logger.error(err);

    let error = err;
    let statusCode = 500;
    let message = "Something went wrong";

    // ===============================
    // Handle known AppErrors
    // ===============================
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    }

    // ===============================
    // Mongoose validation error
    // ===============================
    if (error.name === "ValidationError") {
        statusCode = 400;
        message = error.message;
        error = new AppError(message, statusCode);
    }

    // ===============================
    // Mongoose duplicate key error
    // ===============================
    if ((error as any).code === 11000) {
        statusCode = 409;
        const fields = Object.keys((error as any).keyValue).join(", ");
        message = `Duplicate field value: ${fields}`;
        error = new AppError(message, statusCode);
    }

    // ===============================
    // JWT errors
    // ===============================
    if (error.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token. Please log in again.";
        error = new AppError(message, statusCode);
    }

    if (error.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired. Please log in again.";
        error = new AppError(message, statusCode);
    }

    // ===============================
    // Development response
    // ===============================
    if (process.env.NODE_ENV === "development") {
        return res.status(statusCode).json({
            success: false,
            message,
            stack: error.stack,
        });
    }

    // ===============================
    // Production response
    // ===============================
    if (error instanceof AppError && error.isOperational) {
        return res.status(statusCode).json({
            success: false,
            message,
        });
    }

    // ===============================
    // Unknown / programmer error
    // ===============================
    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
}
