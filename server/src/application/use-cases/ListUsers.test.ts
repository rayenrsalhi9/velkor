import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListUsers } from "./ListUsers.js";
import { User } from "../../domain/entities/User.js";
import type { UserAdminRepository } from "../ports/UserAdminRepository.js";

function makeUseCase() {
  const userRepository: UserAdminRepository = {
    async list() {
      return {
        items: [
          new User("u1", "alice@velkor.local", "Alice", "hash-a", "Admin", new Date("2026-01-01T00:00:00Z"), ["*"]),
          new User("u2", "bob@velkor.local", "Bob", "hash-b", "Employee", new Date("2026-02-01T00:00:00Z"), []),
        ],
        total: 2,
      };
    },
    async findById() {
      return null;
    },
    async create() {
      throw new Error("not used");
    },
    async update() {
      throw new Error("not used");
    },
    async delete() {},
  };
  return new ListUsers(userRepository);
}

const DEFAULT_PARAMS = {
  q: undefined,
  sortBy: "fullName",
  order: "asc",
  page: 1,
  pageSize: 10,
} as const;

describe("ListUsers", () => {
  it("returns id, email, fullName, role, and createdAt without password hashes", async () => {
    const users = await makeUseCase().execute(DEFAULT_PARAMS);
    assert.deepEqual(users, {
      items: [
        { id: "u1", email: "alice@velkor.local", fullName: "Alice", role: "Admin", createdAt: new Date("2026-01-01T00:00:00Z") },
        { id: "u2", email: "bob@velkor.local", fullName: "Bob", role: "Employee", createdAt: new Date("2026-02-01T00:00:00Z") },
      ],
      total: 2,
    });
  });

  it("forwards the list params to the repository", async () => {
    let received: unknown;
    const useCase = new ListUsers({
      async list(params) {
        received = params;
        return { items: [], total: 0 };
      },
      async findById() {
        return null;
      },
      async create() {
        throw new Error("not used");
      },
      async update() {
        throw new Error("not used");
      },
      async delete() {},
    });
    const params = { q: "ali", sortBy: "email" as const, order: "desc" as const, page: 3, pageSize: 10 };
    await useCase.execute(params);
    assert.deepEqual(received, params);
  });
});
