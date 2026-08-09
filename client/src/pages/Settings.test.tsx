import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import SettingsPage from "./Settings";

describe("SettingsPage", () => {
  it("shows section navigation and the routed content", () => {
    render(
      <MemoryRouter initialEntries={["/settings/profile"]}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />}>
            <Route path="profile" element={<div>PROFILE PANEL</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Settings sections" });
    expect(nav).toHaveTextContent("Profile");
    expect(nav).toHaveTextContent("Appearance");
    expect(nav).toHaveTextContent("Notifications");
    expect(screen.getByText("PROFILE PANEL")).toBeInTheDocument();
  });
});
