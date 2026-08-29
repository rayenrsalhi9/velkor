import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type {
  CreateSurveyInput,
  ListSurveysParams,
  SurveyRepository,
} from "../../application/ports/SurveyRepository.js";
import type { Paginated } from "../../application/ports/ListQuery.js";
import { Survey } from "../../domain/entities/Survey.js";
import { SurveyNotFoundError } from "../../application/errors/SurveyNotFoundError.js";

const listSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  createdById: true,
  createdBy: { select: { fullName: true } },
  assignAllRoles: true,
  roles: { select: { roleId: true } },
  closedAt: true,
  createdAt: true,
} satisfies Prisma.SurveySelect;

function map(row: {
  id: string;
  title: string;
  description: string | null;
  type: "NORMAL" | "SATISFACTION" | "RATING";
  createdById: string;
  createdBy: { fullName: string };
  assignAllRoles: boolean;
  roles: { roleId: string }[];
  closedAt: Date | null;
  createdAt: Date;
}): Survey {
  return new Survey(
    row.id,
    row.title,
    row.description,
    row.type,
    row.createdById,
    row.createdBy.fullName,
    row.assignAllRoles,
    row.roles.map((r) => r.roleId),
    row.closedAt,
    row.createdAt,
  );
}

export class PrismaSurveyRepository implements SurveyRepository {
  constructor(private prisma: PrismaClient) {}

  async list(params: ListSurveysParams): Promise<Paginated<Survey>> {
    const { q, sortBy, order, page, pageSize } = params;
    const filters: Prisma.SurveyWhereInput[] = [];

    if (q) {
      filters.push({ title: { contains: q, mode: "insensitive" } });
    }
    if (params.roleIds?.length) {
      filters.push({
        OR: [
          { roles: { some: { roleId: { in: params.roleIds } } } },
          { assignAllRoles: true },
        ],
      });
    }

    const where: Prisma.SurveyWhereInput = {
      deletedAt: null,
      ...(filters.length ? { AND: filters } : {}),
    };

    const orderBy: Prisma.SurveyOrderByWithRelationInput[] =
      sortBy === "title"
        ? [{ title: order }, { id: "asc" }]
        : [{ createdAt: order }, { id: "asc" }];

    const [rows, total] = await Promise.all([
      this.prisma.survey.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: listSelect,
      }),
      this.prisma.survey.count({ where }),
    ]);

    return { items: rows.map(map), total };
  }

  async findById(id: string): Promise<Survey | null> {
    const row = await this.prisma.survey.findFirst({
      where: { id, deletedAt: null },
      select: listSelect,
    });
    return row ? map(row) : null;
  }

  async create(input: CreateSurveyInput): Promise<Survey> {
    const row = await this.prisma.survey.create({
      data: {
        title: input.title,
        description: input.description,
        type: input.type,
        createdById: input.createdById,
        assignAllRoles: input.assignAllRoles,
        roles: {
          create: input.roleIds.map((roleId) => ({ roleId })),
        },
      },
      select: listSelect,
    });
    return map(row);
  }

  async close(id: string): Promise<void> {
    const result = await this.prisma.survey.updateMany({
      where: { id, deletedAt: null, closedAt: null },
      data: { closedAt: new Date() },
    });
    if (result.count === 0) {
      throw new SurveyNotFoundError();
    }
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.prisma.survey.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new SurveyNotFoundError();
    }
  }

  async countResponses(surveyId: string): Promise<number> {
    return this.prisma.surveyResponse.count({ where: { surveyId } });
  }

  async hasResponded(surveyId: string, userId: string): Promise<boolean> {
    const row = await this.prisma.surveyResponse.findUnique({
      where: { surveyId_userId: { surveyId, userId } },
      select: { id: true },
    });
    return row !== null;
  }

  async isAccessible(surveyId: string, roleIds: string[]): Promise<boolean> {
    const row = await this.prisma.survey.findFirst({
      where: {
        id: surveyId,
        deletedAt: null,
        OR: [
          { roles: { some: { roleId: { in: roleIds } } } },
          { assignAllRoles: true },
        ],
      },
      select: { id: true },
    });
    return row !== null;
  }
}
