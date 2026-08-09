import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import RequireClaim from "./RequireClaim";
import { renderWithAuth } from "@/test/render";

function renderRequireClaim(claims: string[], claim: string | string[]) {
  return renderWithAuth(
    <RequireClaim claim={claim}>
      <div>Protected content</div>
    </RequireClaim>,
    { user: { ...PROFILE_DUMMY, claims } },
  );
}

const PROFILE_DUMMY = {
  userId: "u1",
  email: "admin@velkor.local",
  fullName: "Admin User",
  role: "Admin",
};

describe("RequireClaim", () => {
  it("renders children when a single claim is granted", () => {
    renderRequireClaim(["users:manage"], "users:manage");
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("renders children when every claim in the array is granted", () => {
    renderRequireClaim(
      ["users:manage", "roles:manage"],
      ["users:manage", "roles:manage"],
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("denies access when a required claim is missing", () => {
    renderRequireClaim(["users:manage"], ["users:manage", "roles:manage"]);
    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("denies access when the user has no claims", () => {
    renderRequireClaim([], "users:manage");
    expect(screen.getByText("Access denied")).toBeInTheDocument();
  });

  it("grants access on the wildcard claim", () => {
    renderRequireClaim(["*"], ["users:manage", "roles:manage"]);
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
