import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import { makeAttachClaims } from "./attachClaims.js";
import { GetCurrentUserClaims } from "../../../application/use-cases/GetCurrentUserClaims.js";
import { User } from "../../../domain/entities/User.js";
import type { Request, Response } from "express";
import type { UserRepository } from "../../../application/ports/UserRepository.js";

const USER = new User("u1", "user@velkor.local", "Test User", "hash", "admin");

function makeUseCase(mode: "found" | "not-found" | "boom") {
  const userRepository: UserRepository = {
    async findByEmail() {
      return null;
    },
    async findById() {
      if (mode === "not-found") return null;
      if (mode === "boom") throw new Error("db down");
      return USER;
    },
  };
  return new GetCurrentUserClaims(userRepository);
}

type FakeRes = {
  statusCode: number;
  body: unknown;
  status(code: number): FakeRes;
  json(body: unknown): FakeRes;
};

function makeRes(): FakeRes & Response {
  const res: FakeRes = {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return res as unknown as FakeRes & Response;
}

describe("makeAttachClaims", () => {
  it("attaches claims and calls next for a known user", async () => {
    const req = { userId: "u1" } as Request;
    const res = makeRes();
    const next = mock.fn();
    await makeAttachClaims(makeUseCase("found"))(req, res, next);
    assert.deepEqual(req.claims, { userId: "u1", role: "admin" });
    assert.equal(res.statusCode, 0);
    assert.equal(next.mock.callCount(), 1);
  });

  it("responds 401 when the user no longer exists", async () => {
    const req = { userId: "ghost" } as Request;
    const res = makeRes();
    const next = mock.fn();
    await makeAttachClaims(makeUseCase("not-found"))(req, res, next);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { error: "User not found" });
    assert.equal(next.mock.callCount(), 0);
  });

  it("forwards unexpected errors to next", async () => {
    const req = { userId: "u1" } as Request;
    const res = makeRes();
    const next = mock.fn();
    await makeAttachClaims(makeUseCase("boom"))(req, res, next);
    assert.equal(res.statusCode, 0);
    assert.equal(next.mock.callCount(), 1);
    assert.ok(next.mock.calls[0]!.arguments[0] instanceof Error);
  });
});
