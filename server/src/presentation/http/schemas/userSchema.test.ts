import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createUserSchema, updateProfileSchema, updateUserSchema } from "./userSchema.js";

const VALID_ID = "00000000-0000-0000-0000-000000000000";
const ASCII_72 = "a".repeat(70) + "1!";
const MULTIBYTE_72 = "é".repeat(35) + "1!";

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
    const result = createWith("a".repeat(71) + "1!");
    assert.equal(result.success, false);
  });

  it("accepts a multibyte password of exactly 72 UTF-8 bytes on create", () => {
    assert.equal(createWith(MULTIBYTE_72).success, true);
  });

  it("rejects a multibyte password over 72 UTF-8 bytes on create", () => {
    const result = createWith("é".repeat(36) + "1!");
    assert.equal(result.success, false);
  });

  it("still enforces the 8-character minimum on create", () => {
    assert.equal(createWith("Passw0rd!").success, true);
    assert.equal(createWith("Pass0!").success, false);
  });

  it("rejects a password without a number", () => {
    assert.equal(createWith("password!!").success, false);
  });

  it("rejects a password without a special character", () => {
    assert.equal(createWith("password1").success, false);
    assert.equal(createWith("password1 ").success, false);
    assert.equal(createWith("passwordé1").success, false);
  });

  it("applies the same 72-byte limit on update", () => {
    assert.equal(updateWith(ASCII_72).success, true);
    assert.equal(updateWith("a".repeat(71) + "1!").success, false);
    assert.equal(updateWith(MULTIBYTE_72).success, true);
    assert.equal(updateWith("é".repeat(36) + "1!").success, false);
  });

  it("rejects a password without a number or special character on update", () => {
    assert.equal(updateWith("password!!").success, false);
    assert.equal(updateWith("password1").success, false);
  });

  it("rejects an empty update object", () => {
    assert.equal(updateUserSchema.safeParse({}).success, false);
  });

  it("rejects an empty profile update object", () => {
    assert.equal(updateProfileSchema.safeParse({}).success, false);
  });
});
