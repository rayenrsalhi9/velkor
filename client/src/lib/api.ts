export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  claims: string[];
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

export interface UpdateProfileInput {
  fullName?: string;
  password?: string;
}

export async function updateMe(input: UpdateProfileInput): Promise<UserProfile> {
  const res = await authFetch("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as UserProfile;
}

export interface ClaimDefinition {
  key: string;
  label: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  claims: string[];
  createdAt: string;
}

export interface RoleInput {
  name: string;
  description: string | null;
  claims: string[];
}

export async function listClaims(): Promise<ClaimDefinition[]> {
  const res = await authFetch("/claims");
  if (!res.ok) await parseError(res);
  return (await res.json()) as ClaimDefinition[];
}

export async function listRoles(): Promise<Role[]> {
  const res = await authFetch("/roles");
  if (!res.ok) await parseError(res);
  return (await res.json()) as Role[];
}

export async function createRole(input: RoleInput): Promise<Role> {
  const res = await authFetch("/roles", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as Role;
}

export async function updateRole(
  id: string,
  input: Partial<RoleInput>,
): Promise<Role> {
  const res = await authFetch(`/roles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as Role;
}

export async function deleteRole(id: string): Promise<void> {
  const res = await authFetch(`/roles/${id}`, { method: "DELETE" });
  if (!res.ok) await parseError(res);
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface UserInput {
  fullName: string;
  email?: string;
  password?: string;
  roleId?: string;
}

export async function listUsers(): Promise<User[]> {
  const res = await authFetch("/users");
  if (!res.ok) await parseError(res);
  return (await res.json()) as User[];
}

export async function createUser(input: UserInput): Promise<User> {
  const res = await authFetch("/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as User;
}

export async function updateUser(
  id: string,
  input: UserInput,
): Promise<User> {
  const res = await authFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as User;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await authFetch(`/users/${id}`, { method: "DELETE" });
  if (!res.ok) await parseError(res);
}
