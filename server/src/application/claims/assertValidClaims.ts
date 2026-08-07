import { CLAIMS_CATALOG, WILDCARD_CLAIM } from "./claimsCatalog.js";
import { InvalidClaimsError } from "../errors/InvalidClaimsError.js";

const VALID_CLAIM_KEYS = new Set([
  WILDCARD_CLAIM,
  ...CLAIMS_CATALOG.map((claim) => claim.key),
]);

export function assertValidClaims(claims: string[]): void {
  const invalid = claims.filter((claim) => !VALID_CLAIM_KEYS.has(claim));
  if (invalid.length > 0) {
    throw new InvalidClaimsError(invalid);
  }
}
