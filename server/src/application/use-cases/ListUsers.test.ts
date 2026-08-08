import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListUsers } from "./ListUsers.js";
import { User } from "../../domain/entities/User.js";
import type { UserAdminRepository } from "../ports/UserAdminRepository.js";

function makeUseCase() {
  const userRepository: UserAdminRepository = {
    async list() {
      return [
        new User("u1", "alice@velkor.local", "Alice", "hash-a", "Admin", ["*"], new Date("2026-01-01T00:00:00Z")),
        new User("u2", "bob@velkor.local", "Bob", "hash-b", "Employee", [], new Date("2026-02-01T00:00:00Z")),
      ];
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

describe("ListUsers", () => {
  it("returns id, email, fullName, role, and createdAt without password hashes", async () => {
    const users = await makeUseCase().execute();
    assert.deepEqual(users, [
      { id: "u1", email: "alice@velkor.local", fullName: "Alice", role: "Admin", createdAt: new Date("2026-01-01T00:00:00Z") },
      { id: "u2", email: "bob@velkor.local", fullName: "Bob", role: "Employee", createdAt: new Date("2026-02-01T00:00:00Z") },
    ]);
  });
});
