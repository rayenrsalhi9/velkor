import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CreateRole } from "./CreateRole.js";
import { Role } from "../../domain/entities/Role.js";
import { RoleNameConflictError } from "../errors/RoleNameConflictError.js";
import { InvalidClaimsError } from "../errors/InvalidClaimsError.js";
import type { RoleRepository } from "../ports/RoleRepository.js";

function makeUseCase(overrides?: { existingName?: string | null }) {
  const calls: { name: string; claims: string[] }[] = [];
  const roleRepository: RoleRepository = {
    async list() {
      return [];
    },
    async findById() {
      return null;
    },
    async findByName(name) {
      return overrides?.existingName === name
        ? new Role("r1", name, null, [])
        : null;
    },
    async create(input) {
      calls.push({ name: input.name, claims: input.claims });
      return new Role("r2", input.name, input.description, input.claims);
    },
    async update(id, input) {
      return new Role(id, input.name ?? "x", input.description ?? null, input.claims ?? []);
    },
    async delete() {},
    async countUsers() {
      return 0;
    },
  };
  return { createRole: new CreateRole(roleRepository), calls };
}

describe("CreateRole", () => {
  it("creates a role with its claims", async () => {
    const h = makeUseCase();
    const role = await h.createRole.execute({
      name: "Editor",
      description: "Edits documents",
      claims: ["documents:view-list", "documents:edit"],
    });
    assert.equal(role.name, "Editor");
    assert.deepEqual(h.calls[0]!.claims, ["documents:view-list", "documents:edit"]);
  });

  it("allows the wildcard claim", async () => {
    const h = makeUseCase();
    const role = await h.createRole.execute({ name: "Admin", description: null, claims: ["*"] });
    assert.deepEqual(role.claims, ["*"]);
  });

  it("auto-grants claims a selected claim depends on", async () => {
    const h = makeUseCase();
    await h.createRole.execute({
      name: "User admin",
      description: null,
      claims: ["users:manage"],
    });
    assert.deepEqual(h.calls[0]!.claims, [
      "users:manage",
      "roles:manage",
    ]);
  });

  it("rejects a duplicate role name", async () => {
    const h = makeUseCase({ existingName: "Employee" });
    await assert.rejects(
      h.createRole.execute({ name: "Employee", description: null, claims: [] }),
      RoleNameConflictError,
    );
  });

  it("rejects unknown claims", async () => {
    const h = makeUseCase();
    await assert.rejects(
      h.createRole.execute({ name: "Hacker", description: null, claims: ["chat:read"] }),
      InvalidClaimsError,
    );
  });
});
