import type { RefreshTokenRepository } from "../ports/RefreshTokenRepository.js";
import type { TokenService } from "../ports/TokenService.js";
import type { TokenHasher } from "../ports/TokenHasher.js";
import { InvalidRefreshTokenError } from "../errors/InvalidRefreshTokenError.js";

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export class RefreshToken {
  constructor(
    private refreshTokenRepository: RefreshTokenRepository,
    private tokenService: TokenService,
    private tokenHasher: TokenHasher,
  ) {}

  async execute(rawToken: string): Promise<RefreshResult> {
    const tokenHash = this.tokenHasher.hash(rawToken);
    const record = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (!record) {
      throw new InvalidRefreshTokenError();
    }
    if (record.revokedAt) {
      await this.refreshTokenRepository.revokeAllForUser(record.userId);
      throw new InvalidRefreshTokenError();
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw new InvalidRefreshTokenError();
    }

    const accessToken = this.tokenService.generateAccessToken(record.userId);
    const refreshToken = this.tokenService.generateRefreshToken(record.userId);
    const refreshTokenExpiresAt = this.tokenService.getRefreshTokenExpiresAt();
    const newRecord = await this.refreshTokenRepository.create(
      this.tokenHasher.hash(refreshToken),
      record.userId,
      refreshTokenExpiresAt,
    );
    const revoked = await this.refreshTokenRepository.revokeIfActive(
      record.id,
      newRecord.id,
    );
    if (!revoked) {
      await this.refreshTokenRepository.revokeAllForUser(record.userId);
      throw new InvalidRefreshTokenError();
    }

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }
}