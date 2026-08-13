import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loginSchema } from "./loginSchema.js";

function parse(email: string) {
  return loginSchema.safeParse({ email, password: "password1" });
}

describe("loginSchema email normalization", () => {
  it("accepts a valid email", () => {
    assert.equal(parse("User@Velkor.Local").success, true);
  });

  it("lowercases the email for lookup", () => {
    const result = parse("  User@Velkor.Local  ");
    assert.ok(result.success);
    if (result.success) {
      assert.equal(result.data.email, "user@velkor.local");
    }
  });

  it("rejects an invalid email", () => {
    assert.equal(parse("not-an-email").success, false);
  });

  it("rejects unknown fields instead of stripping them", () => {
    const result = loginSchema.safeParse({
      email: "user@velkor.local",
      password: "password1",
      rememberMe: true,
    });
    assert.equal(result.success, false);
  });
});
