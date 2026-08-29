import type { SurveyRepository } from "../ports/SurveyRepository.js";
import type { SurveyResponseRepository } from "../ports/SurveyResponseRepository.js";
import { SurveyNotFoundError } from "../errors/SurveyNotFoundError.js";
import { SurveyClosedError } from "../errors/SurveyClosedError.js";
import { SurveyAlreadyAnsweredError } from "../errors/SurveyAlreadyAnsweredError.js";

export class SubmitSurveyResponse {
  constructor(
    private surveyRepository: SurveyRepository,
    private surveyResponseRepository: SurveyResponseRepository,
  ) {}

  async execute(
    surveyId: string,
    userId: string,
    answer: Record<string, unknown>,
    userRoleIds: string[],
  ): Promise<void> {
    const survey = await this.surveyRepository.findById(surveyId);
    if (!survey) {
      throw new SurveyNotFoundError();
    }
    if (survey.closedAt) {
      throw new SurveyClosedError();
    }

    const accessible = await this.surveyRepository.isAccessible(
      surveyId,
      userRoleIds,
    );
    if (!accessible) {
      throw new SurveyNotFoundError();
    }

    const alreadyAnswered =
      await this.surveyResponseRepository.existsBySurveyAndUser(
        surveyId,
        userId,
      );
    if (alreadyAnswered) {
      throw new SurveyAlreadyAnsweredError();
    }

    await this.surveyResponseRepository.create(surveyId, userId, answer);
  }
}
