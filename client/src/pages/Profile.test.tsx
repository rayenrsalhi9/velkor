import { describe, it, expect, afterEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import ProfilePage from "./Profile";
import { renderWithAuth } from "@/test/render";
import { PROFILE, jsonResponse, stubApi } from "@/test/fixtures";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

function renderProfile() {
  const setUser = vi.fn();
  const logout = vi.fn();
  renderWithAuth(
    <MemoryRouter initialEntries={["/settings/profile"]}>
      <Routes>
        <Route path="/settings/profile" element={<ProfilePage />} />
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
    { user: PROFILE, setUser, logout },
  );
  return { setUser, logout };
}

describe("ProfilePage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("disables the name save button until the name changes", async () => {
    const user = userEvent.setup();
    renderProfile();
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText("Full name"), "X");
    expect(save).toBeEnabled();
  });

  it("rejects an empty name", async () => {
    const user = userEvent.setup();
    renderProfile();
    const name = screen.getByLabelText("Full name");
    await user.clear(name);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Enter your full name.")).toBeInTheDocument();
  });

  it("saves the name and updates the profile", async () => {
    const user = userEvent.setup();
    const { setUser } = renderProfile();
    stubApi((url) => {
      if (url === "/api/users/me") return jsonResponse(200, PROFILE);
      return jsonResponse(200, {});
    });
    const name = screen.getByLabelText("Full name");
    await user.clear(name);
    await user.type(name, "New Name");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await vi.waitFor(() => expect(setUser).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Profile updated");
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderProfile();
    const password = screen.getByLabelText("New password");
    expect(password).toHaveAttribute("type", "password");
    await user.click(
      screen.getAllByRole("button", { name: "Show password" })[0],
    );
    expect(password).toHaveAttribute("type", "text");
  });

  it("changes the password, signs out, and navigates to /login", async () => {
    const user = userEvent.setup();
    const { logout } = renderProfile();
    stubApi((url) => {
      if (url === "/api/users/me") return jsonResponse(200, PROFILE);
      return jsonResponse(200, {});
    });
    await user.type(screen.getByLabelText("New password"), "StrongP@ss1");
    await user.type(screen.getByLabelText("Confirm password"), "StrongP@ss1");
    await user.click(
      screen.getByRole("button", { name: "Update password" }),
    );
    expect(await screen.findByText("LOGIN")).toBeInTheDocument();
    expect(logout).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Password changed", expect.anything());
  });
});
