import { DomainError } from "./DomainError.js";

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super("Invalid refresh token");
  }
}
