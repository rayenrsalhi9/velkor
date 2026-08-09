import type { ClaimDefinition } from "@/lib/api";

export function completeClaims(
  claims: string[],
  definitions: ClaimDefinition[],
): string[] {
  const result = new Set(claims);
  let added: boolean;
  do {
    added = false;
    for (const claim of definitions) {
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
