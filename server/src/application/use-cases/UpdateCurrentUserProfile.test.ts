import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UpdateCurrentUserProfile } from "./UpdateCurrentUserProfile.js";
import { User } from "../../domain/entities/User.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";
import type {
  UserAdminRepository,
  UpdateUserInput,
} from "../ports/UserAdminRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";

const USER = new User("u1", "alice@velkor.local", "Alice", "hash", "Employee", new Date("2026-01-01T00:00:00Z"));

function makeUseCase(overrides?: { user?: User | null; hasher?: PasswordHasher }) {
  const updates: { id: string; input: UpdateUserInput; revoke: boolean }[] = [];
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
    async update(id, input, revoke = false) {
      updates.push({ id, input, revoke });
      return USER;
    },
    async delete() {},
  };
  const passwordHasher: PasswordHasher = overrides?.hasher ?? {
    async hash(password) {
      return "hashed:" + password;
    },
    async compare() {
      return false;
    },
  };
  return {
    updateProfile: new UpdateCurrentUserProfile(userRepository, passwordHasher),
    updates,
  };
}

describe("UpdateCurrentUserProfile", () => {
  it("updates fullName without touching email or role or sessions", async () => {
    const h = makeUseCase();
    await h.updateProfile.execute("u1", { fullName: "Alicia" });
    assert.deepEqual(h.updates[0], {
      id: "u1",
      input: { fullName: "Alicia" },
      revoke: false,
    });
  });

  it("hashes a new password before persisting and revokes sessions in the same update", async () => {
    const h = makeUseCase();
    const profile = await h.updateProfile.execute("u1", { password: "newsecret" });
    assert.deepEqual(h.updates[0], {
      id: "u1",
      input: { passwordHash: "hashed:newsecret" },
      revoke: true,
    });
    assert.equal(profile.fullName, "Alice");
  });

  it("does not reach the repository when hashing fails", async () => {
    const h = makeUseCase({
      hasher: {
        async hash() {
          throw new Error("hash failed");
        },
        async compare() {
          return false;
        },
      },
    });
    await assert.rejects(
      h.updateProfile.execute("u1", { password: "newsecret" }),
      /hash failed/,
    );
    assert.equal(h.updates.length, 0);
  });

  it("throws UserNotFoundError for an unknown user", async () => {
    const h = makeUseCase({ user: null });
    await assert.rejects(
      h.updateProfile.execute("ghost", { fullName: "X" }),
      UserNotFoundError,
    );
  });
});
