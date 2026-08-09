import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PlaceholderPage from "./Placeholder";

describe("PlaceholderPage", () => {
  it("shows the coming soon note for the given title", () => {
    render(<PlaceholderPage title="Chat" />);
    expect(screen.getByText("Chat: coming soon")).toBeInTheDocument();
  });
});
