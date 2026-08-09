import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PasswordStrength from "./PasswordStrength";

describe("PasswordStrength", () => {
  it("marks all requirements as met for a strong password", () => {
    render(<PasswordStrength password="StrongP@ss1" />);
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("Contains a number")).toBeInTheDocument();
    expect(screen.getByText("Contains a special character")).toBeInTheDocument();
  });

  it("flags missing requirements for a weak password", () => {
    const { container } = render(<PasswordStrength password="abc" />);
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveClass("text-ink-3");
    expect(items[2]).toHaveClass("text-ink-3");
  });
});
