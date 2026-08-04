export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

async function parseError(res: Response): Promise<never> {
  let message = `Request failed (${res.status})`;
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === "string") message = body.error;
  } catch {
    // keep default message
  }
  throw new ApiError(message, res.status);
}

async function request(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(path, { ...options, headers });
}

async function authFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  let res = await request(path, options);
  if (res.status !== 401 || path === "/auth/login" || path === "/auth/refresh")
    return res;

  if (!(await refresh())) return res;

  res = await request(path, options);
  return res;
}

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) await parseError(res);
  const data = (await res.json()) as { accessToken: string };
  accessToken = data.accessToken;
}

export function refresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch("/auth/refresh", { method: "POST" });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken: string };
      accessToken = data.accessToken;
      return true;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function logout(): Promise<void> {
  try {
    await fetch("/auth/logout", { method: "POST" });
  } finally {
    accessToken = null;
  }
}

export async function getMe(): Promise<UserProfile> {
  const res = await authFetch("/auth/me");
  if (!res.ok) await parseError(res);
  return (await res.json()) as UserProfile;
}
