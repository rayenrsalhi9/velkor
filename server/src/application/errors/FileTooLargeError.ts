import { DomainError } from "./DomainError.js";

export class FileTooLargeError extends DomainError {
  constructor() {
    super("File is too large");
  }
}