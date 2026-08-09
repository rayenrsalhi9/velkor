import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import AccountMenu from "./AccountMenu";
import { renderWithAuth } from "@/test/render";
import { PROFILE } from "@/test/fixtures";

function renderAccountMenu() {
  const logout = vi.fn();
  renderWithAuth(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<AccountMenu />} />
        <Route path="/login" element={<div>LOGIN</div>} />
        <Route path="/settings/profile" element={<div>PROFILE</div>} />
      </Routes>
    </MemoryRouter>,
    { user: PROFILE, logout },
  );
  return { logout };
}

describe("AccountMenu", () => {
  it("shows the user initials on the trigger", () => {
    renderAccountMenu();
    expect(screen.getByRole("button", { name: "Account" })).toHaveTextContent(
      "AU",
    );
  });

  it("opens the menu and shows the profile", async () => {
    const user = userEvent.setup();
    renderAccountMenu();
    await user.click(screen.getByRole("button", { name: "Account" }));
    expect(
      await screen.findByText(PROFILE.fullName),
    ).toBeInTheDocument();
    expect(screen.getByText(PROFILE.email)).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Profile/ }),
    ).toBeInTheDocument();
  });

  it("logs out and navigates to /login", async () => {
    const user = userEvent.setup();
    const { logout } = renderAccountMenu();
    await user.click(screen.getByRole("button", { name: "Account" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /Log out/ }),
    );
    expect(logout).toHaveBeenCalled();
    expect(await screen.findByText("LOGIN")).toBeInTheDocument();
  });

  it("navigates to the profile from the menu", async () => {
    const user = userEvent.setup();
    renderAccountMenu();
    await user.click(screen.getByRole("button", { name: "Account" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /Profile/ }),
    );
    expect(screen.getByText("PROFILE")).toBeInTheDocument();
  });
});
