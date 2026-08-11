import type { CategoryRepository } from "../ports/CategoryRepository.js";
import { Category } from "../../domain/entities/Category.js";
import { CategoryNameConflictError } from "../errors/CategoryNameConflictError.js";

export interface CreateCategoryInput {
  name: string;
  description: string | null;
}

export class CreateCategory {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    const existing = await this.categoryRepository.findByName(input.name);
    if (existing) {
      throw new CategoryNameConflictError();
    }

    return this.categoryRepository.create(input);
  }
}