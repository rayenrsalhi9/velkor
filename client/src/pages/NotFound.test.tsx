import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import NotFound from "./NotFound";

describe("NotFound", () => {
  it("shows the 404 message and a link to the dashboard", () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Go to dashboard/ }),
    ).toHaveAttribute("href", "/");
  });

  it("goes back in history from the back button", async () => {
    const user = userEvent.setup();
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    await user.click(screen.getByRole("button", { name: /Go back/ }));
    expect(back).toHaveBeenCalled();
  });
});
