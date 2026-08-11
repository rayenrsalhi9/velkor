import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type {
  CreateDocumentInput,
  DocumentRepository,
  ListDocumentsParams,
} from "../../application/ports/DocumentRepository.js";
import type { Paginated } from "../../application/ports/ListQuery.js";
import { Document } from "../../domain/entities/Document.js";

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
    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { displayName: { contains: q, mode: "insensitive" } },
              { fileName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
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
}