import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { usersListQuerySchema } from "./userSchema.js";
import { rolesListQuerySchema } from "./roleSchema.js";

describe("list query schemas", () => {
  it("applies defaults for empty query strings", () => {
    const users = usersListQuerySchema.parse({});
    assert.equal(users.q, undefined);
    assert.deepEqual(
      { sortBy: users.sortBy, order: users.order, page: users.page, pageSize: users.pageSize },
      { sortBy: "fullName", order: "asc", page: 1, pageSize: 10 },
    );
    const roles = rolesListQuerySchema.parse({});
    assert.equal(roles.q, undefined);
    assert.equal(roles.sortBy, "name");
  });

  it("coerces string page and pageSize", () => {
    const result = usersListQuerySchema.parse({ page: "2", pageSize: "25" });
    assert.equal(result.page, 2);
    assert.equal(result.pageSize, 25);
  });

  it("rejects invalid sortBy and order values", () => {
    assert.equal(usersListQuerySchema.safeParse({ sortBy: "passwordHash" }).success, false);
    assert.equal(usersListQuerySchema.safeParse({ order: "sideways" }).success, false);
    assert.equal(rolesListQuerySchema.safeParse({ sortBy: "claims" }).success, false);
  });

  it("rejects unknown query params", () => {
    assert.equal(usersListQuerySchema.safeParse({ role: "Admin" }).success, false);
    assert.equal(rolesListQuerySchema.safeParse({ filter: "x" }).success, false);
  });

  it("clamps pageSize to the 100 max", () => {
    assert.equal(usersListQuerySchema.safeParse({ pageSize: "101" }).success, false);
  });
});
