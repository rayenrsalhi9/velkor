import { DomainError } from "./DomainError.js";

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super("Invalid credentials");
  }
}
