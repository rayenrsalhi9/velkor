export type TokenType = "access" | "refresh";

export interface TokenService {
  generateAccessToken(userId: string): string;
  generateRefreshToken(userId: string): string;
  getRefreshTokenExpiresAt(): Date;
  verifyToken(token: string, type: TokenType): { userId: string } | null;
}
