import type { RoleRepository } from "../ports/RoleRepository.js";
import { Role } from "../../domain/entities/Role.js";
import { RoleNameConflictError } from "../errors/RoleNameConflictError.js";
import { assertValidClaims } from "../claims/assertValidClaims.js";

export interface CreateRoleInput {
  name: string;
  description: string | null;
  claims: string[];
}

export class CreateRole {
  constructor(private roleRepository: RoleRepository) {}

  async execute(input: CreateRoleInput): Promise<Role> {
    assertValidClaims(input.claims);

    const existing = await this.roleRepository.findByName(input.name);
    if (existing) {
      throw new RoleNameConflictError();
    }

    return this.roleRepository.create(input);
  }
}
