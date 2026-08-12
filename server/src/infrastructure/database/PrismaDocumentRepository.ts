import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type {
  CreateDocumentInput,
  DocumentRepository,
  ListDocumentsParams,
  UpdateDocumentInput,
} from "../../application/ports/DocumentRepository.js";
import type { Paginated } from "../../application/ports/ListQuery.js";
import { Document } from "../../domain/entities/Document.js";
import { DocumentNotFoundError } from "../../application/errors/DocumentNotFoundError.js";

const listSelect = {
  id: true,
  displayName: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  categoryId: true,
  category: { select: { name: true } },
  uploadedBy: { select: { fullName: true } },
  assignAllRoles: true,
  roles: { select: { roleId: true } },
  createdAt: true,
} satisfies Prisma.DocumentSelect;

function map(row: {
  id: string;
  displayName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  categoryId: string;
  category: { name: string };
  uploadedBy: { fullName: string };
  assignAllRoles: boolean;
  roles: { roleId: string }[];
  createdAt: Date;
}): Document {
  return new Document(
    row.id,
    row.displayName,
    row.fileName,
    row.mimeType,
    row.sizeBytes,
    row.categoryId,
    row.category.name,
    row.uploadedBy.fullName,
    row.assignAllRoles,
    row.roles.map((r) => r.roleId),
    row.createdAt,
  );
}

export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private prisma: PrismaClient) {}

  async list(params: ListDocumentsParams): Promise<Paginated<Document>> {
    const { q, sortBy, order, page, pageSize } = params;
    const filters: Prisma.DocumentWhereInput[] = [];
    if (q) {
      filters.push({
        OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { fileName: { contains: q, mode: "insensitive" } },
        ],
      });
    }
    if (params.scope === "assigned" && params.roleIds?.length) {
      filters.push({
        OR: [
          { roles: { some: { roleId: { in: params.roleIds } } } },
          { assignAllRoles: true },
        ],
      });
    }
    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
      ...(filters.length ? { AND: filters } : {}),
    };
    const orderBy: Prisma.DocumentOrderByWithRelationInput[] =
      sortBy === "displayName"
        ? [{ displayName: order }, { id: "asc" }]
        : [{ createdAt: order }, { id: "asc" }];
    const [rows, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: listSelect,
      }),
      this.prisma.document.count({ where }),
    ]);
    return { items: rows.map(map), total };
  }

  async create(input: CreateDocumentInput): Promise<Document> {
    const row = await this.prisma.document.create({
      data: {
        displayName: input.displayName,
        fileName: input.fileName,
        storedName: input.storedName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        categoryId: input.categoryId,
        uploadedById: input.uploadedById,
        assignAllRoles: input.assignAllRoles,
        roles: {
          create: input.roleIds.map((roleId) => ({ roleId })),
        },
      },
      select: {
        ...listSelect,
        storedName: true,
        uploadedById: true,
        category: { select: { name: true } },
      },
    });
    return map(row);
  }

  async findById(id: string): Promise<Document | null> {
    const row = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
      select: listSelect,
    });
    return row ? map(row) : null;
  }

  async findForDownload(id: string) {
    const row = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
      select: {
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        storedName: true,
      },
    });
    return row ?? null;
  }

  async update(id: string, input: UpdateDocumentInput): Promise<Document> {
    try {
      const data: Prisma.DocumentUpdateInput = {
        ...(input.displayName !== undefined && {
          displayName: input.displayName,
        }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.assignAllRoles !== undefined && {
          assignAllRoles: input.assignAllRoles,
        }),
        ...(input.roleIds !== undefined && {
          roles: {
            deleteMany: {},
            create: input.roleIds.map((roleId) => ({ roleId })),
          },
        }),
      };
      const row = await this.prisma.document.update({
        where: { id },
        data,
        select: {
          ...listSelect,
          storedName: true,
          uploadedById: true,
          category: { select: { name: true } },
        },
      });
      return map(row);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new DocumentNotFoundError();
      }
      throw err;
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.prisma.document.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new DocumentNotFoundError();
      }
      throw err;
    }
  }
}
