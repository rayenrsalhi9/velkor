import type { CategoryRepository } from "../ports/CategoryRepository.js";
import { CategoryNotFoundError } from "../errors/CategoryNotFoundError.js";
import { CategoryInUseError } from "../errors/CategoryInUseError.js";

export class DeleteCategory {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new CategoryNotFoundError();
    }

    const documentCount = await this.categoryRepository.countDocuments(id);
    if (documentCount > 0) {
      throw new CategoryInUseError();
    }

    await this.categoryRepository.delete(id);
  }
}