import type { Request, Response, NextFunction } from "express";
import type { TokenService } from "../../../application/ports/TokenService.js";

export function makeAuthenticate(tokenService: TokenService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.toLowerCase().startsWith("bearer ") ? header.slice(7) : undefined;
    if (!token) {
      return res.status(401).json({ error: "Missing or malformed token" });
    }

    const payload = tokenService.verifyToken(token, "access");
    if (!payload) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.userId = payload.userId;
    next();
  };
}
