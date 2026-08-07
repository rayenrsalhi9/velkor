export class InvalidClaimsError extends Error {
  constructor(invalidClaims: string[]) {
    super(`Invalid claim(s): ${invalidClaims.join(", ")}`);
    this.name = "InvalidClaimsError";
  }
}
