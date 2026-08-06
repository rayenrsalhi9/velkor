import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GetCurrentUserClaims } from "./GetCurrentUserClaims.js";
import { User } from "../../domain/entities/User.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";
import type { UserRepository } from "../ports/UserRepository.js";

const USER = new User("u1", "user@velkor.local", "Test User", "hash", "admin", [
  "*",
]);

function makeUseCase(user: User | null) {
  const userRepository: UserRepository = {
    async findByEmail() {
      return null;
    },
    async findById(id) {
      return id === "u1" ? user : null;
    },
  };
  return new GetCurrentUserClaims(userRepository);
}

describe("GetCurrentUserClaims", () => {
  it("returns userId, role, and claims for a known user", async () => {
    const result = await makeUseCase(USER).execute("u1");
    assert.deepEqual(result, { userId: "u1", role: "admin", claims: ["*"] });
  });

  it("throws UserNotFoundError for an unknown user", async () => {
    await assert.rejects(makeUseCase(null).execute("ghost"), UserNotFoundError);
  });
});
