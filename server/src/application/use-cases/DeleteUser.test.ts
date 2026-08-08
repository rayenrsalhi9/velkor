import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DeleteUser } from "./DeleteUser.js";
import { User } from "../../domain/entities/User.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";
import { SelfDeletionError } from "../errors/SelfDeletionError.js";
import type { UserAdminRepository } from "../ports/UserAdminRepository.js";

const USER = new User("u1", "alice@velkor.local", "Alice", "hash", "Employee", new Date("2026-01-01T00:00:00Z"));

function makeUseCase(overrides?: { user?: User | null }) {
  const deleted: string[] = [];
  const userRepository: UserAdminRepository = {
    async list() {
      return [];
    },
    async findById() {
      return overrides?.user === undefined ? USER : overrides.user;
    },
    async create() {
      throw new Error("not used");
    },
    async update() {
      throw new Error("not used");
    },
    async delete(id) {
      deleted.push(id);
    },
  };
  return { deleteUser: new DeleteUser(userRepository), deleted };
}

describe("DeleteUser", () => {
  it("deletes an existing user", async () => {
    const h = makeUseCase();
    await h.deleteUser.execute("u1", "admin1");
    assert.deepEqual(h.deleted, ["u1"]);
  });

  it("rejects deleting your own account", async () => {
    const h = makeUseCase();
    await assert.rejects(h.deleteUser.execute("u1", "u1"), SelfDeletionError);
    assert.equal(h.deleted.length, 0);
  });

  it("throws UserNotFoundError for an unknown user", async () => {
    const h = makeUseCase({ user: null });
    await assert.rejects(
      h.deleteUser.execute("ghost", "admin1"),
      UserNotFoundError,
    );
  });
});
