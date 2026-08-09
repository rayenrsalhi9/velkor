import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleFormDrawer from "./RoleFormDrawer";
import { CLAIMS, ROLES, jsonResponse } from "@/test/fixtures";
import type { Role } from "@/lib/api";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

function renderDrawer(over: Record<string, unknown> = {}) {
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  render(
    <RoleFormDrawer
      open
      claims={CLAIMS}
      role={null}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      {...over}
    />,
  );
  return { onOpenChange, onSaved };
}

const usersCheckbox = () => checkboxFor("Manage users");
const rolesCheckbox = () => checkboxFor("Manage roles");

function checkboxFor(labelText: string) {
  const label = screen.getByText(labelText).closest("label");
  if (!label) throw new Error(`No label for ${labelText}`);
  return within(label).getByRole("checkbox");
}

describe("RoleFormDrawer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("requires a role name", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.click(screen.getByRole("button", { name: "Create role" }));
    expect(screen.getByText("Enter a name for the role.")).toBeInTheDocument();
  });

  it("auto-grants dependencies when a claim is selected", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.click(usersCheckbox());
    expect(usersCheckbox()).toBeChecked();
    expect(rolesCheckbox()).toBeChecked();
  });

  it("locks a dependency while its dependent claim is selected", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.click(usersCheckbox());
    expect(rolesCheckbox()).toHaveAttribute("aria-disabled", "true");
    await user.click(rolesCheckbox());
    expect(rolesCheckbox()).toBeChecked();
  });

  it("cascades removal of no-longer-needed dependencies", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.click(usersCheckbox());
    expect(rolesCheckbox()).toBeChecked();
    await user.click(usersCheckbox());
    expect(usersCheckbox()).not.toBeChecked();
    expect(rolesCheckbox()).not.toBeChecked();
  });

  it("hides the claim picker when full access is enabled", async () => {
    const user = userEvent.setup();
    renderDrawer();
    expect(screen.getByText("Administration")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Full access/ }));
    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
  });

  it("submits wildcard claims for full access roles", async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSaved } = renderDrawer();
    const submitCalls: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (url === "/roles") submitCalls.push(JSON.parse(String(init?.body)));
        return jsonResponse(200, ROLES[0]);
      }),
    );
    await user.type(screen.getByLabelText("Role name"), "Super admin");
    await user.click(screen.getByRole("checkbox", { name: /Full access/ }));
    await user.click(screen.getByRole("button", { name: "Create role" }));
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(submitCalls[0]).toMatchObject({
      name: "Super admin",
      claims: ["*"],
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith("Role created", expect.anything());
  });

  it("submits the completed claim set for a partial role", async () => {
    const user = userEvent.setup();
    const { onSaved } = renderDrawer();
    const submitCalls: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (url === "/roles") submitCalls.push(JSON.parse(String(init?.body)));
        return jsonResponse(200, ROLES[0]);
      }),
    );
    await user.type(screen.getByLabelText("Role name"), "Editor");
    await user.click(usersCheckbox());
    await user.click(screen.getByRole("button", { name: "Create role" }));
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(submitCalls[0]).toMatchObject({
      claims: expect.arrayContaining(["users:manage", "roles:manage"]),
    });
  });

  it("pre-fills an existing role including its dependencies", async () => {
    const role: Role = {
      id: "r-x",
      name: "Approver",
      description: null,
      claims: ["users:manage"],
      createdAt: "2026-01-05T00:00:00.000Z",
    };
    renderDrawer({ role });
    expect(screen.getByLabelText("Role name")).toHaveValue("Approver");
    expect(usersCheckbox()).toBeChecked();
    expect(rolesCheckbox()).toBeChecked();
  });

  it("shows the picker for a wildcard role until full access is disabled", async () => {
    renderDrawer({ role: ROLES[0] });
    expect(screen.getByRole("checkbox", { name: /Full access/ })).toBeChecked();
    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
  });
});
