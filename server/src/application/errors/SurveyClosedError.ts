import { DomainError } from "./DomainError.js";

export class SurveyClosedError extends DomainError {
  constructor() {
    super("Survey is closed");
  }
}
