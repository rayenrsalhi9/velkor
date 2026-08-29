import type { NotificationRepository } from "../ports/NotificationRepository.js";
import { Notification } from "../../domain/entities/Notification.js";

export interface ListNotificationsResult {
  items: Notification[];
  unread: number;
}

export class ListNotifications {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(
    userId: string,
    opts: { limit: number; before?: string | undefined },
  ): Promise<ListNotificationsResult> {
    const [items, unread] = await Promise.all([
      this.notificationRepository.listByUser(userId, opts),
      this.notificationRepository.countUnread(userId),
    ]);
    return { items, unread };
  }
}
