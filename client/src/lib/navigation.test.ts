import { describe, it, expect } from "vitest";
import {
  WILDCARD_CLAIM,
  NAV_ITEMS,
  crumbFor,
  hasClaim,
  visibleNavItems,
} from "./navigation";

describe("hasClaim", () => {
  it("allows when no claim is required", () => {
    expect(hasClaim([], undefined)).toBe(true);
  });

  it("allows when the claim is present", () => {
    expect(hasClaim(["users:manage"], "users:manage")).toBe(true);
  });

  it("denies when the claim is missing", () => {
    expect(hasClaim(["roles:manage"], "users:manage")).toBe(false);
  });

  it("requires every claim in an array", () => {
    expect(
      hasClaim(["users:manage", "roles:manage"], [
        "users:manage",
        "roles:manage",
      ]),
    ).toBe(true);
    expect(hasClaim(["users:manage"], ["users:manage", "roles:manage"])).toBe(
      false,
    );
  });

  it("grants everything on the wildcard claim", () => {
    expect(hasClaim([WILDCARD_CLAIM], "users:manage")).toBe(true);
    expect(hasClaim([WILDCARD_CLAIM], ["users:manage", "roles:manage"])).toBe(
      true,
    );
  });

  it("accepts an empty required list", () => {
    expect(hasClaim([], [])).toBe(true);
  });
});

describe("visibleNavItems", () => {
  it("shows claim-free items to everyone", () => {
    const items = visibleNavItems([]);
    const paths = items.map((item) => item.path);
    expect(paths).toContain("/");
    expect(paths).toContain("/chat");
    expect(paths).toContain("/settings");
  });

  it("filters items by granted claims", () => {
    const items = visibleNavItems(["documents:view-list"]);
    const paths = items.map((item) => item.path);
    expect(paths).toContain("/documents");
    expect(paths).not.toContain("/users");
    expect(paths).not.toContain("/roles");
  });

  it("shows the users link only with both users:manage and roles:manage", () => {
    expect(visibleNavItems(["users:manage"]).some((i) => i.path === "/users")).toBe(
      false,
    );
    expect(
      visibleNavItems(["users:manage", "roles:manage"]).some(
        (i) => i.path === "/users",
      ),
    ).toBe(true);
  });

  it("shows everything to wildcard users", () => {
    expect(visibleNavItems([WILDCARD_CLAIM])).toHaveLength(NAV_ITEMS.length);
  });
});

describe("crumbFor", () => {
  it("returns crumbs for a known route", () => {
    const crumbs = crumbFor("/users");
    expect(crumbs.map((c) => c.label)).toEqual(["Dashboard", "Users"]);
    expect(crumbs[crumbs.length - 1].path).toBeNull();
  });

  it("returns empty crumbs for an unknown route", () => {
    expect(crumbFor("/nope")).toEqual([]);
  });
});
