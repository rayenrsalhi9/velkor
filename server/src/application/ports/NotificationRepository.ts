import { Notification } from "../../domain/entities/Notification.js";

export interface CreateNotificationInput {
  userId: string;
  type: Notification["type"];
  title: string;
  body: string;
  actorId?: string | null;
  refType?: string | null;
  refId?: string | null;
}

export interface NotificationRepository {
  createMany(inputs: CreateNotificationInput[]): Promise<void>;
  listByUser(
    userId: string,
    opts: { limit: number; before?: string | undefined },
  ): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markRead(userId: string, ids: string[]): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  /** Mark matching unread notifications as read (used when an assignment is revoked). */
  markReadWhere(
    userId: string,
    where: { type?: string; refType?: string; refId?: string },
  ): Promise<void>;
}
