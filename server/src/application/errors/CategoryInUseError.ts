import { DomainError } from "./DomainError.js";

export class CategoryInUseError extends DomainError {
  constructor() {
    super("Category has documents and cannot be deleted");
  }
}