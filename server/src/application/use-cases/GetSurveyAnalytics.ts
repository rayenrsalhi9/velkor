import type { SurveyRepository } from "../ports/SurveyRepository.js";
import type {
  SurveyResponseRepository,
  SurveyAnalytics,
} from "../ports/SurveyResponseRepository.js";
import { SurveyNotFoundError } from "../errors/SurveyNotFoundError.js";

export class GetSurveyAnalytics {
  constructor(
    private surveyRepository: SurveyRepository,
    private surveyResponseRepository: SurveyResponseRepository,
  ) {}

  async execute(surveyId: string): Promise<SurveyAnalytics> {
    const survey = await this.surveyRepository.findById(surveyId);
    if (!survey) {
      throw new SurveyNotFoundError();
    }
    return this.surveyResponseRepository.getAnalytics(surveyId);
  }
}
