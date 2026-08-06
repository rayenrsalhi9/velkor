import type { RoleRepository } from "../ports/RoleRepository.js";
import { Role } from "../../domain/entities/Role.js";

export class ListRoles {
  constructor(private roleRepository: RoleRepository) {}

  async execute(): Promise<Role[]> {
    return this.roleRepository.list();
  }
}
