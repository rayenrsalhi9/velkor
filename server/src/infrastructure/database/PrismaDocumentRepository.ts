import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type {
  DocumentRepository,
  ListDocumentsParams,
} from "../../application/ports/DocumentRepository.js";
import type { Paginated } from "../../application/ports/ListQuery.js";
import { Document } from "../../domain/entities/Document.js";

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
        select: {
          id: true,
          displayName: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          categoryId: true,
          category: { select: { name: true } },
          uploadedBy: { select: { fullName: true } },
          createdAt: true,
        },
      }),
      this.prisma.document.count({ where }),
    ]);
    return {
      items: rows.map(
        (row) =>
          new Document(
            row.id,
            row.displayName,
            row.fileName,
            row.mimeType,
            row.sizeBytes,
            row.categoryId,
            row.category.name,
            row.uploadedBy.fullName,
            row.createdAt,
          ),
      ),
      total,
    };
  }
}