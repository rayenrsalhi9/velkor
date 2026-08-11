import { DomainError } from "./DomainError.js";

export class CategoryNotFoundError extends DomainError {
  constructor() {
    super("Category not found");
  }
}