import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UpdateUser } from "./UpdateUser.js";
import { User } from "../../domain/entities/User.js";
import { Role } from "../../domain/entities/Role.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";
import { RoleNotFoundError } from "../errors/RoleNotFoundError.js";
import type {
  UserAdminRepository,
  UpdateUserInput,
} from "../ports/UserAdminRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { RoleRepository } from "../ports/RoleRepository.js";

const USER = new User("u1", "alice@velkor.local", "Alice", "hash", "Employee", new Date("2026-01-01T00:00:00Z"));

function makeUseCase(overrides?: { user?: User | null; roleExists?: boolean }) {
  const updates: { id: string; input: UpdateUserInput }[] = [];
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
    async update(id, input) {
      updates.push({ id, input });
      return USER;
    },
    async delete() {},
  };
  const passwordHasher: PasswordHasher = {
    async hash(password) {
      return "hashed:" + password;
    },
    async compare() {
      return false;
    },
  };
  const roleRepository: RoleRepository = {
    async list() {
      return [];
    },
    async findById() {
      return overrides?.roleExists === false
        ? null
        : new Role("r2", "Admin", null, []);
    },
    async findByName() {
      return null;
    },
    async create() {
      throw new Error("not used");
    },
    async update() {
      throw new Error("not used");
    },
    async delete() {},
    async countUsers() {
      return 0;
    },
  };
  return { updateUser: new UpdateUser(userRepository, passwordHasher, roleRepository), updates };
}

describe("UpdateUser", () => {
  it("updates fullName and roleId without touching email", async () => {
    const h = makeUseCase();
    await h.updateUser.execute("u1", { fullName: "Alicia", roleId: "r2" });
    assert.deepEqual(h.updates[0], {
      id: "u1",
      input: { fullName: "Alicia", roleId: "r2" },
    });
  });

  it("hashes a new password when provided", async () => {
    const h = makeUseCase();
    await h.updateUser.execute("u1", { password: "newsecret" });
    assert.deepEqual(h.updates[0]!.input, { passwordHash: "hashed:newsecret" });
  });

  it("throws UserNotFoundError for an unknown user", async () => {
    const h = makeUseCase({ user: null });
    await assert.rejects(
      h.updateUser.execute("ghost", { fullName: "X" }),
      UserNotFoundError,
    );
  });

  it("throws RoleNotFoundError for an unknown role", async () => {
    const h = makeUseCase({ roleExists: false });
    await assert.rejects(
      h.updateUser.execute("u1", { roleId: "ghost" }),
      RoleNotFoundError,
    );
  });
});
