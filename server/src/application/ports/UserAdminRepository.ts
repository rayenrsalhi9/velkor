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
  update(id: string, input: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<void>;
}
