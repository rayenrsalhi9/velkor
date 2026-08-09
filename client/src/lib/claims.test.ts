import { describe, it, expect } from "vitest";
import { completeClaims } from "./claims";
import type { ClaimDefinition } from "./api";

const DEFS: ClaimDefinition[] = [
  { key: "a", label: "A", description: "", module: "M", dependsOn: ["b"] },
  { key: "b", label: "B", description: "", module: "M" },
  { key: "x", label: "X", description: "", module: "M", dependsOn: ["y"] },
  { key: "y", label: "Y", description: "", module: "M", dependsOn: ["z"] },
  { key: "z", label: "Z", description: "", module: "M" },
  { key: "d", label: "D", description: "", module: "M" },
];

describe("completeClaims", () => {
  it("adds direct dependencies", () => {
    expect(completeClaims(["a"], DEFS)).toEqual(["a", "b"]);
  });

  it("adds transitive dependencies", () => {
    expect(completeClaims(["x"], DEFS)).toEqual(["x", "y", "z"]);
  });

  it("does not duplicate existing claims", () => {
    expect(completeClaims(["a", "b"], DEFS)).toEqual(["a", "b"]);
    expect(completeClaims(["x", "y", "z"], DEFS)).toEqual(["x", "y", "z"]);
  });

  it("leaves claims without dependencies untouched", () => {
    expect(completeClaims(["d"], DEFS)).toEqual(["d"]);
  });

  it("passes empty lists through", () => {
    expect(completeClaims([], DEFS)).toEqual([]);
  });

  it("passes unknown keys through", () => {
    expect(completeClaims(["chat:read"], DEFS)).toEqual(["chat:read"]);
  });
});
