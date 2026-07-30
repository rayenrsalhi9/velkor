import { PrismaClient } from "../../generated/prisma/client.js";
import type { UserRepository } from "../../application/ports/UserRepository.js";
import { User } from "../../domain/entities/User.js";

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!row) {
      return null;
    }

    return new User(row.id, row.email, row.fullName, row.passwordHash, row.role.name);
  }
}
