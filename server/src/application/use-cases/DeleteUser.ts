import type { UserAdminRepository } from "../ports/UserAdminRepository.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";
import { SelfDeletionError } from "../errors/SelfDeletionError.js";

export class DeleteUser {
  constructor(private userRepository: UserAdminRepository) {}

  async execute(id: string, actorId: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new UserNotFoundError();
    }

    if (id === actorId) {
      throw new SelfDeletionError();
    }

    await this.userRepository.delete(id);
  }
}
