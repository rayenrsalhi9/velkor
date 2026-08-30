import type { SurveyRepository } from "../ports/SurveyRepository.js";
import { SurveyNotFoundError } from "../errors/SurveyNotFoundError.js";
import { NotSurveyCreatorError } from "../errors/NotSurveyCreatorError.js";

export class SoftDeleteSurvey {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute(
    surveyId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const survey = await this.surveyRepository.findById(surveyId);
    if (!survey) {
      throw new SurveyNotFoundError();
    }
    if (survey.createdById !== userId && !isAdmin) {
      throw new NotSurveyCreatorError();
    }
    await this.surveyRepository.softDelete(surveyId);
  }
}
