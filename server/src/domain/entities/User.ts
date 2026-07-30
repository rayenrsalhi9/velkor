export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly fullName: string,
    private readonly passwordHash: string,
    public readonly role: string
  ) {}

  getPasswordHash(): string {
    return this.passwordHash;
  }

  hasRole(role: string): boolean {
    return this.role === role;
  }
}
