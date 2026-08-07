export class RoleNameConflictError extends Error {
  constructor() {
    super("Role name already exists");
    this.name = "RoleNameConflictError";
  }
}
