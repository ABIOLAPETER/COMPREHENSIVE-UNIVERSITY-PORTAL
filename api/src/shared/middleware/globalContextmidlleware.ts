import { Request, Response, NextFunction } from "express";
import { requestContext } from "../../config/requestcontext";
import { randomUUID } from "crypto";

export const requestContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const context = {
    requestId:
      (req.headers["x-request-id"] as string) ??
      randomUUID(),
    userId: req.headers["x-user-id"] as string,
  };

  requestContext.run(context, () => next());
};
