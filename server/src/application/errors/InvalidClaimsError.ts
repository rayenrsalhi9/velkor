import { DomainError } from "./DomainError.js";

export class InvalidClaimsError extends DomainError {
  constructor(invalidClaims: string[]) {
    super(`Invalid claim(s): ${invalidClaims.join(", ")}`);
  }
}
