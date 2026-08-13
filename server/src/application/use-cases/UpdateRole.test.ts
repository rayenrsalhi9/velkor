import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UpdateRole } from "./UpdateRole.js";
import { Role } from "../../domain/entities/Role.js";
import { RoleNotFoundError } from "../errors/RoleNotFoundError.js";
import { RoleNameConflictError } from "../errors/RoleNameConflictError.js";
import { InvalidClaimsError } from "../errors/InvalidClaimsError.js";
import type { RoleRepository } from "../ports/RoleRepository.js";

const EXISTING = new Role("r1", "Employee", null, ["documents:view-list"]);

function makeUseCase(overrides?: { nameTakenByOther?: boolean }) {
  const calls: { id: string; input: unknown }[] = [];
  const roleRepository: RoleRepository = {
    async list() {
      return { items: [], total: 0 };
    },
    async findById(id) {
      return id === EXISTING.id ? EXISTING : null;
    },
    async findByName(name) {
      if (overrides?.nameTakenByOther && name === "Taken") {
        return new Role("r9", name, null, []);
      }
      return null;
    },
    async create(input) {
      return new Role("r2", input.name, input.description, input.claims);
    },
    async update(id, input) {
      calls.push({ id, input });
      return new Role(id, input.name ?? EXISTING.name, input.description ?? EXISTING.description, input.claims ?? EXISTING.claims);
    },
    async delete() {},
    async countUsers() {
      return 0;
    },
    async countByIds() {
      return 0;
    },
  };
  return { updateRole: new UpdateRole(roleRepository), calls };
}

describe("UpdateRole", () => {
  it("updates name, description, and replaces claims", async () => {
    const h = makeUseCase();
    const role = await h.updateRole.execute(EXISTING.id, {
      name: "Senior Employee",
      description: "Senior-level access",
      claims: ["documents:view-list", "documents:upload"],
    });
    assert.equal(role.name, "Senior Employee");
    assert.equal(role.description, "Senior-level access");
    assert.deepEqual(role.claims, [
      "documents:view-list",
      "documents:upload",
      "documents:view-categories",
    ]);
    assert.equal(h.calls[0]!.id, EXISTING.id);
  });

  it("throws RoleNotFoundError for an unknown role", async () => {
    const h = makeUseCase();
    await assert.rejects(
      h.updateRole.execute("ghost", { name: "x" }),
      RoleNotFoundError,
    );
  });

  it("throws RoleNameConflictError when the new name belongs to another role", async () => {
    const h = makeUseCase({ nameTakenByOther: true });
    await assert.rejects(
      h.updateRole.execute(EXISTING.id, { name: "Taken" }),
      RoleNameConflictError,
    );
  });

  it("rejects unknown claims", async () => {
    const h = makeUseCase();
    await assert.rejects(
      h.updateRole.execute(EXISTING.id, { claims: ["chat:read"] }),
      InvalidClaimsError,
    );
  });
});
