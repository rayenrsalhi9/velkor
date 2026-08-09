import { CLAIMS_CATALOG } from "./claimsCatalog.js";

export function completeClaims(claims: string[]): string[] {
  const result = new Set(claims);
  let added: boolean;
  do {
    added = false;
    for (const claim of CLAIMS_CATALOG) {
      if (!result.has(claim.key)) continue;
      for (const dependency of claim.dependsOn ?? []) {
        if (!result.has(dependency)) {
          result.add(dependency);
          added = true;
        }
      }
    }
  } while (added);
  return [...result];
}
