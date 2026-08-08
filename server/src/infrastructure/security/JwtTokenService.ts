import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import ms from "ms";
import type { StringValue } from "ms";
import type {
  TokenService,
  TokenType,
} from "../../application/ports/TokenService.js";

export class JwtTokenService implements TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiry: StringValue;
  private readonly refreshExpiry: StringValue;

  constructor() {
    this.accessSecret = JwtTokenService.requireSecret(
      process.env.JWT_ACCESS_SECRET,
      "JWT_ACCESS_SECRET",
    );
    this.refreshSecret = JwtTokenService.requireSecret(
      process.env.JWT_REFRESH_SECRET,
      "JWT_REFRESH_SECRET",
    );
    if (this.accessSecret === this.refreshSecret) {
      throw new Error(
        "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different",
      );
    }
    this.accessExpiry = JwtTokenService.parseExpiry(
      process.env.JWT_ACCESS_EXPIRY ?? "15m",
      "JWT_ACCESS_EXPIRY",
    );
    this.refreshExpiry = JwtTokenService.parseExpiry(
      process.env.JWT_REFRESH_EXPIRY ?? "7d",
      "JWT_REFRESH_EXPIRY",
    );
  }

  private static requireSecret(
    value: string | undefined,
    varName: string,
  ): string {
    if (!value || value.trim() === "") {
      throw new Error(`${varName} must be set and non-empty`);
    }
    return value;
  }

  private static parseExpiry(value: string, varName: string): StringValue {
    const duration = ms(value as StringValue);
    if (duration === undefined) {
      throw new Error(
        `Invalid ${varName}: "${value}" is not a valid duration (expected e.g. "15m", "7d")`,
      );
    }
    if (duration === 0) {
      throw new Error(`Invalid ${varName}: "${value}" must not be zero`);
    }
    return value as StringValue;
  }

  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, this.accessSecret, {
      expiresIn: this.accessExpiry,
    });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, jti: randomUUID() }, this.refreshSecret, {
      expiresIn: this.refreshExpiry,
    });
  }

  getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + ms(this.refreshExpiry));
  }

  verifyToken(token: string, type: TokenType): { userId: string } | null {
    const secret = type === "access" ? this.accessSecret : this.refreshSecret;
    try {
      const payload = jwt.verify(token, secret) as { userId?: unknown };
      if (
        !payload ||
        typeof payload.userId !== "string" ||
        payload.userId.length === 0
      ) {
        return null;
      }
      return { userId: payload.userId };
    } catch {
      return null;
    }
  }
}
