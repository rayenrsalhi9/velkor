export class Message {
  constructor(
    public readonly id: string,
    public readonly channelId: string,
    public readonly authorId: string,
    public readonly authorName: string,
    public readonly authorEmail: string,
    public readonly body: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}