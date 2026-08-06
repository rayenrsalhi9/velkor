import { describe, it } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { setTimeout as sleep } from "node:timers/promises";
import { JwtTokenService } from "./JwtTokenService.js";

function makeService(overrides?: {
  accessSecret?: string;
  refreshSecret?: string;
  accessExpiry?: string;
  refreshExpiry?: string;
}): JwtTokenService {
  process.env.JWT_ACCESS_SECRET = overrides?.accessSecret ?? "access-secret";
  process.env.JWT_REFRESH_SECRET = overrides?.refreshSecret ?? "refresh-secret";
  process.env.JWT_ACCESS_EXPIRY = overrides?.accessExpiry ?? "15m";
  process.env.JWT_REFRESH_EXPIRY = overrides?.refreshExpiry ?? "7d";
  return new JwtTokenService();
}

describe("JwtTokenService constructor", () => {
  it("requires each secret to be set independently", () => {
    process.env.JWT_REFRESH_SECRET = "refresh-secret";
    delete process.env.JWT_ACCESS_SECRET;
    assert.throws(() => new JwtTokenService(), /JWT_ACCESS_SECRET must be set/);

    process.env.JWT_ACCESS_SECRET = "access-secret";
    delete process.env.JWT_REFRESH_SECRET;
    assert.throws(() => new JwtTokenService(), /JWT_REFRESH_SECRET must be set/);
  });

  it("rejects identical access and refresh secrets", () => {
    assert.throws(
      () => makeService({ accessSecret: "same", refreshSecret: "same" }),
      /must be different/,
    );
  });

  it("rejects a malformed expiry", () => {
    assert.throws(
      () => makeService({ accessExpiry: "soon" }),
      /not a valid duration/,
    );
  });

  it("rejects a zero expiry", () => {
    assert.throws(
      () => makeService({ refreshExpiry: "0d" }),
      /must not be zero/,
    );
  });

  it("falls back to defaults when expiries are unset", () => {
    process.env.JWT_ACCESS_SECRET = "access-secret";
    process.env.JWT_REFRESH_SECRET = "refresh-secret";
    delete process.env.JWT_ACCESS_EXPIRY;
    delete process.env.JWT_REFRESH_EXPIRY;
    const service = new JwtTokenService();

    const access = jwt.decode(service.generateAccessToken("u1")) as {
      iat?: number;
      exp?: number;
    };
    const refresh = jwt.decode(service.generateRefreshToken("u1")) as {
      iat?: number;
      exp?: number;
    };
    assert.equal(access.exp! - access.iat!, 15 * 60);
    assert.equal(refresh.exp! - refresh.iat!, 7 * 24 * 60 * 60);
  });
});

describe("JwtTokenService token generation", () => {
  it("signs an access token with the userId for the access secret only", () => {
    const service = makeService();
    const token = service.generateAccessToken("u1");

    const payload = jwt.decode(token) as { userId?: unknown; exp?: unknown };
    assert.equal(payload.userId, "u1");
    assert.ok(typeof payload.exp === "number");
    assert.deepEqual(service.verifyToken(token, "access"), { userId: "u1" });
    assert.equal(service.verifyToken(token, "refresh"), null);
  });

  it("signs a refresh token with a unique jti for the refresh secret only", () => {
    const service = makeService();
    const a = service.generateRefreshToken("u1");
    const b = service.generateRefreshToken("u1");

    const payloadA = jwt.decode(a) as { userId?: unknown; jti?: unknown };
    const payloadB = jwt.decode(b) as { userId?: unknown; jti?: unknown };
    assert.equal(payloadA.userId, "u1");
    assert.ok(typeof payloadA.jti === "string" && payloadA.jti.length > 0);
    assert.notEqual(payloadB.jti, payloadA.jti);
    assert.deepEqual(service.verifyToken(a, "refresh"), { userId: "u1" });
    assert.equal(service.verifyToken(a, "access"), null);
  });

  it("reports the refresh expiry as roughly now plus the configured duration", () => {
    const service = makeService({ refreshExpiry: "2h" });
    const now = Date.now();
    const expiresAt = service.getRefreshTokenExpiresAt().getTime();
    assert.ok(expiresAt > now + 2 * 60 * 60 * 1000 - 1000);
    assert.ok(expiresAt < now + 2 * 60 * 60 * 1000 + 1000);
  });
});

describe("JwtTokenService.verifyToken", () => {
  it("rejects a token whose signature was tampered with", () => {
    const service = makeService();
    const token = service.generateAccessToken("u1");
    const tampered =
      token.slice(0, 20) + (token[20] === "a" ? "b" : "a") + token.slice(21);
    assert.equal(service.verifyToken(tampered, "access"), null);
  });

  it("rejects an expired token", async () => {
    const service = makeService({ accessExpiry: "1s" });
    const token = service.generateAccessToken("u1");
    await sleep(1100);
    assert.equal(service.verifyToken(token, "access"), null);
  });

  it("rejects a token whose userId is not a non-empty string", () => {
    const service = makeService();
    const bad = jwt.sign({ userId: 123 }, "access-secret");
    assert.equal(service.verifyToken(bad, "access"), null);
  });

  it("rejects garbage and empty strings", () => {
    const service = makeService();
    assert.equal(service.verifyToken("not-a-jwt", "access"), null);
    assert.equal(service.verifyToken("", "refresh"), null);
  });
});
