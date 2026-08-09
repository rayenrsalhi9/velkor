import { describe, it, expect } from "vitest";
import { getInitials } from "./initials";

describe("getInitials", () => {
  it("returns initials for a two-word name", () => {
    expect(getInitials("Sara Mansour")).toBe("SM");
  });

  it("returns the first letter for a single name", () => {
    expect(getInitials("Cher")).toBe("C");
  });

  it("handles extra whitespace", () => {
    expect(getInitials("  sara   mansour ")).toBe("SM");
  });

  it("returns a fallback for an empty name", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
  });
});
