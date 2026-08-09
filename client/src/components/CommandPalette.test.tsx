import { useState } from "react";
import { describe, it, expect } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import CommandPalette from "./CommandPalette";
import { renderWithAuth } from "@/test/render";

const DUMMY = {
  userId: "u1",
  email: "admin@velkor.local",
  fullName: "Admin User",
  role: "Admin",
};

function Host({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return <CommandPalette open={open} onOpenChange={setOpen} />;
}

function renderPalette(claims: string[], initialOpen = false) {
  return renderWithAuth(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Host initialOpen={initialOpen} />} />
        <Route path="/documents" element={<div>DOCS</div>} />
      </Routes>
    </MemoryRouter>,
    { user: { ...DUMMY, claims } },
  );
}

describe("CommandPalette", () => {
  it("renders nothing while closed", () => {
    renderPalette(["*"]);
    expect(
      screen.queryByPlaceholderText("Search or jump to…"),
    ).not.toBeInTheDocument();
  });

  it("opens with Ctrl+K", () => {
    renderPalette(["*"]);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(
      screen.getByPlaceholderText("Search or jump to…"),
    ).toBeInTheDocument();
  });

  it("lists nav items filtered by claims", () => {
    renderPalette(["users:manage", "roles:manage"], true);
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.queryByText("All documents")).not.toBeInTheDocument();
  });

  it("filters results by the query", async () => {
    const user = userEvent.setup();
    renderPalette(["*"], true);
    await user.type(
      screen.getByPlaceholderText("Search or jump to…"),
      "all documents",
    );
    expect(screen.getByText("All documents")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    renderPalette(["*"], true);
    await user.type(
      screen.getByPlaceholderText("Search or jump to…"),
      "zzz",
    );
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("navigates with the keyboard", async () => {
    const user = userEvent.setup();
    renderPalette(["*"], true);
    const input = screen.getByPlaceholderText("Search or jump to…");
    await user.type(input, "all documents");
    await user.keyboard("{Enter}");
    expect(await screen.findByText("DOCS")).toBeInTheDocument();
  });

  it("highlights the next item with ArrowDown before Enter", async () => {
    const user = userEvent.setup();
    renderPalette(["*"], true);
    screen.getByPlaceholderText("Search or jump to…").focus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(await screen.findByText("DOCS")).toBeInTheDocument();
  });
});
