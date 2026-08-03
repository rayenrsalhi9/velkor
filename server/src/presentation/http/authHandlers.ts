import type { Request, Response } from "express";
import type { LoginUser } from "../../application/use-cases/LoginUser.js";
import type { RefreshToken } from "../../application/use-cases/RefreshToken.js";
import type { LogoutUser } from "../../application/use-cases/LogoutUser.js";
import type { GetCurrentUserProfile } from "../../application/use-cases/GetCurrentUserProfile.js";
import { InvalidCredentialsError } from "../../application/errors/InvalidCredentialsError.js";
import { UserNotFoundError } from "../../application/errors/UserNotFoundError.js";
import { InvalidRefreshTokenError } from "../../application/errors/InvalidRefreshTokenError.js";
import { loginSchema } from "./schemas/loginSchema.js";
import type { CookieOptions } from "express";

const REFRESH_COOKIE = "refreshToken";
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

export function makeLoginHandler(loginUser: LoginUser) {
  return async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const tokens = await loginUser.execute(
        parsed.data.email,
        parsed.data.password,
      );
      res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: tokens.refreshTokenExpiresAt.getTime() - Date.now(),
      });
      return res.status(200).json({ accessToken: tokens.accessToken });
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeRefreshHandler(refreshToken: RefreshToken) {
  return async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!rawToken) {
      return res.status(401).json({ error: "Missing refresh token" });
    }

    try {
      const tokens = await refreshToken.execute(rawToken);
      res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: tokens.refreshTokenExpiresAt.getTime() - Date.now(),
      });
      return res.status(200).json({ accessToken: tokens.accessToken });
    } catch (err) {
      if (err instanceof InvalidRefreshTokenError) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeLogoutHandler(logoutUser: LogoutUser) {
  return async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (rawToken) {
      await logoutUser.execute(rawToken);
    }
    res.clearCookie(REFRESH_COOKIE);
    return res.status(200).json({ message: "Logged out" });
  };
}

export function makeMeHandler(getCurrentUserProfile: GetCurrentUserProfile) {
  return async (req: Request, res: Response) => {
    try {
      const profile = await getCurrentUserProfile.execute(req.userId!);
      return res.json(profile);
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        return res.status(401).json({ error: "User not found" });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
