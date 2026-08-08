import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LoginUser } from "./LoginUser.js";
import { User } from "../../domain/entities/User.js";
import { InvalidCredentialsError } from "../errors/InvalidCredentialsError.js";
import type { UserRepository } from "../ports/UserRepository.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { TokenService } from "../ports/TokenService.js";
import type { RefreshTokenRepository } from "../ports/RefreshTokenRepository.js";
import type { TokenHasher } from "../ports/TokenHasher.js";

const USER = new User(
  "u1",
  "user@velkor.local",
  "Test User",
  "hashed-pass",
  "admin",
  new Date("2026-01-01T00:00:00Z"),
);

interface Harness {
  loginUser: LoginUser;
  createCalls: { tokenHash: string; userId: string; expiresAt: Date }[];
  hashCalls: string[];
}

function makeHarness(overrides?: {
  user?: User | null;
  passwordMatches?: boolean;
}): Harness {
  const createCalls: Harness["createCalls"] = [];
  const hashCalls: string[] = [];

  const userRepository: UserRepository = {
    async findByEmail(email) {
      return overrides?.user === undefined ? USER : overrides.user;
    },
    async findById() {
      return null;
    },
  };
  const passwordHasher: PasswordHasher = {
    async hash(password) {
      hashCalls.push(password);
      return "hashed:" + password;
    },
    async compare() {
      return overrides?.passwordMatches ?? true;
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
      return new Date("2030-01-01T00:00:00Z");
    },
    verifyToken() {
      return null;
    },
  };
  const refreshTokenRepository: RefreshTokenRepository = {
    async create(tokenHash, userId, expiresAt) {
      createCalls.push({ tokenHash, userId, expiresAt });
      return {
        id: "rt1",
        tokenHash,
        userId,
        expiresAt,
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
      };
    },
    async findByTokenHash() {
      return null;
    },
    async revoke() {},
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
    loginUser: new LoginUser(
      userRepository,
      passwordHasher,
      tokenService,
      refreshTokenRepository,
      tokenHasher,
    ),
    createCalls,
    hashCalls,
  };
}

describe("LoginUser", () => {
  it("issues an access token and stores a hashed refresh token on valid credentials", async () => {
    const h = makeHarness();
    const result = await h.loginUser.execute(USER.email, "secret");

    assert.equal(result.accessToken, "access:u1");
    assert.equal(result.refreshToken, "refresh:u1");
    assert.equal(
      result.refreshTokenExpiresAt.toISOString(),
      "2030-01-01T00:00:00.000Z",
    );
    assert.equal(h.createCalls.length, 1);
    assert.equal(h.createCalls[0]!.tokenHash, "hash:refresh:u1");
    assert.equal(h.createCalls[0]!.userId, "u1");
  });

  it("rejects a wrong password and never stores a token", async () => {
    const h = makeHarness({ passwordMatches: false });
    await assert.rejects(
      h.loginUser.execute(USER.email, "wrong"),
      InvalidCredentialsError,
    );
    assert.equal(h.createCalls.length, 0);
  });

  it("rejects an unknown email but still runs a hash (timing-attack mitigation)", async () => {
    const h = makeHarness({ user: null });
    await assert.rejects(
      h.loginUser.execute("nobody@velkor.local", "whatever"),
      InvalidCredentialsError,
    );
    assert.equal(h.hashCalls.length, 1);
    assert.equal(h.createCalls.length, 0);
  });
});
