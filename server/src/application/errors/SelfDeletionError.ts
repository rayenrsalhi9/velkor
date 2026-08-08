import { DomainError } from "./DomainError.js";

export class SelfDeletionError extends DomainError {
  constructor() {
    super("You cannot delete your own account");
  }
}
