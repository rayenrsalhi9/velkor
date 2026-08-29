export type NotificationType =
  | "welcome"
  | "document_assigned"
  | "role_updated"
  | "claim_updated";

export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly body: string,
    public readonly actorId: string | null,
    public readonly refType: string | null,
    public readonly refId: string | null,
    public readonly readAt: Date | null,
    public readonly createdAt: Date,
  ) {}
}
