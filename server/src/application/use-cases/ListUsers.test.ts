import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListUsers } from "./ListUsers.js";
import { User } from "../../domain/entities/User.js";
import type { UserAdminRepository } from "../ports/UserAdminRepository.js";

function makeUseCase() {
  const userRepository: UserAdminRepository = {
    async list() {
      return [
        new User("u1", "alice@velkor.local", "Alice", "hash-a", "Admin", ["*"]),
        new User("u2", "bob@velkor.local", "Bob", "hash-b", "Employee"),
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
  it("returns id, email, fullName, and role without password hashes", async () => {
    const users = await makeUseCase().execute();
    assert.deepEqual(users, [
      { id: "u1", email: "alice@velkor.local", fullName: "Alice", role: "Admin" },
      { id: "u2", email: "bob@velkor.local", fullName: "Bob", role: "Employee" },
    ]);
  });
});
