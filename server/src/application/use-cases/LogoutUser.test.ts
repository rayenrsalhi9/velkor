import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LogoutUser } from "./LogoutUser.js";
import type { RefreshTokenRepository } from "../ports/RefreshTokenRepository.js";
import type { TokenHasher } from "../ports/TokenHasher.js";

interface Harness {
  logoutUser: LogoutUser;
  revokeCalls: string[];
  findCalls: string[];
}

function makeHarness(tokenRecordExists: boolean): Harness {
  const revokeCalls: string[] = [];
  const findCalls: string[] = [];

  const refreshTokenRepository: RefreshTokenRepository = {
    async findByTokenHash(tokenHash) {
      findCalls.push(tokenHash);
      return tokenRecordExists
        ? {
            id: "rt1",
            tokenHash,
            userId: "u1",
            expiresAt: new Date(),
            revokedAt: null,
            replacedByTokenId: null,
            createdAt: new Date(),
          }
        : null;
    },
    async create() {
      throw new Error("not used in LogoutUser");
    },
    async revoke(id) {
      revokeCalls.push(id);
    },
    async revokeIfActive() {
      return true;
    },
    async revokeAllForUser() {},
  };
  const tokenHasher: TokenHasher = {
    hash(token) {
      return "hash:" + token;
    },
  };

  return {
    logoutUser: new LogoutUser(refreshTokenRepository, tokenHasher),
    revokeCalls,
    findCalls,
  };
}

describe("LogoutUser", () => {
  it("is a no-op without a token (no repository lookup)", async () => {
    const h = makeHarness(true);
    await h.logoutUser.execute("");
    assert.equal(h.findCalls.length, 0);
    assert.equal(h.revokeCalls.length, 0);
  });

  it("revokes the stored token for a known token", async () => {
    const h = makeHarness(true);
    await h.logoutUser.execute("raw");
    assert.deepEqual(h.findCalls, ["hash:raw"]);
    assert.deepEqual(h.revokeCalls, ["rt1"]);
  });

  it("does nothing for an unknown token", async () => {
    const h = makeHarness(false);
    await h.logoutUser.execute("raw");
    assert.equal(h.revokeCalls.length, 0);
  });
});
