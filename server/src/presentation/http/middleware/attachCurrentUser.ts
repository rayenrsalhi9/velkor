import type { Request, Response, NextFunction } from "express";
import type { GetCurrentUser } from "../../../application/use-cases/GetCurrentUser.js";
import { UserNotFoundError } from "../../../application/errors/UserNotFoundError.js";

export function makeAttachCurrentUser(getCurrentUser: GetCurrentUser) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.currentUser = await getCurrentUser.execute(req.userId!);
      next();
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        return res.status(401).json({ error: "User not found" });
      }
      next(err);
    }
  };
}
