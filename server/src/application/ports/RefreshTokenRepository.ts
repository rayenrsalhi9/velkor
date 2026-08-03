export interface RefreshTokenRecord {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  createdAt: Date;
}

export interface RefreshTokenRepository {
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  create(tokenHash: string, userId: string, expiresAt: Date): Promise<RefreshTokenRecord>;
  /**
   * Revoke a refresh token. When replacedByTokenId is omitted, it is stored as
   * null (not left unchanged).
   */
  revoke(id: string, replacedByTokenId?: string): Promise<void>;
  /**
   * Revoke a token atomically, but only if it is still active. Returns true if
   * the token was revoked by this call, false if it was already revoked (the
   * token was reused by a concurrent request).
   */
  revokeIfActive(id: string, replacedByTokenId: string): Promise<boolean>;
  revokeAllForUser(userId: string): Promise<void>;
}