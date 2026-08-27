export class Channel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly createdById: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}