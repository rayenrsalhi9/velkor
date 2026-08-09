import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListRoles } from "./ListRoles.js";
import { Role } from "../../domain/entities/Role.js";
import type { RoleRepository } from "../ports/RoleRepository.js";

const ROLES = [
  new Role("r1", "Admin", "Full access", ["*"], new Date("2026-01-01T00:00:00Z")),
  new Role("r2", "Travel Consultant", "Books travel", ["documents:view-list"], new Date("2026-02-01T00:00:00Z")),
];

function makeUseCase() {
  const roleRepository: RoleRepository = {
    async list() {
      return { items: ROLES, total: 2 };
    },
    async findById() {
      return null;
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
  return new ListRoles(roleRepository);
}

describe("ListRoles", () => {
  it("returns the paginated role list", async () => {
    const result = await makeUseCase().execute({
      q: undefined,
      sortBy: "name",
      order: "asc",
      page: 1,
      pageSize: 10,
    });
    assert.deepEqual(result, { items: ROLES, total: 2 });
  });

  it("forwards the list params to the repository", async () => {
    let received: unknown;
    const useCase = new ListRoles({
      async list(params) {
        received = params;
        return { items: [], total: 0 };
      },
      async findById() {
        return null;
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
    });
    const params = { q: "travel", sortBy: "createdAt" as const, order: "desc" as const, page: 2, pageSize: 10 };
    await useCase.execute(params);
    assert.deepEqual(received, params);
  });
});
