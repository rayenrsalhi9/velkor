import type { NotificationRepository } from "../ports/NotificationRepository.js";

export class MarkNotificationsRead {
  constructor(private notificationRepository: NotificationRepository) {}

  async markRead(userId: string, ids: string[]): Promise<void> {
    await this.notificationRepository.markRead(userId, ids);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllRead(userId);
  }
}
