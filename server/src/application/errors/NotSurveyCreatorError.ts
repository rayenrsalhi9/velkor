import { DomainError } from "./DomainError.js";

export class NotSurveyCreatorError extends DomainError {
  constructor() {
    super("Only the survey creator can perform this action");
  }
}
