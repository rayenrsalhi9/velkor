import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClaimPicker from "./ClaimPicker";
import { CLAIMS } from "@/test/fixtures";

function checkboxFor(labelText: string) {
  const label = screen.getByText(labelText).closest("label");
  if (!label) throw new Error(`No label for ${labelText}`);
  return within(label).getByRole("checkbox");
}

function renderPicker(selected: string[] = []) {
  const onToggle = vi.fn();
  render(
    <ClaimPicker
      claims={CLAIMS}
      selected={new Set(selected)}
      onToggle={onToggle}
    />,
  );
  return { onToggle };
}

describe("ClaimPicker", () => {
  it("groups claims by module", () => {
    renderPicker();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Administration")).toBeInTheDocument();
    expect(screen.getByText("Upload documents")).toBeInTheDocument();
  });

  it("shows the dependency note", () => {
    renderPicker();
    expect(
      screen.getByText(/Also grants: Manage roles/),
    ).toBeInTheDocument();
  });

  it("locks and annotates dependencies that are required by a selection", () => {
    renderPicker(["users:manage"]);
    expect(screen.getByText(/Required by: Manage users/)).toBeInTheDocument();
    expect(checkboxFor("Manage roles")).toHaveAttribute("aria-disabled", "true");
    expect(checkboxFor("Manage users")).toBeChecked();
  });

  it("toggles a claim through onToggle", async () => {
    const user = userEvent.setup();
    const { onToggle } = renderPicker();
    await user.click(checkboxFor("Upload documents"));
    expect(onToggle).toHaveBeenCalledWith("documents:upload");
  });
});
