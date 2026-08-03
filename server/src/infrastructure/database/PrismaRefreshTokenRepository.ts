import { PrismaClient } from "../../generated/prisma/client.js";
import type {
  RefreshTokenRecord,
  RefreshTokenRepository,
} from "../../application/ports/RefreshTokenRepository.js";

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private prisma: PrismaClient) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return row ? this.toRecord(row) : null;
  }

  async create(
    tokenHash: string,
    userId: string,
    expiresAt: Date,
  ): Promise<RefreshTokenRecord> {
    const row = await this.prisma.refreshToken.create({
      data: { tokenHash, userId, expiresAt },
    });
    return this.toRecord(row);
  }

  async revoke(id: string, replacedByTokenId?: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: replacedByTokenId ?? null,
      },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
  }

  private toRecord(row: {
    id: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedByTokenId: string | null;
    createdAt: Date;
  }): RefreshTokenRecord {
    return {
      id: row.id,
      tokenHash: row.tokenHash,
      userId: row.userId,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      replacedByTokenId: row.replacedByTokenId,
      createdAt: row.createdAt,
    };
  }
}