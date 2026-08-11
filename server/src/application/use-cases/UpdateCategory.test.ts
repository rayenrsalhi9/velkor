import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UpdateCategory } from "./UpdateCategory.js";
import { Category } from "../../domain/entities/Category.js";
import { CategoryNotFoundError } from "../errors/CategoryNotFoundError.js";
import { CategoryNameConflictError } from "../errors/CategoryNameConflictError.js";
import type { CategoryRepository, CategoryUpdateInput } from "../ports/CategoryRepository.js";

function makeUseCase(seed: Category | null, nameTaken?: Category | null) {
  const calls: { id: string; input: CategoryUpdateInput }[] = [];
  const categoryRepository: CategoryRepository = {
    async list() {
      return { items: [], total: 0 };
    },
    async findById(id) {
      return seed?.id === id ? seed : null;
    },
    async findByName() {
      return nameTaken ?? null;
    },
    async create(input) {
      return new Category("x", input.name, input.description);
    },
    async update(id, input) {
      calls.push({ id, input });
      return new Category(id, input.name ?? "x", input.description ?? null);
    },
    async delete() {},
    async countDocuments() {
      return 0;
    },
  };
  return { updateCategory: new UpdateCategory(categoryRepository), calls };
}

describe("UpdateCategory", () => {
  it("updates a category's description", async () => {
    const seed = new Category("c1", "Policies", "Old");
    const h = makeUseCase(seed);
    const category = await h.updateCategory.execute("c1", { description: "New" });
    assert.equal(category.description, "New");
  });

  it("rejects when the category does not exist", async () => {
    const h = makeUseCase(null);
    await assert.rejects(
      h.updateCategory.execute("missing", { name: "X" }),
      CategoryNotFoundError,
    );
  });

  it("ignores a rename to its own current name", async () => {
    const seed = new Category("c1", "Policies", null);
    const h = makeUseCase(seed, new Category("c1", "Policies", null));
    const category = await h.updateCategory.execute("c1", { name: "Policies" });
    assert.equal(category.name, "Policies");
  });

  it("rejects a rename to another existing name", async () => {
    const seed = new Category("c1", "Policies", null);
    const h = makeUseCase(seed, new Category("other", "Reports", null));
    await assert.rejects(
      h.updateCategory.execute("c1", { name: "Reports" }),
      CategoryNameConflictError,
    );
  });
});