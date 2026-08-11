import type { CategoryRepository, ListCategoriesParams } from "../ports/CategoryRepository.js";
import type { Paginated } from "../ports/ListQuery.js";
import type { Category } from "../../domain/entities/Category.js";

export class ListCategories {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(params: ListCategoriesParams): Promise<Paginated<Category>> {
    return this.categoryRepository.list(params);
  }
}