import type { RefreshTokenRepository } from "../ports/RefreshTokenRepository.js";
import type { TokenHasher } from "../ports/TokenHasher.js";

export class LogoutUser {
  constructor(
    private refreshTokenRepository: RefreshTokenRepository,
    private tokenHasher: TokenHasher,
  ) {}

  async execute(rawToken: string): Promise<void> {
    if (!rawToken) {
      return;
    }
    const record = await this.refreshTokenRepository.findByTokenHash(
      this.tokenHasher.hash(rawToken),
    );
    if (record) {
      await this.refreshTokenRepository.revoke(record.id);
    }
  }
}