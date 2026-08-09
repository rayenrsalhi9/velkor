import type {
  UserAdminRepository,
  UserListItem,
  ListUsersParams,
} from "../ports/UserAdminRepository.js";
import { toUserListItem } from "../ports/UserAdminRepository.js";
import type { Paginated } from "../ports/ListQuery.js";

export class ListUsers {
  constructor(private userRepository: UserAdminRepository) {}

  async execute(params: ListUsersParams): Promise<Paginated<UserListItem>> {
    const { items, total } = await this.userRepository.list(params);
    return { items: items.map((user) => toUserListItem(user)), total };
  }
}
