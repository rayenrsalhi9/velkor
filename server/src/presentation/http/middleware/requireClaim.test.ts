import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import { makeRequireAnyClaim, makeRequireClaim } from "./requireClaim.js";
import { WILDCARD_CLAIM } from "../../../application/claims/claimsCatalog.js";
import type { Request, Response } from "express";
import type { CurrentUser } from "../../../application/use-cases/GetCurrentUser.js";

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

function makeReq(claims: string[] | undefined): Request {
  return {
    currentUser: claims
      ? ({
          userId: "u1",
          email: "x@y.z",
          fullName: "X",
          role: "x",
          claims,
        } as CurrentUser)
      : undefined,
  } as Request;
}

describe("makeRequireClaim", () => {
  it("allows a user with the required claim", () => {
    const res = makeRes();
    const next = mock.fn();
    makeRequireClaim("documents:upload")(
      makeReq(["documents:upload"]),
      res,
      next,
    );
    assert.equal(res.statusCode, 0);
    assert.equal(next.mock.callCount(), 1);
  });

  it("allows any claim for a wildcard holder", () => {
    const res = makeRes();
    const next = mock.fn();
    makeRequireClaim("roles:manage")(makeReq([WILDCARD_CLAIM]), res, next);
    assert.equal(next.mock.callCount(), 1);
  });

  it("forbids a user without the claim with 403", () => {
    const res = makeRes();
    const next = mock.fn();
    makeRequireClaim("documents:delete")(
      makeReq(["documents:view-list"]),
      res,
      next,
    );
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: "Forbidden" });
    assert.equal(next.mock.callCount(), 0);
  });

  it("forbids when no current user is attached", () => {
    const res = makeRes();
    const next = mock.fn();
    makeRequireClaim("documents:upload")(makeReq(undefined), res, next);
    assert.equal(res.statusCode, 403);
    assert.equal(next.mock.callCount(), 0);
  });
});

describe("makeRequireAnyClaim", () => {
  it("allows a user holding any of the claims", () => {
    const res = makeRes();
    const next = mock.fn();
    makeRequireAnyClaim(["documents:view-list", "documents:view-assigned"])(
      makeReq(["documents:view-assigned"]),
      res,
      next,
    );
    assert.equal(next.mock.callCount(), 1);
  });

  it("allows a wildcard holder", () => {
    const res = makeRes();
    const next = mock.fn();
    makeRequireAnyClaim(["documents:view-list"])(
      makeReq([WILDCARD_CLAIM]),
      res,
      next,
    );
    assert.equal(next.mock.callCount(), 1);
  });

  it("forbids a user holding none of the claims", () => {
    const res = makeRes();
    const next = mock.fn();
    makeRequireAnyClaim(["documents:view-list", "documents:view-assigned"])(
      makeReq(["documents:upload"]),
      res,
      next,
    );
    assert.equal(res.statusCode, 403);
    assert.equal(next.mock.callCount(), 0);
  });
});
