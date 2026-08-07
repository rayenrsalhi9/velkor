import type { UserAdminRepository, UserListItem } from "../ports/UserAdminRepository.js";
import { toUserListItem } from "../ports/UserAdminRepository.js";

export class ListUsers {
  constructor(private userRepository: UserAdminRepository) {}

  async execute(): Promise<UserListItem[]> {
    const users = await this.userRepository.list();
    return users.map((user) => toUserListItem(user));
  }
}
