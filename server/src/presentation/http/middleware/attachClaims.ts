import type { Request, Response, NextFunction } from "express";
import type { GetCurrentUserClaims } from "../../../application/use-cases/GetCurrentUserClaims.js";
import { UserNotFoundError } from "../../../application/errors/UserNotFoundError.js";

export function makeAttachClaims(getCurrentUserClaims: GetCurrentUserClaims) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claims = await getCurrentUserClaims.execute(req.userId!);
      req.claims = claims;
      next();
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        return res.status(401).json({ error: "User not found" });
      }
      next(err);
    }
  };
}
