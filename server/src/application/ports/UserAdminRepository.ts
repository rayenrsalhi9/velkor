import { User } from "../../domain/entities/User.js";

export interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export function toUserListItem(user: User): UserListItem {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
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
  list(): Promise<User[]>;
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
