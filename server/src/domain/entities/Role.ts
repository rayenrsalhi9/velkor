import { WILDCARD_CLAIM } from "../../application/claims/claimsCatalog.js";

export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
  public readonly description: string | null,
  public readonly claims: string[],
  public readonly createdAt: Date = new Date(),
) {}

  hasClaim(claim: string): boolean {
    return this.claims.includes(WILDCARD_CLAIM) || this.claims.includes(claim);
  }
}
