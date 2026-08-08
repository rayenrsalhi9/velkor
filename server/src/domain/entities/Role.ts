export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly claims: string[],
    public readonly createdAt: Date = new Date(),
  ) {}
}
