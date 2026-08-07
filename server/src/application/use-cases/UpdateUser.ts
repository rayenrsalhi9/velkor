import type { UserAdminRepository, UserListItem } from "../ports/UserAdminRepository.js";
import { toUserListItem } from "../ports/UserAdminRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { RoleRepository } from "../ports/RoleRepository.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";
import { RoleNotFoundError } from "../errors/RoleNotFoundError.js";

export interface UpdateUserInput {
  fullName?: string;
  roleId?: string;
  password?: string;
}

export class UpdateUser {
  constructor(
    private userRepository: UserAdminRepository,
    private passwordHasher: PasswordHasher,
    private roleRepository: RoleRepository,
  ) {}

  async execute(id: string, input: UpdateUserInput): Promise<UserListItem> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new UserNotFoundError();
    }

    if (input.roleId) {
      const role = await this.roleRepository.findById(input.roleId);
      if (!role) {
        throw new RoleNotFoundError();
      }
    }

    const user = await this.userRepository.update(id, {
      ...(input.fullName !== undefined && { fullName: input.fullName }),
      ...(input.roleId !== undefined && { roleId: input.roleId }),
      ...(input.password !== undefined && {
        passwordHash: await this.passwordHasher.hash(input.password),
      }),
    });
    return toUserListItem(user);
  }
}
