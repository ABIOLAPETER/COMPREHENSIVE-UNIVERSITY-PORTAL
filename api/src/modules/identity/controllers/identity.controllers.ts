import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/identity.service";
import { LoginDto, SignupDto } from "../dtos/identity.dto";

const COOKIE_NAME = "refreshToken";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export class IdentityController {

  static healthCheck(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const display = AuthService.healthCheck()

    return res.status(200).json({
      success: true,
      message: "check successful",
      data: display
    })
  }


  // POST /auth/signup
  static async signup(
    req: Request<{}, {}, SignupDto>,
    res: Response,
    next: NextFunction
  ) {
    try {

      const result = await AuthService.signup(req.body);

      // FIX: refresh token goes in httpOnly cookie — never in the response body
      res.cookie(COOKIE_NAME, result.tokens.refreshToken, COOKIE_OPTIONS);

      return res.status(201).json({
        success: true,
        message: "Signup successful",
        data: {
          id: result.id,
          email: result.email,
          role: result.role,
          accessToken: result.tokens.accessToken,  // only access token in body
        },
      });

    } catch (err) {
      next(err)
    }
  }

  // POST /auth/login
  static async login(
    req: Request<{}, {}, LoginDto>,
    res: Response,
    next: NextFunction
  ) {
    try {

      const result = await AuthService.login(req.body);

      // FIX: refresh token in httpOnly cookie, access token in body only
      res.cookie(COOKIE_NAME, result.tokens.refreshToken, COOKIE_OPTIONS);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          id: result.id,
          email: result.email,
          role: result.role,
          accessToken: result.tokens.accessToken,
        },
      });

    } catch (err) {
      next(err)
    }
  }

  // POST /auth/refresh
  static async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // FIX: read from httpOnly cookie — not req.body
      const token = req.cookies?.[COOKIE_NAME];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No refresh token provided"
        });
      }

      // FIX: service expects { refreshToken } object, not a plain string
      const result = await AuthService.refreshTokens({ refreshToken: token });

      // Rotate: set new refresh token in cookie
      res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

      return res.status(200).json({
        success: true,
        message: "Token refreshed",
        data: result.accessToken,
      });

    } catch (err) {
      next(err)
    }
  }

  // POST /auth/logout
  static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const token = req.cookies?.[COOKIE_NAME];

      if (!token) {

        return res.status(401).json({
          success: false,
          message: "No refresh token provided"
        });

      }
      await AuthService.logout(token);
      // Always clear the cookie on logout
      res.clearCookie(COOKIE_NAME);
      return res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });

    } catch (err) {
      next(err)
    }
  }

  // GET /auth/users
  static async getUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const users = await AuthService.getUsers();

      return res.status(200).json(
        {
          success: true,
          message: "Users fetched",
          data: users
        });

    } catch (err) {
      next(err)
    }
  }
}