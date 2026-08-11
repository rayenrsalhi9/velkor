import { DomainError } from "./DomainError.js";

export class DocumentNotFoundError extends DomainError {
  constructor() {
    super("Document not found");
  }
}