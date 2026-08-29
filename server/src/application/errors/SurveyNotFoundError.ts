import { DomainError } from "./DomainError.js";

export class SurveyNotFoundError extends DomainError {
  constructor() {
    super("Survey not found");
  }
}
