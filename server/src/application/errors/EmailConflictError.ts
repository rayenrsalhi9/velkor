import { DomainError } from "./DomainError.js";

export class EmailConflictError extends DomainError {
  constructor() {
    super("A user with this email already exists");
  }
}
