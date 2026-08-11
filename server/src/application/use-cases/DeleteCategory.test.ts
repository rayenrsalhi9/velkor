import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DeleteCategory } from "./DeleteCategory.js";
import { Category } from "../../domain/entities/Category.js";
import { CategoryNotFoundError } from "../errors/CategoryNotFoundError.js";
import { CategoryInUseError } from "../errors/CategoryInUseError.js";
import type { CategoryRepository } from "../ports/CategoryRepository.js";

function makeUseCase(seed: Category | null, documentCount = 0) {
  const deletedIds: string[] = [];
  const categoryRepository: CategoryRepository = {
    async list() {
      return { items: [], total: 0 };
    },
    async findById(id) {
      return seed?.id === id ? seed : null;
    },
    async findByName() {
      return null;
    },
    async create(input) {
      return new Category("x", input.name, input.description);
    },
    async update() {
      return new Category("x", "x", null);
    },
    async delete(id) {
      deletedIds.push(id);
    },
    async countDocuments() {
      return documentCount;
    },
  };
  return { deleteCategory: new DeleteCategory(categoryRepository), deletedIds };
}

describe("DeleteCategory", () => {
  it("deletes a category with no documents", async () => {
    const h = makeUseCase(new Category("c1", "Policies", null), 0);
    await h.deleteCategory.execute("c1");
    assert.deepEqual(h.deletedIds, ["c1"]);
  });

  it("rejects when the category does not exist", async () => {
    const h = makeUseCase(null);
    await assert.rejects(h.deleteCategory.execute("missing"), CategoryNotFoundError);
  });

  it("rejects deletion when documents use the category", async () => {
    const h = makeUseCase(new Category("c1", "Policies", null), 3);
    await assert.rejects(h.deleteCategory.execute("c1"), CategoryInUseError);
    assert.equal(h.deletedIds.length, 0);
  });
});