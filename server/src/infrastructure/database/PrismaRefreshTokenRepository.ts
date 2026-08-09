import { PrismaClient } from "../../generated/prisma/client.js";
import type {
  RefreshTokenRecord,
  RefreshTokenRepository,
} from "../../application/ports/RefreshTokenRepository.js";

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private prisma: PrismaClient) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async create(
    tokenHash: string,
    userId: string,
    expiresAt: Date,
  ): Promise<RefreshTokenRecord> {
    return this.prisma.refreshToken.create({
      data: { tokenHash, userId, expiresAt },
    });
  }

  async revoke(id: string, replacedByTokenId?: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        ...(replacedByTokenId !== undefined && { replacedByTokenId }),
      },
    });
  }

  async revokeIfActive(
    id: string,
    replacedByTokenId: string,
  ): Promise<boolean> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date(), replacedByTokenId },
    });
    return result.count > 0;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
