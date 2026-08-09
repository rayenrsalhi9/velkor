import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import LoginRoute from "./LoginRoute";
import { renderWithAuth } from "@/test/render";
import { PROFILE } from "@/test/fixtures";

function renderLogin(over: Parameters<typeof renderWithAuth>[1], from?: object) {
  const entry = from
    ? [{ pathname: "/login", state: { from } }]
    : ["/login"];
  return renderWithAuth(
    <MemoryRouter initialEntries={entry}>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/" element={<div>HOME</div>} />
        <Route path="/users" element={<div>USERS</div>} />
      </Routes>
    </MemoryRouter>,
    over,
  );
}

describe("LoginRoute", () => {
  it("renders nothing while loading", () => {
    const { container } = renderLogin({ user: PROFILE, loading: true });
    expect(container.firstChild).toBeNull();
  });

  it("redirects authenticated users to the default route", async () => {
    renderLogin({ user: PROFILE, loading: false });
    expect(await screen.findByText("HOME")).toBeInTheDocument();
  });

  it("redirects to the originally requested route", async () => {
    renderLogin(
      { user: PROFILE, loading: false },
      { pathname: "/users" },
    );
    expect(await screen.findByText("USERS")).toBeInTheDocument();
  });

  it("renders the login page for guests", () => {
    renderLogin({ user: null, loading: false });
    expect(screen.getByText(/Sign in to your Velkor workspace/)).toBeInTheDocument();
  });
});
