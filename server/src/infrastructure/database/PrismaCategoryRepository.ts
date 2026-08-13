import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { CategoryNotFoundError } from "../../application/errors/CategoryNotFoundError.js";
import { CategoryNameConflictError } from "../../application/errors/CategoryNameConflictError.js";
import type {
  CategoryRepository,
  CategoryInput,
  CategoryUpdateInput,
  ListCategoriesParams,
} from "../../application/ports/CategoryRepository.js";
import type { Paginated } from "../../application/ports/ListQuery.js";
import { Category } from "../../domain/entities/Category.js";

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private prisma: PrismaClient) {}

  private map(row: { id: string; name: string; description: string | null; createdAt: Date }): Category {
    return new Category(row.id, row.name, row.description, row.createdAt);
  }

  async list(params: ListCategoriesParams): Promise<Paginated<Category>> {
    const { q, sortBy, order, page, pageSize } = params;
    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.CategoryOrderByWithRelationInput[] =
      sortBy === "name"
        ? [{ name: order }, { id: "asc" }]
        : [{ createdAt: order }, { id: "asc" }];
    const countArgs: Prisma.CategoryCountArgs = { where };
    const [rows, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.category.count(countArgs),
    ]);
    return { items: rows.map((row) => this.map(row)), total };
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? this.map(row) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const row = await this.prisma.category.findFirst({
      where: { name, deletedAt: null },
    });
    return row ? this.map(row) : null;
  }

  async create(input: CategoryInput): Promise<Category> {
    try {
      const row = await this.prisma.category.create({ data: input });
      return this.map(row);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new CategoryNameConflictError();
      }
      throw err;
    }
  }

  async update(id: string, input: CategoryUpdateInput): Promise<Category> {
    try {
      const row = await this.prisma.category.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
        },
      });
      return this.map(row);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new CategoryNotFoundError();
      }
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new CategoryNameConflictError();
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.category.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new CategoryNotFoundError();
      }
      throw err;
    }
  }

  async countDocuments(categoryId: string): Promise<number> {
    return this.prisma.document.count({
      where: { categoryId, deletedAt: null },
    });
  }
}