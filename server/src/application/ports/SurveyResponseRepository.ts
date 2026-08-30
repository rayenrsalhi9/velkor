import { SurveyResponse } from "../../domain/entities/SurveyResponse.js";

export interface SurveyResponseBreakdown {
  option: string;
  count: number;
}

export interface SurveyAnalytics {
  surveyId: string;
  title: string;
  type: "NORMAL" | "SATISFACTION" | "RATING";
  totalResponses: number;
  breakdown: SurveyResponseBreakdown[];
  averageRating?: number;
}

export interface SurveyResponseRepository {
  create(
    surveyId: string,
    userId: string,
    answer: Record<string, unknown>,
  ): Promise<SurveyResponse>;
  existsBySurveyAndUser(surveyId: string, userId: string): Promise<boolean>;
  countBySurvey(surveyId: string): Promise<number>;
  getAnalytics(surveyId: string): Promise<SurveyAnalytics>;
}
