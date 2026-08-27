import { DomainError } from "./DomainError.js";

export class ChannelNameConflictError extends DomainError {
  constructor() {
    super("Channel name already exists");
  }
}