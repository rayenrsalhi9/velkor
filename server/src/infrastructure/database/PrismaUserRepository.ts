import { PrismaClient } from "../../generated/prisma/client.js";
import type { UserRepository } from "../../application/ports/UserRepository.js";
import { User } from "../../domain/entities/User.js";

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  private async findUser(where: { email: string } | { id: string }) {
    const row = await this.prisma.user.findUnique({
      where,
      include: { role: { include: { claims: true } } },
    });

    if (!row) {
      return null;
    }

    return new User(
      row.id,
      row.email,
      row.fullName,
      row.passwordHash,
      row.role.name,
      row.role.claims.map((claim) => claim.claim),
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findUser({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.findUser({ id });
  }
}
