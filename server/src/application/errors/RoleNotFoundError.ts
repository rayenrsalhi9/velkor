import { DomainError } from "./DomainError.js";

export class RoleNotFoundError extends DomainError {
  constructor() {
    super("Role not found");
  }
}
