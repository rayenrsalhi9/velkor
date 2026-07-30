import bcrypt from "bcrypt";
import type { PasswordHasher } from "../../application/ports/PasswordHasher.js";

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = Number(process.env.SALT_ROUNDS) || 12;
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
