import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CreateUser } from "./CreateUser.js";
import { User } from "../../domain/entities/User.js";
import { Role } from "../../domain/entities/Role.js";
import { RoleNotFoundError } from "../errors/RoleNotFoundError.js";
import { EmailConflictError } from "../errors/EmailConflictError.js";
import type {
  UserAdminRepository,
  CreateUserInput,
} from "../ports/UserAdminRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { RoleRepository } from "../ports/RoleRepository.js";
import { makeNotificationRepository } from "./notificationTestSupport.js";

function makeUseCase(overrides?: { roleExists?: boolean; createThrows?: boolean }) {
  const created: CreateUserInput[] = [];
  const userRepository: UserAdminRepository = {
    async list() {
      return { items: [], total: 0 };
    },
    async findById() {
      return null;
    },
    async create(input) {
      if (overrides?.createThrows) {
        throw new EmailConflictError();
      }
      created.push(input);
      return new User("u1", input.email, input.fullName, input.passwordHash, "Employee", new Date("2026-01-01T00:00:00Z"));
    },
    async update() {
      throw new Error("not used");
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
      return { items: [], total: 0 };
    },
    async findById() {
      return overrides?.roleExists === false
        ? null
        : new Role("r1", "Employee", null, []);
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
    async countByIds() {
      return 0;
    },
    async listUserIdsByRoleIds() {
      return [];
    },
  };
  const notification = makeNotificationRepository();
  return {
    createUser: new CreateUser(
      userRepository,
      passwordHasher,
      roleRepository,
      notification.repository,
    ),
    created,
    notification,
  };
}

describe("CreateUser", () => {
  it("hashes the password and stores a user with its role", async () => {
    const h = makeUseCase();
    const user = await h.createUser.execute({
      email: "carol@velkor.local",
      fullName: "Carol",
      password: "secret123",
      roleId: "r1",
    });
    assert.equal(user.email, "carol@velkor.local");
    assert.equal(user.role, "Employee");
    assert.deepEqual(h.created[0], {
      email: "carol@velkor.local",
      fullName: "Carol",
      passwordHash: "hashed:secret123",
      roleId: "r1",
    });
  });

  it("rejects an unknown role", async () => {
    const h = makeUseCase({ roleExists: false });
    await assert.rejects(
      h.createUser.execute({
        email: "d@velkor.local",
        fullName: "D",
        password: "secret123",
        roleId: "ghost",
      }),
      RoleNotFoundError,
    );
    assert.equal(h.created.length, 0);
  });

  it("propagates an email conflict", async () => {
    const h = makeUseCase({ createThrows: true });
    await assert.rejects(
      h.createUser.execute({
        email: "dup@velkor.local",
        fullName: "D",
        password: "secret123",
        roleId: "r1",
      }),
      EmailConflictError,
    );
  });

  it("creates a welcome notification for the new user", async () => {
    const h = makeUseCase();
    await h.createUser.execute(
      {
        email: "carol@velkor.local",
        fullName: "Carol",
        password: "secret123",
        roleId: "r1",
      },
      "admin-id",
    );
    assert.deepEqual(h.notification.calls.createMany, [
      [
        {
          userId: "u1",
          type: "welcome",
          title: "Welcome to Velkor",
          body: "Your account is ready. Sign in at carol@velkor.local.",
          actorId: "admin-id",
          refType: "user",
          refId: "u1",
        },
      ],
    ]);
  });
});
