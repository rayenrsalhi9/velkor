import { PrismaClient } from "../../generated/prisma/client.js";
import type {
  NotificationRepository,
  CreateNotificationInput,
} from "../../application/ports/NotificationRepository.js";
import { Notification } from "../../domain/entities/Notification.js";

type NotificationRow = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  actorId: string | null;
  refType: string | null;
  refId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private prisma: PrismaClient) {}

  private map(row: NotificationRow): Notification {
    return new Notification(
      row.id,
      row.userId,
      row.type as Notification["type"],
      row.title,
      row.body,
      row.actorId,
      row.refType,
      row.refId,
      row.readAt,
      row.createdAt,
    );
  }

  async createMany(inputs: CreateNotificationInput[]): Promise<void> {
    if (inputs.length === 0) return;
    await this.prisma.notification.createMany({
      data: inputs.map((input) => ({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        actorId: input.actorId ?? null,
        refType: input.refType ?? null,
        refId: input.refId ?? null,
      })),
    });
  }

  async listByUser(
    userId: string,
    opts: { limit: number; before?: string },
  ): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(opts.before ? { createdAt: { lt: new Date(opts.before) } } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: opts.limit,
    });
    return rows.map((row) => this.map(row as NotificationRow));
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.notification.updateMany({
      where: { userId, id: { in: ids }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markReadWhere(
    userId: string,
    where: { type?: string; refType?: string; refId?: string },
  ): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
        ...(where.type !== undefined && { type: where.type }),
        ...(where.refType !== undefined && { refType: where.refType }),
        ...(where.refId !== undefined && { refId: where.refId }),
      },
      data: { readAt: new Date() },
    });
  }
}
