import { DomainError } from "./DomainError.js";

export class RoleInUseError extends DomainError {
  constructor() {
    super("Role is assigned to users and cannot be deleted");
  }
}
