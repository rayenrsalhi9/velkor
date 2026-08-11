import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CreateCategory } from "./CreateCategory.js";
import { Category } from "../../domain/entities/Category.js";
import { CategoryNameConflictError } from "../errors/CategoryNameConflictError.js";
import type { CategoryRepository } from "../ports/CategoryRepository.js";

function makeUseCase(overrides?: { existingName?: string | null }) {
  const calls: { name: string; description: string | null }[] = [];
  const categoryRepository: CategoryRepository = {
    async list() {
      return { items: [], total: 0 };
    },
    async findById() {
      return null;
    },
    async findByName(name) {
      return overrides?.existingName === name
        ? new Category("c1", name, null)
        : null;
    },
    async create(input) {
      calls.push({ name: input.name, description: input.description });
      return new Category("c2", input.name, input.description);
    },
    async update(id, input) {
      return new Category(id, input.name ?? "x", input.description ?? null);
    },
    async delete() {},
    async countDocuments() {
      return 0;
    },
  };
  return { createCategory: new CreateCategory(categoryRepository), calls };
}

describe("CreateCategory", () => {
  it("creates a category with name and description", async () => {
    const h = makeUseCase();
    const category = await h.createCategory.execute({
      name: "Policies",
      description: "Internal policies",
    });
    assert.equal(category.name, "Policies");
    assert.deepEqual(h.calls[0], {
      name: "Policies",
      description: "Internal policies",
    });
  });

  it("rejects a duplicate category name", async () => {
    const h = makeUseCase({ existingName: "Policies" });
    await assert.rejects(
      h.createCategory.execute({ name: "Policies", description: null }),
      CategoryNameConflictError,
    );
  });
});