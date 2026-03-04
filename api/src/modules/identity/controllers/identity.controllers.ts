import { Request, Response } from "express";
import { AuthService } from "../services/identity.service";
import { AppError } from "../../../shared/errors/AppError";
import { logger } from "../../../shared/utils/logger";

const COOKIE_NAME    = "refreshToken";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
  maxAge:   7 * 24 * 60 * 60 * 1000,
  path:     "/",
};

export class IdentityController {

  // POST /auth/signup
  static async signup(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await AuthService.signup({ email, password, firstName, lastName });

      // FIX: refresh token goes in httpOnly cookie — never in the response body
      res.cookie(COOKIE_NAME, result.user.tokens.refreshToken, COOKIE_OPTIONS);

      return res.status(201).json({
        message: "Signup successful",
        user: {
          id:          result.user.id,
          email:       result.user.email,
          role:        result.user.role,
          accessToken: result.user.tokens.accessToken,  // only access token in body
        },
      });

    } catch (err) {
      logger.error("Signup error", err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Signup failed" });
    }
  }

  // POST /auth/login
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        logger.warn("Login attempt with missing credentials");
        return res.status(400).json({ error: "Missing credentials" });
      }

      const result = await AuthService.login({ email, password });

      // FIX: refresh token in httpOnly cookie, access token in body only
      res.cookie(COOKIE_NAME, result.user.tokens.refreshToken, COOKIE_OPTIONS);

      logger.info(`User ${email} logged in successfully`);

      return res.status(200).json({
        message: "Login successful",
        user: {
          id:          result.user.id,
          email:       result.user.email,
          role:        result.user.role,
          accessToken: result.user.tokens.accessToken,
        },
      });

    } catch (err) {
      logger.error("Login error", err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Login failed" });
    }
  }

  // POST /auth/refresh
  static async refreshToken(req: Request, res: Response) {
    try {
      // FIX: read from httpOnly cookie — not req.body
      const token = req.cookies?.[COOKIE_NAME];

      if (!token) {
        logger.warn("Refresh attempt with no cookie");
        return res.status(401).json({ error: "No refresh token provided" });
      }

      // FIX: service expects { refreshToken } object, not a plain string
      const result = await AuthService.refreshTokens({ refreshToken: token });

      // Rotate: set new refresh token in cookie
      res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

      return res.status(200).json({
        message:     "Token refreshed",
        accessToken: result.accessToken,
      });

    } catch (err) {
      logger.error("Refresh token error", err);
      // Clear the cookie on any auth failure — forces re-login
      res.clearCookie(COOKIE_NAME);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Token refresh failed" });
    }
  }

  // POST /auth/logout
  static async logout(req: Request, res: Response) {
    try {
      // FIX: read from httpOnly cookie — not req.body
      const token = req.cookies?.[COOKIE_NAME];

      if (!token) {
        return res.status(400).json({ error: "No refresh token provided" });
      }

      await AuthService.logout(token);

      // Always clear the cookie on logout
      res.clearCookie(COOKIE_NAME);

      return res.status(200).json({ message: "Logged out successfully" });

    } catch (err) {
      logger.error("Logout error", err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Logout failed" });
    }
  }

  // GET /auth/users
  static async getUsers(req: Request, res: Response) {
    try {
      const users = await AuthService.getUsers();

      return res.status(200).json({ message: "Users fetched", users });

    } catch (err) {
      logger.error("Get users error", err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Could not get users" });
    }
  }
}