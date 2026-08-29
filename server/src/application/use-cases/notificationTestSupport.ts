import type {
  NotificationRepository,
  CreateNotificationInput,
} from "../ports/NotificationRepository.js";

export interface FakeNotificationCalls {
  createMany: CreateNotificationInput[][];
  markReadWhere: { userId: string; where: Record<string, string | undefined> }[];
  markAllRead: string[];
}

export function makeNotificationRepository(
  overrides: Partial<NotificationRepository> = {},
): { repository: NotificationRepository; calls: FakeNotificationCalls } {
  const calls: FakeNotificationCalls = {
    createMany: [],
    markReadWhere: [],
    markAllRead: [],
  };
  const repository: NotificationRepository = {
    async createMany(inputs) {
      calls.createMany.push(inputs);
    },
    async listByUser() {
      return [];
    },
    async countUnread() {
      return 0;
    },
    async markRead() {},
    async markAllRead(userId) {
      calls.markAllRead.push(userId);
    },
    async markReadWhere(userId, where) {
      calls.markReadWhere.push({ userId, where });
    },
    ...overrides,
  };
  return { repository, calls };
}
