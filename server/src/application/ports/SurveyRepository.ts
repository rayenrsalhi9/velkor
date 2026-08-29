import { Survey } from "../../domain/entities/Survey.js";
import type { ListQuery, Paginated } from "./ListQuery.js";

export interface ListSurveysParams extends ListQuery {
  sortBy: "title" | "createdAt";
  roleIds?: string[];
}

export interface CreateSurveyInput {
  title: string;
  description: string | null;
  type: "NORMAL" | "SATISFACTION" | "RATING";
  createdById: string;
  roleIds: string[];
  assignAllRoles: boolean;
}

export interface SurveyRepository {
  list(params: ListSurveysParams): Promise<Paginated<Survey>>;
  findById(id: string): Promise<Survey | null>;
  create(input: CreateSurveyInput): Promise<Survey>;
  close(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  countResponses(surveyId: string): Promise<number>;
  /** Check if a user has already responded to a survey. */
  hasResponded(surveyId: string, userId: string): Promise<boolean>;
  /** Check if a survey is accessible to a user (role match or assignAllRoles). */
  isAccessible(surveyId: string, roleIds: string[]): Promise<boolean>;
}
