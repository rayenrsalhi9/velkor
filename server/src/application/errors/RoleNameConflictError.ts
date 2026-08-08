import { DomainError } from "./DomainError.js";

export class RoleNameConflictError extends DomainError {
  constructor() {
    super("Role name already exists");
  }
}
