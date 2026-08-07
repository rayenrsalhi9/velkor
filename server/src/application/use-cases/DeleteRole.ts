import type { RoleRepository } from "../ports/RoleRepository.js";
import { RoleNotFoundError } from "../errors/RoleNotFoundError.js";
import { RoleInUseError } from "../errors/RoleInUseError.js";

export class DeleteRole {
  constructor(private roleRepository: RoleRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.roleRepository.findById(id);
    if (!existing) {
      throw new RoleNotFoundError();
    }

    const userCount = await this.roleRepository.countUsers(id);
    if (userCount > 0) {
      throw new RoleInUseError();
    }

    await this.roleRepository.delete(id);
  }
}
