import { DomainError } from "./DomainError.js";

export class NotMessageAuthorError extends DomainError {
  constructor() {
    super("Only the message author can delete this message");
  }
}