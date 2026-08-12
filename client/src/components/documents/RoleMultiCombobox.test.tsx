import { describe, it, expect, vi, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleMultiCombobox from "./RoleMultiCombobox";
import { ROLES, jsonResponse } from "@/test/fixtures";

function stubRoles(qToRoles: Record<string, typeof ROLES>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const params = new URL(url, "http://localhost").searchParams;
      const q = params.get("q") ?? "";
      const items = qToRoles[q] ?? [];
      return jsonResponse(200, { items, total: items.length });
    }),
  );
}

function Harness() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <div>
      <span data-testid="value">{value.join(",")}</span>
      <RoleMultiCombobox value={value} onChange={setValue} />
    </div>
  );
}

function PrefilledHarness({ value }: { value: string[] }) {
  return (
    <div>
      <RoleMultiCombobox value={value} onChange={vi.fn()} />
    </div>
  );
}

describe("RoleMultiCombobox", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps selected roles when the query results no longer include them", async () => {
    stubRoles({ "": ROLES, Admin: [ROLES[0]] });
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Select roles");
    await user.click(input);
    await user.click(await screen.findByRole("option", { name: /Editor/ }));
    await user.click(screen.getByRole("option", { name: /Admin/ }));
    expect(screen.getByTestId("value")).toHaveTextContent(
      "role-editor,role-admin",
    );
    await user.clear(input);
    await user.type(input, "Admin");
    await waitFor(() =>
      expect(
        screen.queryByRole("option", { name: /Editor/ }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId("value")).toHaveTextContent(
      "role-editor,role-admin",
    );
    expect(screen.getByText("Editor")).toBeInTheDocument();
  });

  it("deselects a cached role on re-click after a query change", async () => {
    stubRoles({ "": ROLES, Admin: [ROLES[0]] });
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Select roles");
    await user.click(input);
    await user.click(await screen.findByRole("option", { name: /Admin/ }));
    await user.clear(input);
    await user.type(input, "Admin");
    await waitFor(() =>
      expect(screen.getByRole("option", { name: /Admin/ })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    await user.click(screen.getByRole("option", { name: /Admin/ }));
    expect(screen.getByTestId("value")).toHaveTextContent("");
  });

  it("renders prefilled role chips even when the role is not on the first page", async () => {
    const field = {
      id: "role-field",
      name: "Field",
      description: null,
      claims: [],
      createdAt: "2026-01-07T00:00:00.000Z",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const params = new URL(url, "http://localhost").searchParams;
        const q = params.get("q") ?? "";
        const pageSize = Number(params.get("pageSize") ?? "10");
        const all = [...ROLES, field];
        const returned = q ? all.filter((r) => r.name.includes(q)) : all.slice(0, pageSize);
        return jsonResponse(200, { items: returned, total: returned.length });
      }),
    );
    render(<PrefilledHarness value={["role-field"]} />);
    expect(
      await screen.findByRole("button", { name: "Remove Field" }, { timeout: 3000 }),
    ).toBeInTheDocument();
  });
});