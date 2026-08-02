import type { UserRepository } from "../ports/UserRepository.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

export class GetCurrentUserProfile {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return { userId: user.id, email: user.email, fullName: user.fullName, role: user.role };
  }
}
