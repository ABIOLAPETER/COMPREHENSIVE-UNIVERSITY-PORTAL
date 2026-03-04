import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";
import { env } from "../../config/env";
import { getContext } from "../utils/getContext";
import { requestContext } from "../../config/requestcontext";

export interface AuthPayload {
  userId: string;
  role: string;
}

export const validateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const requestId = req.headers["x-request-id"] ?? "unknown";
    logger.warn("Missing or invalid token", { requestId });

    return res.status(401).json({
      success: false,
      message: "Missing or invalid token",
      requestId,
    });
  }

  const token = authHeader.split(" ")[1];

  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  try {
    // jwt.verify returns the raw decoded payload — { sub, role, iat, exp, iss }
    // The token is signed with `sub: payload.userId` so userId lives at decoded.sub
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

    const userId = decoded.sub as string; // sub === userId
    const role   = decoded.role as string;

    // Request-scoped context
    const context = getContext();
    context.userId = userId;

    // Normalise onto req.user so all controllers use req.user.userId consistently
    req.user = { userId, role };

    req.headers["x-user-id"] = userId;
    req.headers["x-role"]    = role;

    logger.info("Token verified", {
      requestId: context.requestId,
      role,
    });

    next();
  } catch (error) {
    const context   = requestContext.getStore();
    const requestId = context?.requestId ?? "unknown";

    logger.error("Invalid or expired token", { error, requestId });

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      requestId,
    });
  }
};

// export function authenticate(req: Request, res: Response, next: NextFunction) {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Missing token" });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;

   
//     next();
//   } catch {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// }


export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden: Admins only" });
    }
    next();
}