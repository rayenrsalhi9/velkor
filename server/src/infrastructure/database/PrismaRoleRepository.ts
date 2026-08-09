import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { RoleNotFoundError } from "../../application/errors/RoleNotFoundError.js";
import { RoleInUseError } from "../../application/errors/RoleInUseError.js";
import { RoleNameConflictError } from "../../application/errors/RoleNameConflictError.js";
import type { RoleRepository, RoleInput, RoleUpdateInput, ListRolesParams } from "../../application/ports/RoleRepository.js";
import type { Paginated } from "../../application/ports/ListQuery.js";
import { Role } from "../../domain/entities/Role.js";

type RoleRow = {
  id: string;
  name: string;
  description: string | null;
  claims: { claim: string }[];
  createdAt: Date;
};

export class PrismaRoleRepository implements RoleRepository {
  constructor(private prisma: PrismaClient) {}

  private map(row: RoleRow): Role {
    return new Role(
      row.id,
      row.name,
      row.description,
      row.claims.map((claim) => claim.claim),
      row.createdAt,
    );
  }

  private include = { claims: true } as const;

  async list(params: ListRolesParams): Promise<Paginated<Role>> {
    const { q, sortBy, order, page, pageSize } = params;
    const where: Prisma.RoleWhereInput | undefined = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined;
    const orderBy: Prisma.RoleOrderByWithRelationInput =
      sortBy === "createdAt" ? { createdAt: order } : { name: order };
    const countArgs: Prisma.RoleCountArgs = where ? { where } : {};
    const [rows, total] = await Promise.all([
      this.prisma.role.findMany({
        ...(where ? { where } : {}),
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: this.include,
      }),
      this.prisma.role.count(countArgs),
    ]);
    return { items: rows.map((row) => this.map(row as RoleRow)), total };
  }

  async findById(id: string): Promise<Role | null> {
    const row = await this.prisma.role.findUnique({ where: { id }, include: this.include });
    return row ? this.map(row) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const row = await this.prisma.role.findUnique({ where: { name }, include: this.include });
    return row ? this.map(row) : null;
  }

  async create(input: RoleInput): Promise<Role> {
    try {
      const row = await this.prisma.role.create({
        data: {
          name: input.name,
          description: input.description,
          claims: { create: input.claims.map((claim) => ({ claim })) },
        },
        include: this.include,
      });
      return this.map(row);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new RoleNameConflictError();
      }
      throw err;
    }
  }

  async update(id: string, input: RoleUpdateInput): Promise<Role> {
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        if (input.claims) {
          await tx.roleClaim.deleteMany({ where: { roleId: id } });
          if (input.claims.length > 0) {
            await tx.roleClaim.createMany({
              data: input.claims.map((claim) => ({ roleId: id, claim })),
            });
          }
        }
        return tx.role.update({
          where: { id },
          data: {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.description !== undefined && { description: input.description }),
          },
          include: this.include,
        });
      });
      return this.map(row);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new RoleNotFoundError();
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.role.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
          throw new RoleNotFoundError();
        }
        if (err.code === "P2003") {
          throw new RoleInUseError();
        }
      }
      throw err;
    }
  }

  async countUsers(roleId: string): Promise<number> {
    return this.prisma.user.count({ where: { roleId } });
  }
}
