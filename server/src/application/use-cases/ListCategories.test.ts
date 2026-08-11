import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListCategories } from "./ListCategories.js";
import { Category } from "../../domain/entities/Category.js";
import type { CategoryRepository } from "../ports/CategoryRepository.js";

describe("ListCategories", () => {
  it("returns the paginated list from the repository", async () => {
    const categories = [
      new Category("c1", "Policies", null),
      new Category("c2", "Reports", null),
    ];
    const categoryRepository: CategoryRepository = {
      async list() {
        return { items: categories, total: 2 };
      },
      async findById() {
        return null;
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
      async delete() {},
      async countDocuments() {
        return 0;
      },
    };
    const listCategories = new ListCategories(categoryRepository);
    const result = await listCategories.execute({
      order: "asc",
      page: 1,
      pageSize: 10,
      sortBy: "name",
    });
    assert.equal(result.total, 2);
    assert.equal(result.items[0]?.name, "Policies");
  });
});