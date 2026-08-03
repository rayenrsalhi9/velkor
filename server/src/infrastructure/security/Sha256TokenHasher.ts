import { createHash } from "node:crypto";
import type { TokenHasher } from "../../application/ports/TokenHasher.js";

export class Sha256TokenHasher implements TokenHasher {
  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}