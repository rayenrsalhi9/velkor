import jwt from "jsonwebtoken";
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
    this.accessSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET!;
    this.accessExpiry = JwtTokenService.parseExpiry(
      process.env.JWT_ACCESS_EXPIRY || "15m",
      "JWT_ACCESS_EXPIRY",
    );
    this.refreshExpiry = JwtTokenService.parseExpiry(
      process.env.JWT_REFRESH_EXPIRY || "7d",
      "JWT_REFRESH_EXPIRY",
    );
  }

  private static parseExpiry(value: string, varName: string): StringValue {
    const durationPattern = /^\d+(ms|s|m|h|d|w|y)$/;
    if (!durationPattern.test(value)) {
      throw new Error(
        `Invalid ${varName}: "${value}" is not a valid duration (expected e.g. "15m", "7d")`,
      );
    }
    return value as StringValue;
  }

  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, this.accessSecret, {
      expiresIn: this.accessExpiry,
    });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.refreshSecret, {
      expiresIn: this.refreshExpiry,
    });
  }

  verifyToken(token: string, type: TokenType): { userId: string } | null {
    const secret = type === "access" ? this.accessSecret : this.refreshSecret;
    try {
      const payload = jwt.verify(token, secret) as { userId: string };
      return payload;
    } catch {
      return null;
    }
  }
}
