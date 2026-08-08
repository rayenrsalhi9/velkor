import type { UserRepository } from "../ports/UserRepository.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";

export interface CurrentUser {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  claims: string[];
}

export class GetCurrentUser {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string): Promise<CurrentUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      claims: user.claims,
    };
  }
}
