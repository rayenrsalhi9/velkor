import type { SurveyRepository } from "../ports/SurveyRepository.js";
import type { Survey } from "../../domain/entities/Survey.js";

export class ListPendingSurveys {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute(userId: string, roleIds: string[]): Promise<Survey[]> {
    return this.surveyRepository.findPendingForUser(userId, roleIds);
  }
}
