import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createUserSchema, updateUserSchema } from "./userSchema.js";

const VALID_ID = "00000000-0000-0000-0000-000000000000";
const ASCII_72 = "a".repeat(72);
const MULTIBYTE_72 = "é".repeat(36);

function createWith(password: string) {
  return createUserSchema.safeParse({
    email: "user@velkor.local",
    fullName: "Test User",
    roleId: VALID_ID,
    password,
  });
}

function updateWith(password: string) {
  return updateUserSchema.safeParse({ password });
}

describe("userSchema password byte limits", () => {
  it("accepts a password of exactly 72 ASCII bytes on create", () => {
    assert.equal(createWith(ASCII_72).success, true);
  });

  it("rejects a password over 72 ASCII bytes on create", () => {
    const result = createWith("a".repeat(73));
    assert.equal(result.success, false);
  });

  it("accepts a multibyte password of exactly 72 UTF-8 bytes on create", () => {
    assert.equal(createWith(MULTIBYTE_72).success, true);
  });

  it("rejects a multibyte password over 72 UTF-8 bytes on create", () => {
    const result = createWith("é".repeat(37));
    assert.equal(result.success, false);
  });

  it("still enforces the 8-character minimum on create", () => {
    assert.equal(createWith("password123").success, true);
    assert.equal(createWith("pass123").success, false);
  });

  it("applies the same 72-byte limit on update", () => {
    assert.equal(updateWith(ASCII_72).success, true);
    assert.equal(updateWith("a".repeat(73)).success, false);
    assert.equal(updateWith(MULTIBYTE_72).success, true);
    assert.equal(updateWith("é".repeat(37)).success, false);
  });
});
