import type { Category, ClaimDefinition, Role, User, UserProfile } from "@/lib/api";
import { vi } from "vitest";

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function stubApi(
  handler: (url: string, init?: RequestInit) => Response,
) {
  vi.stubGlobal("fetch", vi.fn(handler));
}

export const CLAIMS: ClaimDefinition[] = [
  {
    key: "documents:view-list",
    label: "View documents list",
    description: "See the list of all documents",
    module: "Documents",
  },
  {
    key: "documents:upload",
    label: "Upload documents",
    description: "Upload new documents",
    module: "Documents",
  },
  {
    key: "users:manage",
    label: "Manage users",
    description: "Create, edit, and delete user accounts",
    module: "Administration",
    dependsOn: ["roles:manage"],
  },
  {
    key: "roles:manage",
    label: "Manage roles",
    description: "Create, edit, and delete roles and their claims",
    module: "Administration",
  },
];

export const ROLES: Role[] = [
  {
    id: "role-admin",
    name: "Admin",
    description: "Full access",
    claims: ["*"],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "role-editor",
    name: "Editor",
    description: "Manages documents",
    claims: ["documents:view-list", "documents:upload"],
    createdAt: "2026-01-02T00:00:00.000Z",
  },
];

export const USERS: User[] = [
  {
    id: "u1",
    email: "admin@velkor.local",
    fullName: "Admin User",
    role: "Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "u2",
    email: "sara.mansour@velkor.local",
    fullName: "Sara Mansour",
    role: "Employee",
    createdAt: "2026-01-03T00:00:00.000Z",
  },
];

export const PROFILE: UserProfile = {
  userId: "u1",
  email: "admin@velkor.local",
  fullName: "Admin User",
  role: "Admin",
  claims: ["*"],
};

export const CATEGORIES: Category[] = [
  {
    id: "cat-policies",
    name: "Policies",
    description: "Internal agency policies",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat-reports",
    name: "Reports",
    description: null,
    createdAt: "2026-01-02T00:00:00.000Z",
  },
];
