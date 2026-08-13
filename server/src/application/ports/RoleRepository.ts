import { Role } from "../../domain/entities/Role.js";
import type { ListQuery, Paginated } from "./ListQuery.js";

export interface ListRolesParams extends ListQuery {
  sortBy: "name" | "createdAt";
}

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
  list(params: ListRolesParams): Promise<Paginated<Role>>;
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  create(input: RoleInput): Promise<Role>;
  update(id: string, input: RoleUpdateInput): Promise<Role>;
  delete(id: string): Promise<void>;
  countUsers(roleId: string): Promise<number>;
  countByIds(ids: string[]): Promise<number>;
}
