import { DomainError } from "./DomainError.js";

export class MessageNotFoundError extends DomainError {
  constructor() {
    super("Message not found");
  }
}