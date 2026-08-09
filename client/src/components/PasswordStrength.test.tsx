import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import PasswordStrength from "./PasswordStrength";

describe("PasswordStrength", () => {
  it("marks all requirements as met for a strong password", () => {
    const { container } = render(<PasswordStrength password="StrongP@ss1" />);
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(3);
    items.forEach((item) => expect(item).toHaveClass("text-ink-1"));
  });

  it("flags missing requirements for a weak password", () => {
    const { container } = render(<PasswordStrength password="abc" />);
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(3);
    items.forEach((item) => expect(item).toHaveClass("text-ink-3"));
  });
});
