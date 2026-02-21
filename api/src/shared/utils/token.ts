import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env";
import { Role } from "../../modules/identity/models/identity.models";
interface AccessTokenPayload {
    userId: string;
    role: Role;
}

/**
 * Generates a short-lived access token (JWT)
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
    if (!env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }

    return jwt.sign(
        {
            sub: payload.userId,
            role: payload.role,
        },
        env.JWT_SECRET,
        {
            expiresIn: "15m",
            issuer: "identity-service",
        }
    );
}

export function generateRefreshToken(): string {
    return crypto.randomBytes(64).toString("hex");
}


export function hashToken(token: string): string {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}