import { DomainError } from "./DomainError.js";

export class ChannelNotFoundError extends DomainError {
  constructor() {
    super("Channel not found");
  }
}