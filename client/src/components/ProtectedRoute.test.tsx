import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import ProtectedRoute from "./ProtectedRoute";
import { renderWithAuth } from "@/test/render";
import { PROFILE } from "@/test/fixtures";

function renderProtected(over: Parameters<typeof renderWithAuth>[1]) {
  return renderWithAuth(
    <MemoryRouter initialEntries={["/secret"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<div>Secret content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
    over,
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading state while authenticating", () => {
    renderProtected({ user: PROFILE, loading: true });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to /login", async () => {
    renderProtected({ user: null, loading: false });
    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("renders the outlet for authenticated users", () => {
    renderProtected({ user: PROFILE, loading: false });
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });

  it("does not render children while loading", () => {
    renderProtected({ user: PROFILE, loading: true });
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
  });
});
