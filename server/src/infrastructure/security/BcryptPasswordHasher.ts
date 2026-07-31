import bcrypt from "bcrypt";
import type { PasswordHasher } from "../../application/ports/PasswordHasher.js";

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds: number;

  constructor() {
    const parsed = Number(process.env.SALT_ROUNDS);
    if (!Number.isInteger(parsed) || parsed < 4 || parsed > 31) {
      throw new Error(
        "Invalid SALT_ROUNDS: expected a finite integer between 4 and 31",
      );
    }
    this.saltRounds = parsed;
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
