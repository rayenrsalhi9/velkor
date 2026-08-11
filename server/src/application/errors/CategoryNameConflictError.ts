import { DomainError } from "./DomainError.js";

export class CategoryNameConflictError extends DomainError {
  constructor() {
    super("Category name already exists");
  }
}