import type { UserAdminRepository, UserListItem } from "../ports/UserAdminRepository.js";
import { toUserListItem } from "../ports/UserAdminRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { RoleRepository } from "../ports/RoleRepository.js";
import type { RefreshTokenRepository } from "../ports/RefreshTokenRepository.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";
import { RoleNotFoundError } from "../errors/RoleNotFoundError.js";
import { InvalidRoleAssignmentError } from "../errors/InvalidRoleAssignmentError.js";

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
    private refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateUserInput,
    actorId: string,
  ): Promise<UserListItem> {
    if (id === actorId && input.roleId !== undefined) {
      throw new InvalidRoleAssignmentError("You cannot change your own role");
    }

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
    if (input.password !== undefined) {
      await this.refreshTokenRepository.revokeAllForUser(id);
    }
    return toUserListItem(user);
  }
}
