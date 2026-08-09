import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import * as api from "./api";
import { PROFILE } from "@/test/fixtures";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type FetchHandler = (
  url: string,
  init?: RequestInit,
) => Response | Promise<Response>;

function mockFetch(handler: FetchHandler) {
  vi.stubGlobal("fetch", vi.fn(handler));
}

function authHeader(init?: RequestInit): string | null {
  const headers = init?.headers as Headers | undefined;
  return headers?.get("Authorization") ?? null;
}

describe("ApiError", () => {
  it("carries status and message", () => {
    const error = new api.ApiError("boom", 403);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("boom");
    expect(error.status).toBe(403);
  });
});

describe("api", () => {
  beforeEach(async () => {
    mockFetch(() => jsonResponse(200, {}));
    await api.logout();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws ApiError with the server error message", async () => {
    mockFetch(() => jsonResponse(403, { error: "Forbidden" }));
    await expect(api.getMe()).rejects.toMatchObject({
      status: 403,
      message: "Forbidden",
    });
  });

  it("sends no bearer token before login", async () => {
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/auth/me") return jsonResponse(200, PROFILE);
      return jsonResponse(404, { error: "not found" });
    });
    vi.stubGlobal("fetch", fetchMock);
    await api.getMe();
    const meCall = fetchMock.mock.calls.find(([url]) => url === "/auth/me");
    expect(authHeader(meCall?.[1])).toBeNull();
  });

  it("stores the token on login and uses it on later requests", async () => {
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/auth/login")
        return jsonResponse(200, { accessToken: "tok123" });
      if (url === "/auth/me") return jsonResponse(200, PROFILE);
      return jsonResponse(404, { error: "not found" });
    });
    vi.stubGlobal("fetch", fetchMock);
    await api.login("admin@velkor.local", "Admin123!");
    await api.getMe();
    const meCall = fetchMock.mock.calls.find(([url]) => url === "/auth/me");
    expect(authHeader(meCall?.[1])).toBe("Bearer tok123");
  });

  it("clears the token on logout", async () => {
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/auth/login")
        return jsonResponse(200, { accessToken: "tok123" });
      if (url === "/auth/me") return jsonResponse(200, PROFILE);
      return jsonResponse(200, {});
    });
    vi.stubGlobal("fetch", fetchMock);
    await api.login("admin@velkor.local", "Admin123!");
    await api.logout();
    await api.getMe();
    const meCalls = fetchMock.mock.calls.filter(([url]) => url === "/auth/me");
    expect(authHeader(meCalls.at(-1)?.[1])).toBeNull();
  });

  it("refreshes once and retries on 401", async () => {
    let meCalls = 0;
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/auth/me") {
        meCalls++;
        return meCalls === 1
          ? jsonResponse(401, { error: "Unauthorized" })
          : jsonResponse(200, PROFILE);
      }
      if (url === "/auth/refresh")
        return jsonResponse(200, { accessToken: "newtok" });
      return jsonResponse(404, { error: "not found" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const me = await api.getMe();
    expect(me.email).toBe(PROFILE.email);
    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/refresh",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("deduplicates concurrent refresh calls", async () => {
    let refreshCalls = 0;
    mockFetch((url) => {
      if (url === "/auth/refresh") {
        refreshCalls++;
        return jsonResponse(200, { accessToken: "t" });
      }
      return jsonResponse(200, {});
    });
    const [a, b] = await Promise.all([api.refresh(), api.refresh()]);
    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(refreshCalls).toBe(1);
  });
});
