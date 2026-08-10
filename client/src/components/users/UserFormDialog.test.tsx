import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserFormDialog from "./UserFormDialog";
import { ROLES, USERS, jsonResponse } from "@/test/fixtures";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

function renderDialog(over: Record<string, unknown> = {}) {
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  render(
    <UserFormDialog
      open
      user={null}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      {...over}
    />,
  );
  return { onOpenChange, onSaved };
}

async function pickRole(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText("Role"));
  await user.click(await screen.findByRole("option", { name: /Editor/ }));
}

describe("UserFormDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows validation errors one at a time", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Create user" }));
    expect(
      screen.getByText("Enter the user's full name."),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("Full name"), "Jane Doe");
    await user.click(screen.getByRole("button", { name: "Create user" }));
    expect(
      screen.getByText("Enter the user's company email."),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("Email"), "jane@velkor.local");
    await user.click(screen.getByRole("button", { name: "Create user" }));
    expect(screen.getByText("Enter a password.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Password"), "StrongP@ss1");
    await user.type(screen.getByLabelText("Confirm password"), "StrongP@ss1");
    await user.click(screen.getByRole("button", { name: "Create user" }));
    expect(screen.getByText("Select a role for this user.")).toBeInTheDocument();
  });

  it("rejects malformed emails", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.type(screen.getByLabelText("Full name"), "Jane Doe");
    await user.type(screen.getByLabelText("Email"), "nope");
    await user.click(screen.getByRole("button", { name: "Create user" }));
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("creates a user and closes the dialog", async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSaved } = renderDialog();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (String(url).startsWith("/roles"))
          return jsonResponse(200, { items: ROLES, total: 2 });
        return jsonResponse(200, USERS[0]);
      }),
    );
    await user.type(screen.getByLabelText("Full name"), "Jane Doe");
    await user.type(screen.getByLabelText("Email"), "jane@velkor.local");
    await user.type(screen.getByLabelText("Password"), "StrongP@ss1");
    await user.type(screen.getByLabelText("Confirm password"), "StrongP@ss1");
    await pickRole(user);
    await user.click(screen.getByRole("button", { name: "Create user" }));
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith("User created", expect.anything());
  });

  it("shows a 409 email conflict inline", async () => {
    const user = userEvent.setup();
    renderDialog();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (String(url).startsWith("/roles"))
          return jsonResponse(200, { items: ROLES, total: 2 });
        return jsonResponse(409, {
          error: "A user with this email already exists",
        });
      }),
    );
    await user.type(screen.getByLabelText("Full name"), "Jane Doe");
    await user.type(screen.getByLabelText("Email"), "taken@velkor.local");
    await user.type(screen.getByLabelText("Password"), "StrongP@ss1");
    await user.type(screen.getByLabelText("Confirm password"), "StrongP@ss1");
    await pickRole(user);
    await user.click(screen.getByRole("button", { name: "Create user" }));
    expect(
      await screen.findByText("A user with this email already exists"),
    ).toBeInTheDocument();
  });

  it("edits an existing user with the email locked", async () => {
    renderDialog({ user: USERS[0] });
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByText("Email can't be changed.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save changes" }),
    ).toBeInTheDocument();
  });

  it("clears the role when the edit search text stops matching it", async () => {
    const user = userEvent.setup();
    renderDialog({ user: USERS[0] });
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (String(url).startsWith("/roles")) {
          const q = new URL(url, "http://x").searchParams.get("q") ?? "";
          const filtered = ROLES.filter((r) =>
            r.name.toLowerCase().includes(q.toLowerCase()),
          );
          return jsonResponse(200, { items: filtered, total: filtered.length });
        }
        return jsonResponse(404, { error: "nope" });
      }),
    );
    const roleInput = screen.getByLabelText("Role");
    await user.click(screen.getByRole("button", { name: "Open role list" }));
    await user.click(await screen.findByRole("option", { name: /Admin/ }));
    await user.type(roleInput, "zzz");
    expect(await screen.findByText("No matching roles")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(
      await screen.findByText("Select a role for this user."),
    ).toBeInTheDocument();
  });

  it("keeps the selected role when the role search request fails", async () => {
    const user = userEvent.setup();
    renderDialog({ user: USERS[0] });
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (String(url).startsWith("/roles")) {
        if (String(url).includes("q=Adminzzz"))
          return jsonResponse(500, { error: "Server error" });
        return jsonResponse(200, { items: ROLES, total: 2 });
      }
      if (String(url).startsWith("/users/")) return jsonResponse(200, USERS[0]);
      return jsonResponse(404, { error: "nope" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const roleInput = screen.getByLabelText("Role");
    await user.click(screen.getByRole("button", { name: "Open role list" }));
    await user.click(await screen.findByRole("option", { name: /Admin/ }));
    await user.type(roleInput, "zzz");
    expect(await screen.findByText("No matching roles")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).startsWith("/users/") &&
            (init as RequestInit | undefined)?.method === "PATCH",
        ),
      ).toBe(true),
    );
    const patch = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).startsWith("/users/") &&
        (init as RequestInit | undefined)?.method === "PATCH",
    );
    const body = JSON.parse(
      (patch?.[1] as RequestInit | undefined)?.body as string,
    );
    expect(body.roleId).toBe("role-admin");
  });
});
