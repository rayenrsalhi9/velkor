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
});
