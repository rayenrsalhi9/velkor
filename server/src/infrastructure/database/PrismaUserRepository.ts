import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type { UserRepository } from "../../application/ports/UserRepository.js";
import type {
  UserAdminRepository,
  CreateUserInput,
  UpdateUserInput,
  ListUsersParams,
} from "../../application/ports/UserAdminRepository.js";
import type { Paginated } from "../../application/ports/ListQuery.js";
import { EmailConflictError } from "../../application/errors/EmailConflictError.js";
import { UserNotFoundError } from "../../application/errors/UserNotFoundError.js";
import { User } from "../../domain/entities/User.js";

type UserRow = {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: { name: string };
  createdAt: Date;
};

export class PrismaUserRepository implements UserRepository, UserAdminRepository {
  constructor(private prisma: PrismaClient) {}

  private mapWithRole(row: UserRow): User {
    return new User(
      row.id,
      row.email,
      row.fullName,
      row.passwordHash,
      row.role.name,
      row.createdAt,
      [],
    );
  }

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
      row.createdAt,
      row.role.claims.map((claim) => claim.claim),
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findUser({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.findUser({ id });
  }

  async list(params: ListUsersParams): Promise<Paginated<User>> {
    const { q, sortBy, order, page, pageSize } = params;
    const where: Prisma.UserWhereInput | undefined = q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { role: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined;
    const orderBy: Prisma.UserOrderByWithRelationInput =
      sortBy === "role"
        ? { role: { name: order } }
        : sortBy === "email"
          ? { email: order }
          : sortBy === "createdAt"
            ? { createdAt: order }
            : { fullName: order };
    const countArgs: Prisma.UserCountArgs = where ? { where } : {};
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        ...(where ? { where } : {}),
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { role: true },
      }),
      this.prisma.user.count(countArgs),
    ]);
    return { items: rows.map((row) => this.mapWithRole(row as UserRow)), total };
  }

  async create(input: CreateUserInput): Promise<User> {
    try {
      const row = await this.prisma.user.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          passwordHash: input.passwordHash,
          roleId: input.roleId,
        },
        include: { role: true },
      });
      return this.mapWithRole(row);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new EmailConflictError();
      }
      throw err;
    }
  }

  async update(
    id: string,
    input: UpdateUserInput,
    revokeRefreshTokens = false,
  ): Promise<User> {
    try {
      const operations: Prisma.PrismaPromise<unknown>[] = [];
      if (revokeRefreshTokens) {
        operations.push(
          this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
        );
      }
      operations.push(
        this.prisma.user.update({
          where: { id },
          data: input,
          include: { role: true },
        }),
      );
      const [row] = await this.prisma.$transaction(operations);
      return this.mapWithRole(row as UserRow);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new UserNotFoundError();
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
        this.prisma.user.delete({ where: { id } }),
      ]);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new UserNotFoundError();
      }
      throw err;
    }
  }
}
