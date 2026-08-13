import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RefreshToken } from "./RefreshToken.js";
import { InvalidRefreshTokenError } from "../errors/InvalidRefreshTokenError.js";
import type {
  RefreshTokenRecord,
  RefreshTokenRepository,
} from "../ports/RefreshTokenRepository.js";
import type { TokenService } from "../ports/TokenService.js";
import type { TokenHasher } from "../ports/TokenHasher.js";

function makeRecord(overrides?: Partial<RefreshTokenRecord>): RefreshTokenRecord {
  return {
    id: "rt1",
    tokenHash: "hash:raw",
    userId: "u1",
    expiresAt: new Date("2030-01-01T00:00:00Z"),
    revokedAt: null,
    replacedByTokenId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

interface Harness {
  refreshToken: RefreshToken;
  revokeAllForUser: string[];
  revokeIfActive: { id: string; replacedByTokenId: string }[];
}

function makeHarness(overrides?: {
  record?: RefreshTokenRecord | null;
  revokeIfActiveResult?: boolean;
  secondLookupRecord?: RefreshTokenRecord | null;
}): Harness {
  const revokeAllForUser: string[] = [];
  const revokeIfActiveCalls: Harness["revokeIfActive"] = [];

  let lookups = 0;
  const refreshTokenRepository: RefreshTokenRepository = {
    async findByTokenHash() {
      lookups += 1;
      if (lookups > 1) {
        return overrides?.secondLookupRecord !== undefined
          ? overrides.secondLookupRecord
          : overrides?.record === undefined
            ? makeRecord()
            : overrides.record;
      }
      return overrides?.record === undefined ? makeRecord() : overrides.record;
    },
    async create(_tokenHash, userId, expiresAt) {
      return makeRecord({ id: "rt2", userId, expiresAt });
    },
    async revoke() {},
    async revokeIfActive(id, replacedByTokenId) {
      revokeIfActiveCalls.push({ id, replacedByTokenId });
      return overrides?.revokeIfActiveResult ?? true;
    },
    async revokeAllForUser(userId) {
      revokeAllForUser.push(userId);
    },
  };
  const tokenService: TokenService = {
    generateAccessToken(userId) {
      return "access:" + userId;
    },
    generateRefreshToken(userId) {
      return "refresh:" + userId;
    },
    getRefreshTokenExpiresAt() {
      return new Date("2031-01-01T00:00:00Z");
    },
    verifyToken() {
      return null;
    },
  };
  const tokenHasher: TokenHasher = {
    hash(token) {
      return "hash:" + token;
    },
  };

  return {
    refreshToken: new RefreshToken(refreshTokenRepository, tokenService, tokenHasher),
    revokeAllForUser,
    revokeIfActive: revokeIfActiveCalls,
  };
}

describe("RefreshToken", () => {
  it("rotates an active token: issues a new pair and revokes the old one", async () => {
    const h = makeHarness();
    const result = await h.refreshToken.execute("raw");

    assert.equal(result.accessToken, "access:u1");
    assert.equal(result.refreshToken, "refresh:u1");
    assert.equal(result.refreshTokenExpiresAt.toISOString(), "2031-01-01T00:00:00.000Z");
    assert.deepEqual(h.revokeIfActive, [{ id: "rt1", replacedByTokenId: "rt2" }]);
    assert.equal(h.revokeAllForUser.length, 0);
  });

  it("rejects an unknown token", async () => {
    const h = makeHarness({ record: null });
    await assert.rejects(h.refreshToken.execute("raw"), InvalidRefreshTokenError);
    assert.equal(h.revokeAllForUser.length, 0);
  });

  it("detects reuse of a revoked token and revokes the whole family", async () => {
    const h = makeHarness({ record: makeRecord({ revokedAt: new Date() }) });
    await assert.rejects(h.refreshToken.execute("raw"), InvalidRefreshTokenError);
    assert.deepEqual(h.revokeAllForUser, ["u1"]);
  });

  it("rejects an expired token", async () => {
    const h = makeHarness({ record: makeRecord({ expiresAt: new Date("2020-01-01T00:00:00Z") }) });
    await assert.rejects(h.refreshToken.execute("raw"), InvalidRefreshTokenError);
    assert.equal(h.revokeAllForUser.length, 0);
  });

  it("handles a concurrent reuse race: revokes the family when revokeIfActive loses", async () => {
    const h = makeHarness({ revokeIfActiveResult: false });
    await assert.rejects(h.refreshToken.execute("raw"), InvalidRefreshTokenError);
    assert.deepEqual(h.revokeAllForUser, ["u1"]);
  });

  it("keeps the winning session when a parallel refresh races within the grace window", async () => {
    const h = makeHarness({
      revokeIfActiveResult: false,
      secondLookupRecord: makeRecord({ revokedAt: new Date() }),
    });
    await assert.rejects(h.refreshToken.execute("raw"), InvalidRefreshTokenError);
    assert.deepEqual(h.revokeAllForUser, []);
  });
});
