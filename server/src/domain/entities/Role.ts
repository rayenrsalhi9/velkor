export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly claims: string[],
  ) {}

  hasClaim(claim: string): boolean {
    return this.claims.includes(claim);
  }
}
