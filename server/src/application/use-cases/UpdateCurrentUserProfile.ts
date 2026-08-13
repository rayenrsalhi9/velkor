import type { UserAdminRepository } from "../ports/UserAdminRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { RefreshTokenRepository } from "../ports/RefreshTokenRepository.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";
import type { CurrentUser } from "./GetCurrentUser.js";

export interface UpdateCurrentUserProfileInput {
  fullName?: string;
  password?: string;
}

export class UpdateCurrentUserProfile {
  constructor(
    private userRepository: UserAdminRepository,
    private passwordHasher: PasswordHasher,
    private refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(
    userId: string,
    input: UpdateCurrentUserProfileInput,
  ): Promise<CurrentUser> {
    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new UserNotFoundError();
    }

    const passwordHash =
      input.password !== undefined
        ? await this.passwordHasher.hash(input.password)
        : undefined;

    const user = await this.userRepository.update(
      userId,
      {
        ...(input.fullName !== undefined && { fullName: input.fullName }),
        ...(passwordHash !== undefined && { passwordHash }),
      },
      input.password !== undefined,
    );

    if (input.password !== undefined) {
      await this.refreshTokenRepository.revokeAllForUser(userId);
    }

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      claims: existing.claims,
    };
  }
}
