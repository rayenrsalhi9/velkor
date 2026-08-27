import { DomainError } from "./DomainError.js";

export class NotChannelOwnerError extends DomainError {
  constructor() {
    super("Only the channel creator or an admin can delete this channel");
  }
}