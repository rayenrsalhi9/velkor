import type { SurveyRepository } from "../ports/SurveyRepository.js";
import type { RoleRepository } from "../ports/RoleRepository.js";
import type { Survey } from "../../domain/entities/Survey.js";
import { InvalidRoleAssignmentError } from "../errors/InvalidRoleAssignmentError.js";

export interface CreateSurveyInput {
  title: string;
  description: string | null;
  type: "NORMAL" | "SATISFACTION" | "RATING";
  roleIds: string[];
  assignAllRoles: boolean;
}

export class CreateSurvey {
  constructor(
    private surveyRepository: SurveyRepository,
    private roleRepository: RoleRepository,
  ) {}

  async execute(input: CreateSurveyInput, userId: string): Promise<Survey> {
    if (input.roleIds.length === 0 && !input.assignAllRoles) {
      throw new InvalidRoleAssignmentError(
        "At least one role must be assigned",
      );
    }
    if (input.roleIds.length > 0 && input.assignAllRoles) {
      throw new InvalidRoleAssignmentError(
        "Either pick roles or assign to all, not both",
      );
    }
    if (input.roleIds.length > 0) {
      const existing = await this.roleRepository.countByIds(input.roleIds);
      if (existing !== input.roleIds.length) {
        throw new InvalidRoleAssignmentError(
          "One or more assigned roles do not exist",
        );
      }
    }

    return this.surveyRepository.create({
      ...input,
      createdById: userId,
    });
  }
}
