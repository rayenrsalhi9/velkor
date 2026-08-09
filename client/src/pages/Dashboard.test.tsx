import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import Dashboard from "./Dashboard";
import { renderWithAuth } from "@/test/render";
import { PROFILE } from "@/test/fixtures";

describe("Dashboard", () => {
  it("welcomes the current user", () => {
    renderWithAuth(<Dashboard />, { user: PROFILE });
    expect(
      screen.getByText(`Welcome, ${PROFILE.fullName}`),
    ).toBeInTheDocument();
    expect(screen.getByText(PROFILE.email)).toBeInTheDocument();
  });
});
