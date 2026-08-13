import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DeleteRole } from "./DeleteRole.js";
import { Role } from "../../domain/entities/Role.js";
import { RoleNotFoundError } from "../errors/RoleNotFoundError.js";
import { RoleInUseError } from "../errors/RoleInUseError.js";
import type { RoleRepository } from "../ports/RoleRepository.js";

function makeUseCase(overrides?: { exists?: boolean; users?: number }) {
  const deleted: string[] = [];
  const roleRepository: RoleRepository = {
    async list() {
      return { items: [], total: 0 };
    },
    async findById(id) {
      return overrides?.exists === false ? null : new Role(id, "x", null, []);
    },
    async findByName() {
      return null;
    },
    async create(input) {
      return new Role("r2", input.name, input.description, input.claims);
    },
    async update(id, input) {
      return new Role(id, input.name ?? "x", input.description ?? null, input.claims ?? []);
    },
    async delete(id) {
      deleted.push(id);
    },
    async countUsers() {
      return overrides?.users ?? 0;
    },
    async countByIds() {
      return 0;
    },
  };
  return { deleteRole: new DeleteRole(roleRepository), deleted };
}

describe("DeleteRole", () => {
  it("deletes a role that has no users", async () => {
    const h = makeUseCase();
    await h.deleteRole.execute("r1");
    assert.deepEqual(h.deleted, ["r1"]);
  });

  it("rejects deletion while users are assigned", async () => {
    const h = makeUseCase({ users: 3 });
    await assert.rejects(h.deleteRole.execute("r1"), RoleInUseError);
    assert.equal(h.deleted.length, 0);
  });

  it("throws RoleNotFoundError for an unknown role", async () => {
    const h = makeUseCase({ exists: false });
    await assert.rejects(h.deleteRole.execute("ghost"), RoleNotFoundError);
  });
});
