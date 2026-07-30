export type TokenType = "access" | "refresh";

export interface TokenService {
  generateAccessToken(userId: string): string;
  generateRefreshToken(userId: string): string;
  verifyToken(token: string, type: TokenType): { userId: string } | null;
}
