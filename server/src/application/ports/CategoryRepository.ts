import { Category } from "../../domain/entities/Category.js";
import type { ListQuery, Paginated } from "./ListQuery.js";

export interface ListCategoriesParams extends ListQuery {
  sortBy: "name" | "createdAt";
}

export interface CategoryInput {
  name: string;
  description: string | null;
}

export interface CategoryUpdateInput {
  name?: string;
  description?: string | null;
}

export interface CategoryRepository {
  list(params: ListCategoriesParams): Promise<Paginated<Category>>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  create(input: CategoryInput): Promise<Category>;
  update(id: string, input: CategoryUpdateInput): Promise<Category>;
  delete(id: string): Promise<void>;
  countDocuments(categoryId: string): Promise<number>;
}