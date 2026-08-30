import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type {
  SurveyAnalytics,
  SurveyResponseBreakdown,
  SurveyResponseRepository,
} from "../../application/ports/SurveyResponseRepository.js";
import { SurveyResponse } from "../../domain/entities/SurveyResponse.js";

export class PrismaSurveyResponseRepository implements SurveyResponseRepository {
  constructor(private prisma: PrismaClient) {}

  async create(
    surveyId: string,
    userId: string,
    answer: Record<string, unknown>,
  ): Promise<SurveyResponse> {
    const row = await this.prisma.surveyResponse.create({
      data: { surveyId, userId, answer: answer as Prisma.InputJsonValue },
    });
    return new SurveyResponse(
      row.id,
      row.surveyId,
      row.userId,
      row.answer as Record<string, unknown>,
      row.createdAt,
    );
  }

  async existsBySurveyAndUser(
    surveyId: string,
    userId: string,
  ): Promise<boolean> {
    const row = await this.prisma.surveyResponse.findUnique({
      where: { surveyId_userId: { surveyId, userId } },
      select: { id: true },
    });
    return row !== null;
  }

  async countBySurvey(surveyId: string): Promise<number> {
    return this.prisma.surveyResponse.count({ where: { surveyId } });
  }

  async getAnalytics(surveyId: string): Promise<SurveyAnalytics> {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      select: { id: true, title: true, type: true },
    });
    if (!survey) {
      return {
        surveyId,
        title: "",
        type: "NORMAL",
        totalResponses: 0,
        breakdown: [],
      };
    }

    const responses = await this.prisma.surveyResponse.findMany({
      where: { surveyId },
      select: { answer: true },
    });

    const totalResponses = responses.length;
    const counts = new Map<string, number>();
    let ratingSum = 0;
    let ratingCount = 0;

    for (const { answer } of responses) {
      const a = answer as Record<string, unknown>;
      const value = String(a.value ?? "");
      counts.set(value, (counts.get(value) ?? 0) + 1);

      if (survey.type === "RATING" && typeof a.value === "number") {
        ratingSum += a.value;
        ratingCount++;
      }
    }

    const breakdown: SurveyResponseBreakdown[] = [...counts.entries()].map(
      ([option, count]) => ({ option, count }),
    );

    const analytics: SurveyAnalytics = {
      surveyId: survey.id,
      title: survey.title,
      type: survey.type,
      totalResponses,
      breakdown,
    };

    if (survey.type === "RATING" && ratingCount > 0) {
      analytics.averageRating = Math.round((ratingSum / ratingCount) * 10) / 10;
    }

    return analytics;
  }
}
