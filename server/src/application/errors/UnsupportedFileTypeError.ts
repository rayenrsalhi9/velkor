import { DomainError } from "./DomainError.js";

export class UnsupportedFileTypeError extends DomainError {
  constructor() {
    super("File type is not supported");
  }
}