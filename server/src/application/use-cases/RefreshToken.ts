import type { RefreshTokenRepository } from "../ports/RefreshTokenRepository.js";
import type { TokenService } from "../ports/TokenService.js";
import type { TokenHasher } from "../ports/TokenHasher.js";
import { InvalidRefreshTokenError } from "../errors/InvalidRefreshTokenError.js";

const ROTATION_GRACE_MS = 10_000;

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
      // The token was already rotated by a concurrent request. If that
      // happened within the grace window it is almost certainly two tabs
      // refreshing together, not a stolen token — keep the winner's session
      // instead of nuking every session. A replay outside the window is a
      // reuse attack: revoke everything.
      const fresh = await this.refreshTokenRepository.findByTokenHash(tokenHash);
      const recentlyRevoked =
        fresh?.revokedAt !== null &&
        fresh !== null &&
        Date.now() - fresh.revokedAt.getTime() < ROTATION_GRACE_MS;
      if (!recentlyRevoked) {
        await this.refreshTokenRepository.revokeAllForUser(record.userId);
      }
      throw new InvalidRefreshTokenError();
    }

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }
}