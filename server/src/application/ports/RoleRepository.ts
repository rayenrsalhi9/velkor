import { Role } from "../../domain/entities/Role.js";

export interface RoleInput {
  name: string;
  description: string | null;
  claims: string[];
}

export interface RoleUpdateInput {
  name?: string;
  description?: string | null;
  claims?: string[];
}

export interface RoleRepository {
  list(): Promise<Role[]>;
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  create(input: RoleInput): Promise<Role>;
  update(id: string, input: RoleUpdateInput): Promise<Role>;
  delete(id: string): Promise<void>;
  countUsers(roleId: string): Promise<number>;
}
