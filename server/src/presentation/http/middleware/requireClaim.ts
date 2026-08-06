import type { Request, Response, NextFunction } from "express";
import { WILDCARD_CLAIM } from "../../../application/claims/claimsCatalog.js";

export function makeRequireClaim(claim: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const claims = req.claims?.claims ?? [];
    if (claims.includes(WILDCARD_CLAIM) || claims.includes(claim)) {
      return next();
    }
    return res.status(403).json({ error: "Forbidden" });
  };
}
