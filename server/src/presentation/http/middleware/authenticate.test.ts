import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import { makeAuthenticate } from "./authenticate.js";
import type { Request, Response } from "express";
import type { TokenService } from "../../../application/ports/TokenService.js";

function makeTokenService(validTokens: Set<string>): TokenService {
  return {
    generateAccessToken() {
      throw new Error("not used");
    },
    generateRefreshToken() {
      throw new Error("not used");
    },
    getRefreshTokenExpiresAt() {
      throw new Error("not used");
    },
    verifyToken(token) {
      return validTokens.has(token) ? { userId: "u1" } : null;
    },
  };
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

describe("makeAuthenticate", () => {
  it("rejects a missing Authorization header with 401", () => {
    const res = makeRes();
    const next = mock.fn();
    makeAuthenticate(makeTokenService(new Set(["good"])))(
      { headers: {} } as Request,
      res,
      next,
    );
    assert.equal(res.statusCode, 401);
    assert.equal(next.mock.callCount(), 0);
  });

  it("rejects a malformed (non-Bearer) header with 401", () => {
    const res = makeRes();
    const next = mock.fn();
    makeAuthenticate(makeTokenService(new Set(["good"])))(
      { headers: { authorization: "Basic abc" } } as Request,
      res,
      next,
    );
    assert.equal(res.statusCode, 401);
    assert.equal(next.mock.callCount(), 0);
  });

  it("rejects an invalid or expired token with 401", () => {
    const res = makeRes();
    const next = mock.fn();
    makeAuthenticate(makeTokenService(new Set(["good"])))(
      { headers: { authorization: "Bearer bad" } } as Request,
      res,
      next,
    );
    assert.equal(res.statusCode, 401);
    assert.equal(next.mock.callCount(), 0);
  });

  it("sets req.userId and calls next for a valid token", () => {
    const req = { headers: { authorization: "Bearer good" } } as Request;
    const res = makeRes();
    const next = mock.fn();
    makeAuthenticate(makeTokenService(new Set(["good"])))(req, res, next);
    assert.equal(req.userId, "u1");
    assert.equal(res.statusCode, 0);
    assert.equal(next.mock.callCount(), 1);
  });
});
