import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RolesTable from "./RolesTable";
import type { Role } from "@/lib/api";
import { CLAIMS } from "@/test/fixtures";

const ADMIN: Role = {
  id: "role-admin",
  name: "Admin",
  description: "Everything",
  claims: ["*"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

const EDITOR: Role = {
  id: "role-editor",
  name: "Editor",
  description: "Manages documents",
  claims: ["documents:view-list", "documents:upload", "users:manage", "roles:manage"],
  createdAt: "2026-01-02T00:00:00.000Z",
};

const MANY: Role = {
  id: "r3",
  name: "Power user",
  description: null,
  claims: ["a", "b", "c", "d", "e", "f"],
  createdAt: "2026-01-04T00:00:00.000Z",
};

function renderRoles(roles: Role[]) {
  return render(
    <RolesTable
      roles={roles}
      claims={CLAIMS}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
}

describe("RolesTable", () => {
  it("shows a full access pill for wildcard roles", () => {
    renderRoles([ADMIN]);
    expect(screen.getByText("Full access")).toBeInTheDocument();
  });

  it("shows claim labels as chips", () => {
    renderRoles([EDITOR]);
    expect(screen.getByText("Upload documents")).toBeInTheDocument();
    expect(screen.getByText("Manage users")).toBeInTheDocument();
    expect(screen.getByText("Manage roles")).toBeInTheDocument();
  });

  it("shows a +N more hint past the chip limit", () => {
    renderRoles([MANY]);
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("shows a no permissions note for empty roles", () => {
    renderRoles([{ ...ADMIN, claims: [] }]);
    expect(screen.getByText("No permissions")).toBeInTheDocument();
  });

  it("calls onEdit with the role", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <RolesTable roles={[ADMIN]} claims={CLAIMS} onEdit={onEdit} onDelete={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: "Edit Admin" }));
    expect(onEdit).toHaveBeenCalledWith(ADMIN);
  });
});
