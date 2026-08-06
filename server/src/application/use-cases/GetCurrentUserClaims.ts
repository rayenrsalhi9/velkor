import type { UserRepository } from "../ports/UserRepository.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";

export interface UserClaims {
  userId: string;
  role: string;
  claims: string[];
}

export class GetCurrentUserClaims {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string): Promise<UserClaims> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return { userId: user.id, role: user.role, claims: user.claims };
  }
}
