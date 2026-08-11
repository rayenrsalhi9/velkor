import type { CategoryRepository, CategoryUpdateInput } from "../ports/CategoryRepository.js";
import { Category } from "../../domain/entities/Category.js";
import { CategoryNotFoundError } from "../errors/CategoryNotFoundError.js";
import { CategoryNameConflictError } from "../errors/CategoryNameConflictError.js";

export class UpdateCategory {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(id: string, input: CategoryUpdateInput): Promise<Category> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new CategoryNotFoundError();
    }

    if (input.name && input.name !== existing.name) {
      const nameTaken = await this.categoryRepository.findByName(input.name);
      if (nameTaken && nameTaken.id !== id) {
        throw new CategoryNameConflictError();
      }
    }

    return this.categoryRepository.update(id, input);
  }
}