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
      if (url === "/api/auth/me") return jsonResponse(200, PROFILE);
      return jsonResponse(404, { error: "not found" });
    });
    vi.stubGlobal("fetch", fetchMock);
    await api.getMe();
    const meCall = fetchMock.mock.calls.find(([url]) => url === "/api/auth/me");
    expect(authHeader(meCall?.[1])).toBeNull();
  });

  it("stores the token on login and uses it on later requests", async () => {
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/api/auth/login")
        return jsonResponse(200, { accessToken: "tok123" });
      if (url === "/api/auth/me") return jsonResponse(200, PROFILE);
      return jsonResponse(404, { error: "not found" });
    });
    vi.stubGlobal("fetch", fetchMock);
    await api.login("admin@velkor.local", "Admin123!");
    await api.getMe();
    const meCall = fetchMock.mock.calls.find(([url]) => url === "/api/auth/me");
    expect(authHeader(meCall?.[1])).toBe("Bearer tok123");
  });

  it("clears the token on logout", async () => {
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/api/auth/login")
        return jsonResponse(200, { accessToken: "tok123" });
      if (url === "/api/auth/me") return jsonResponse(200, PROFILE);
      return jsonResponse(200, {});
    });
    vi.stubGlobal("fetch", fetchMock);
    await api.login("admin@velkor.local", "Admin123!");
    await api.logout();
    await api.getMe();
    const meCalls = fetchMock.mock.calls.filter(([url]) => url === "/api/auth/me");
    expect(authHeader(meCalls.at(-1)?.[1])).toBeNull();
  });

  it("refreshes once and retries on 401", async () => {
    let meCalls = 0;
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/api/auth/me") {
        meCalls++;
        return meCalls === 1
          ? jsonResponse(401, { error: "Unauthorized" })
          : jsonResponse(200, PROFILE);
      }
      if (url === "/api/auth/refresh")
        return jsonResponse(200, { accessToken: "newtok" });
      return jsonResponse(404, { error: "not found" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const me = await api.getMe();
    expect(me.email).toBe(PROFILE.email);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/refresh",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("deduplicates concurrent refresh calls", async () => {
    let refreshCalls = 0;
    mockFetch((url) => {
      if (url === "/api/auth/refresh") {
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

  it("calls listPendingSurveys with correct path", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/surveys/pending")
        return jsonResponse(200, { items: [], total: 0 });
      return jsonResponse(404, {});
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await api.listPendingSurveys();
    expect(result.total).toBe(0);
    expect(fetchMock.mock.calls.some(([u]) => u === "/api/surveys/pending")).toBe(true);
  });

  it("calls createSurvey with POST body", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/surveys" && init?.method === "POST")
        return jsonResponse(201, {
          id: "s1", title: "Test", description: null, type: "NORMAL",
          createdByName: "Admin", assignAllRoles: false, roleIds: [],
          closedAt: null, createdAt: "2026-01-01T00:00:00.000Z",
        });
      return jsonResponse(404, {});
    });
    vi.stubGlobal("fetch", fetchMock);
    const survey = await api.createSurvey({
      title: "Test", description: null, type: "NORMAL", roleIds: [],
      assignAllRoles: false,
    });
    expect(survey.id).toBe("s1");
    const postCall = fetchMock.mock.calls.find(
      ([u, i]) => u === "/api/surveys" && i?.method === "POST",
    );
    expect(postCall).toBeDefined();
  });

  it("calls submitSurveyResponse with POST body", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/surveys/s1/respond" && init?.method === "POST")
        return jsonResponse(200, {});
      return jsonResponse(404, {});
    });
    vi.stubGlobal("fetch", fetchMock);
    await api.submitSurveyResponse("s1", "yes");
    const call = fetchMock.mock.calls.find(
      ([u, i]) => u === "/api/surveys/s1/respond" && i?.method === "POST",
    );
    expect(call).toBeDefined();
  });

  it("calls closeSurvey with PATCH", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/surveys/s1/close" && init?.method === "PATCH")
        return jsonResponse(200, {});
      return jsonResponse(404, {});
    });
    vi.stubGlobal("fetch", fetchMock);
    await api.closeSurvey("s1");
    const call = fetchMock.mock.calls.find(
      ([u, i]) => u === "/api/surveys/s1/close" && i?.method === "PATCH",
    );
    expect(call).toBeDefined();
  });

  it("calls deleteSurvey with DELETE", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/surveys/s1" && init?.method === "DELETE")
        return jsonResponse(200, {});
      return jsonResponse(404, {});
    });
    vi.stubGlobal("fetch", fetchMock);
    await api.deleteSurvey("s1");
    const call = fetchMock.mock.calls.find(
      ([u, i]) => u === "/api/surveys/s1" && i?.method === "DELETE",
    );
    expect(call).toBeDefined();
  });

  it("rejects createSurvey on error", async () => {
    mockFetch(() => jsonResponse(400, { error: "Bad request" }));
    await expect(
      api.createSurvey({
        title: "T", description: null, type: "NORMAL",
        roleIds: [], assignAllRoles: false,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects submitSurveyResponse on error", async () => {
    mockFetch(() => jsonResponse(409, { error: "Already answered" }));
    await expect(api.submitSurveyResponse("s1", "yes")).rejects.toMatchObject({
      status: 409,
    });
  });

  it("rejects closeSurvey on error", async () => {
    mockFetch(() => jsonResponse(404, { error: "Not found" }));
    await expect(api.closeSurvey("s1")).rejects.toMatchObject({ status: 404 });
  });

  it("rejects deleteSurvey on error", async () => {
    mockFetch(() => jsonResponse(500, { error: "Server error" }));
    await expect(api.deleteSurvey("s1")).rejects.toMatchObject({
      status: 500,
    });
  });

  it("rejects listPendingSurveys on error", async () => {
    mockFetch(() => jsonResponse(403, { error: "Forbidden" }));
    await expect(api.listPendingSurveys()).rejects.toMatchObject({
      status: 403,
    });
  });

  it("rejects getSurveyAnalytics on error", async () => {
    mockFetch(() => jsonResponse(404, { error: "Not found" }));
    await expect(api.getSurveyAnalytics("s1")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("uploads a document as multipart without an application/json header", async () => {
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (url === "/api/documents")
        return jsonResponse(201, {
          id: "d1",
          displayName: "report",
          fileName: "report.pdf",
          mimeType: "application/pdf",
          sizeBytes: 10,
          categoryId: "c1",
          categoryName: "Policies",
          uploadedByName: "Admin User",
          assignAllRoles: false,
          roleIds: ["r1"],
          createdAt: "2026-01-05T00:00:00.000Z",
        });
      return jsonResponse(404, { error: "not found" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["abc"], "report.pdf", { type: "application/pdf" });
    const doc = await api.uploadDocument({
      file,
      categoryId: "c1",
      roleIds: ["r1"],
      assignAllRoles: false,
    });
    expect(doc.displayName).toBe("report");
    const uploadCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/documents",
    );
    const headers = uploadCall?.[1]?.headers as Headers | undefined;
    expect(headers?.get("Content-Type")).toBeNull();
    const body = uploadCall?.[1]?.body as FormData;
    expect(body.get("categoryId")).toBe("c1");
    expect(body.get("roleIds")).toBe("r1");
    expect(body.get("assignAllRoles")).toBe("false");
    expect(body.get("file")).toBeInstanceOf(File);
  });
});
