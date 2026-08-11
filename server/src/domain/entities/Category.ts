export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly createdAt: Date = new Date(),
  ) {}
}