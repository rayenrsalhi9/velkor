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

function toQuery(params: ListQuery): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(path, { ...options, headers });
}

async function authFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  let res = await request(path, options);
  if (res.status !== 401 || path === "/api/auth/login" || path === "/api/auth/refresh")
    return res;

  if (!(await refresh())) return res;

  res = await request(path, options);
  return res;
}

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch("/api/auth/login", {
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
      const res = await fetch("/api/auth/refresh", { method: "POST" });
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
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    accessToken = null;
  }
}

export async function getMe(): Promise<UserProfile> {
  const res = await authFetch("/api/auth/me");
  if (!res.ok) await parseError(res);
  return (await res.json()) as UserProfile;
}

export interface UpdateProfileInput {
  fullName?: string;
  password?: string;
}

export async function updateMe(input: UpdateProfileInput): Promise<UserProfile> {
  const res = await authFetch("/api/users/me", {
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
  dependsOn?: string[];
}

export interface ListQuery {
  q?: string;
  scope?: "all" | "assigned";
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
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
  const res = await authFetch("/api/claims");
  if (!res.ok) await parseError(res);
  return (await res.json()) as ClaimDefinition[];
}

export async function listRoles(params: ListQuery = {}): Promise<ListResponse<Role>> {
  const res = await authFetch(`/api/roles${toQuery(params)}`);
  if (!res.ok) await parseError(res);
  return (await res.json()) as ListResponse<Role>;
}

export async function createRole(input: RoleInput): Promise<Role> {
  const res = await authFetch("/api/roles", {
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
  const res = await authFetch(`/api/roles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as Role;
}

export async function deleteRole(id: string): Promise<void> {
  const res = await authFetch(`/api/roles/${id}`, { method: "DELETE" });
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

export async function listUsers(params: ListQuery = {}): Promise<ListResponse<User>> {
  const res = await authFetch(`/api/users${toQuery(params)}`);
  if (!res.ok) await parseError(res);
  return (await res.json()) as ListResponse<User>;
}

export async function createUser(input: UserInput): Promise<User> {
  const res = await authFetch("/api/users", {
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
  const res = await authFetch(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as User;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await authFetch(`/api/users/${id}`, { method: "DELETE" });
  if (!res.ok) await parseError(res);
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface CategoryInput {
  name: string;
  description: string | null;
}

export async function listCategories(
  params: ListQuery = {},
): Promise<ListResponse<Category>> {
  const res = await authFetch(`/api/categories${toQuery(params)}`);
  if (!res.ok) await parseError(res);
  return (await res.json()) as ListResponse<Category>;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const res = await authFetch("/api/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as Category;
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>,
): Promise<Category> {
  const res = await authFetch(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await authFetch(`/api/categories/${id}`, { method: "DELETE" });
  if (!res.ok) await parseError(res);
}

export interface VelkorDocument {
  id: string;
  displayName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  categoryId: string;
  categoryName: string;
  uploadedByName: string;
  assignAllRoles: boolean;
  roleIds: string[];
  createdAt: string;
}

export interface UploadDocumentInput {
  file: File;
  displayName?: string;
  categoryId: string;
  roleIds: string[];
  assignAllRoles: boolean;
}

export async function listDocuments(
  params: ListQuery = {},
): Promise<ListResponse<VelkorDocument>> {
  const res = await authFetch(`/api/documents${toQuery(params)}`);
  if (!res.ok) await parseError(res);
  return (await res.json()) as ListResponse<VelkorDocument>;
}

export async function uploadDocument(
  input: UploadDocumentInput,
): Promise<VelkorDocument> {
  const form = new FormData();
  form.append("file", input.file);
  if (input.displayName) form.append("displayName", input.displayName);
  form.append("categoryId", input.categoryId);
  for (const roleId of input.roleIds) form.append("roleIds", roleId);
  form.append("assignAllRoles", String(input.assignAllRoles));
  const res = await authFetch("/api/documents", { method: "POST", body: form });
  if (!res.ok) await parseError(res);
  return (await res.json()) as VelkorDocument;
}

export interface UpdateDocumentInput {
  displayName?: string;
  categoryId?: string;
  roleIds?: string[];
  assignAllRoles?: boolean;
}

export async function updateDocument(
  id: string,
  input: UpdateDocumentInput,
): Promise<VelkorDocument> {
  const res = await authFetch(`/api/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return (await res.json()) as VelkorDocument;
}

export async function softDeleteDocument(id: string): Promise<void> {
  const res = await authFetch(`/api/documents/${id}`, { method: "DELETE" });
  if (!res.ok) await parseError(res);
}

export async function downloadDocumentBlob(id: string): Promise<Blob> {
  const res = await authFetch(`/api/documents/${id}/download`);
  if (!res.ok) await parseError(res);
  return res.blob();
}
