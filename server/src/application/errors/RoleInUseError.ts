export class RoleInUseError extends Error {
  constructor() {
    super("Role is assigned to users and cannot be deleted");
    this.name = "RoleInUseError";
  }
}
