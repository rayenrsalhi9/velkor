import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import LoginForm from "./LoginForm";
import { renderWithAuth } from "@/test/render";

function renderForm(over: Parameters<typeof renderWithAuth>[1], from?: object) {
  const entry = from
    ? [{ pathname: "/login", state: { from } }]
    : ["/login"];
  return renderWithAuth(
    <MemoryRouter initialEntries={entry}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/" element={<div>HOME</div>} />
        <Route path="/users" element={<div>USERS</div>} />
      </Routes>
    </MemoryRouter>,
    over,
  );
}

describe("LoginForm", () => {
  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    renderForm({ login: vi.fn() });
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
  });

  it("rejects malformed emails", async () => {
    const user = userEvent.setup();
    renderForm({ login: vi.fn() });
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderForm({ login: vi.fn() });
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("navigates to / after a successful login", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);
    renderForm({ login });
    await user.type(
      screen.getByLabelText("Email"),
      "admin@velkor.local",
    );
    await user.type(screen.getByLabelText("Password"), "Admin123!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("HOME")).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith("admin@velkor.local", "Admin123!");
  });

  it("navigates to the originally requested route", async () => {
    const user = userEvent.setup();
    renderForm(
      { login: vi.fn().mockResolvedValue(undefined) },
      { pathname: "/users" },
    );
    await user.type(
      screen.getByLabelText("Email"),
      "admin@velkor.local",
    );
    await user.type(screen.getByLabelText("Password"), "Admin123!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("USERS")).toBeInTheDocument();
  });

  it("shows an error and stays put when login fails", async () => {
    const user = userEvent.setup();
    renderForm({ login: vi.fn().mockRejectedValue(new Error("Bad credentials")) });
    await user.type(
      screen.getByLabelText("Email"),
      "admin@velkor.local",
    );
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Bad credentials")).toBeInTheDocument();
    expect(screen.queryByText("HOME")).not.toBeInTheDocument();
  });
});
