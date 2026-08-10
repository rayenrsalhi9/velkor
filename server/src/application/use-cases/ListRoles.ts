import type { RoleRepository, ListRolesParams } from "../ports/RoleRepository.js";
import type { Paginated } from "../ports/ListQuery.js";
import type { Role } from "../../domain/entities/Role.js";

export class ListRoles {
  constructor(private roleRepository: RoleRepository) {}

  async execute(params: ListRolesParams): Promise<Paginated<Role>> {
    return this.roleRepository.list(params);
  }
}
