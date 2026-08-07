export class SelfDeletionError extends Error {
  constructor() {
    super("You cannot delete your own account");
    this.name = "SelfDeletionError";
  }
}
