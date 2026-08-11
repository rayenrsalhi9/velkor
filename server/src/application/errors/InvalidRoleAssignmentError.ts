import { DomainError } from "./DomainError.js";

export class InvalidRoleAssignmentError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}