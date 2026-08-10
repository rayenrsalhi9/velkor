import { User } from "../../domain/entities/User.js";
import type { ListQuery, Paginated } from "./ListQuery.js";

export interface ListUsersParams extends ListQuery {
  sortBy: "fullName" | "email" | "role" | "createdAt";
}

export interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: Date;
}

export function toUserListItem(user: User): UserListItem {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  passwordHash: string;
  roleId: string;
}

export interface UpdateUserInput {
  fullName?: string;
  roleId?: string;
  passwordHash?: string;
}

export interface UserAdminRepository {
  list(params: ListUsersParams): Promise<Paginated<User>>;
  findById(id: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  /**
   * Update a user. When revokeRefreshTokens is true, refresh-token revocation
   * and the user update commit in a single transaction, so a failed update
   * leaves existing sessions untouched.
   */
  update(id: string, input: UpdateUserInput, revokeRefreshTokens?: boolean): Promise<User>;
  delete(id: string): Promise<void>;
}
