import type { RoleRepository } from "../ports/RoleRepository.js";
import type { RoleUpdateInput } from "../ports/RoleRepository.js";
import { Role } from "../../domain/entities/Role.js";
import { RoleNotFoundError } from "../errors/RoleNotFoundError.js";
import { RoleNameConflictError } from "../errors/RoleNameConflictError.js";
import { assertValidClaims } from "../claims/assertValidClaims.js";

export class UpdateRole {
  constructor(private roleRepository: RoleRepository) {}

  async execute(id: string, input: RoleUpdateInput): Promise<Role> {
    const existing = await this.roleRepository.findById(id);
    if (!existing) {
      throw new RoleNotFoundError();
    }

    if (input.claims) {
      assertValidClaims(input.claims);
    }

    if (input.name) {
      const nameTaken = await this.roleRepository.findByName(input.name);
      if (nameTaken && nameTaken.id !== id) {
        throw new RoleNameConflictError();
      }
    }

    return this.roleRepository.update(id, input);
  }
}
