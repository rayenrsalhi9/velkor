import { describe, it, expect, vi, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryCombobox from "./CategoryCombobox";
import { CATEGORIES, jsonResponse } from "@/test/fixtures";
import type { Category } from "@/lib/api";

function stubCategories(query: (q: string) => Category[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const params = new URL(url, "http://localhost").searchParams;
      const items = query(params.get("q") ?? "");
      return jsonResponse(200, { items, total: items.length });
    }),
  );
}

function Harness() {
  const [value, setValue] = useState("");
  return (
    <div>
      <span data-testid="value">{value}</span>
      <CategoryCombobox value={value} onChange={setValue} />
    </div>
  );
}

describe("CategoryCombobox", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the selection when the query no longer includes it", async () => {
    stubCategories((q) => (q.includes("Reports") ? [] : CATEGORIES));
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Select category");
    await user.type(input, "Policies");
    await user.click(await screen.findByRole("option", { name: /Policies/ }));
    expect(screen.getByTestId("value")).toHaveTextContent("cat-policies");
    await user.clear(input);
    await user.type(input, "Reports");
    await waitFor(() =>
      expect(
        screen.queryByRole("option", { name: /Policies/ }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId("value")).toHaveTextContent("cat-policies");
  });

  it("keeps the selection while its category is still listed", async () => {
    stubCategories(() => CATEGORIES);
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Select category");
    await user.type(input, "Policies");
    await user.click(await screen.findByRole("option", { name: /Policies/ }));
    await user.type(input, "more");
    await waitFor(() =>
      expect(screen.getByTestId("value")).toHaveTextContent("cat-policies"),
    );
  });

  it("shows a prefilled selection via its initial query", () => {
    stubCategories(() => CATEGORIES);
    render(
      <div>
        <CategoryCombobox
          value="cat-policies"
          onChange={vi.fn()}
          initialQuery="Policies"
        />
      </div>,
    );
    expect(screen.getByLabelText("Select category")).toHaveValue("Policies");
  });
});