export type SurveyType = "NORMAL" | "SATISFACTION" | "RATING";

export class Survey {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly type: SurveyType,
    public readonly createdById: string,
    public readonly createdByName: string,
    public readonly assignAllRoles: boolean = false,
    public readonly roleIds: string[] = [],
    public readonly closedAt: Date | null = null,
    public readonly createdAt: Date = new Date(),
  ) {}
}
