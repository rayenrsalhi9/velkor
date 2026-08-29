export class SurveyResponse {
  constructor(
    public readonly id: string,
    public readonly surveyId: string,
    public readonly userId: string,
    public readonly answer: Record<string, unknown>,
    public readonly createdAt: Date = new Date(),
  ) {}
}
