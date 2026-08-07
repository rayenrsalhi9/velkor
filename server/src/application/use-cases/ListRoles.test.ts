import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListRoles } from "./ListRoles.js";
import { Role } from "../../domain/entities/Role.js";
import type { RoleRepository } from "../ports/RoleRepository.js";

const ROLES = [
  new Role("r1", "Admin", "Full access", ["*"]),
  new Role("r2", "Employee", null, ["documents:view-list"]),
];

function makeUseCase(roles: Role[]) {
  const roleRepository: RoleRepository = {
    async list() {
      return roles;
    },
    async findById() {
      return null;
    },
    async findByName() {
      return null;
    },
    async create(input) {
      return new Role("new", input.name, input.description, input.claims);
    },
    async update(id, input) {
      return new Role(id, input.name ?? "x", input.description ?? null, input.claims ?? []);
    },
    async delete() {},
    async countUsers() {
      return 0;
    },
  };
  return new ListRoles(roleRepository);
}

describe("ListRoles", () => {
  it("returns all roles with their claims", async () => {
    const result = await makeUseCase(ROLES).execute();
    assert.equal(result.length, 2);
    assert.deepEqual(result[0]!.claims, ["*"]);
    assert.deepEqual(result[1]!.claims, ["documents:view-list"]);
  });
});
