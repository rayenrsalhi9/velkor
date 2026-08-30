import type {
  SurveyRepository,
  ListSurveysParams,
} from "../ports/SurveyRepository.js";
import type { Paginated } from "../ports/ListQuery.js";
import type { Survey } from "../../domain/entities/Survey.js";

export class ListSurveys {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute(params: ListSurveysParams): Promise<Paginated<Survey>> {
    return this.surveyRepository.list(params);
  }
}
