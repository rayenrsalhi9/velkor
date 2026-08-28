import type { UserAdminRepository, UserListItem } from "../ports/UserAdminRepository.js";
import { toUserListItem } from "../ports/UserAdminRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { RoleRepository } from "../ports/RoleRepository.js";
import type { NotificationRepository } from "../ports/NotificationRepository.js";
import { RoleNotFoundError } from "../errors/RoleNotFoundError.js";

export interface CreateUserInput {
  email: string;
  fullName: string;
  password: string;
  roleId: string;
}

export class CreateUser {
  constructor(
    private userRepository: UserAdminRepository,
    private passwordHasher: PasswordHasher,
    private roleRepository: RoleRepository,
    private notificationRepository: NotificationRepository,
  ) {}

  async execute(input: CreateUserInput, actorId?: string): Promise<UserListItem> {
    const role = await this.roleRepository.findById(input.roleId);
    if (!role) {
      throw new RoleNotFoundError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      fullName: input.fullName,
      passwordHash,
      roleId: input.roleId,
    });
    await this.notificationRepository.createMany([
      {
        userId: user.id,
        type: "welcome",
        title: "Welcome to Velkor",
        body: `Your account is ready. Sign in at ${input.email}.`,
        actorId: actorId ?? null,
        refType: "user",
        refId: user.id,
      },
    ]);
    return toUserListItem(user);
  }
}
