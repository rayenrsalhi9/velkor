import { DomainError } from "./DomainError.js";

export class SurveyAlreadyAnsweredError extends DomainError {
  constructor() {
    super("You have already responded to this survey");
  }
}
