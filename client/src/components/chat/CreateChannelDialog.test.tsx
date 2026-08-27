import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateChannelDialog from "./CreateChannelDialog";
import { createChannel } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  createChannel: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

const mockedCreateChannel = vi.mocked(createChannel);

describe("CreateChannelDialog", () => {
  beforeEach(() => {
    mockedCreateChannel.mockReset();
  });

  function renderDialog(over: Record<string, unknown> = {}) {
    const onCreated = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CreateChannelDialog
        open
        onOpenChange={onOpenChange}
        onCreated={onCreated}
        {...over}
      />,
    );
    return { onCreated, onOpenChange };
  }

  it("creates a channel and calls onCreated", async () => {
    const user = userEvent.setup();
    const { onCreated } = renderDialog();
    mockedCreateChannel.mockResolvedValue({
      id: "ch-new",
      name: "Ops",
      description: null,
      createdById: "u1",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    await user.type(screen.getByLabelText("Channel name"), "Ops");
    await user.type(screen.getByLabelText("Description"), "Ops talk");
    await user.click(screen.getByRole("button", { name: "Create channel" }));
    expect(mockedCreateChannel).toHaveBeenCalledWith({
      name: "Ops",
      description: "Ops talk",
    });
    expect(onCreated).toHaveBeenCalledWith("ch-new");
  });

  it("requires a channel name", async () => {
    const user = userEvent.setup();
    const { onCreated } = renderDialog();
    await user.click(screen.getByRole("button", { name: "Create channel" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a channel name.");
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("shows a name conflict inline", async () => {
    const user = userEvent.setup();
    renderDialog();
    mockedCreateChannel.mockRejectedValue(
      new (class extends Error {
        status = 409;
      })("A channel named that already exists"),
    );
    await user.type(screen.getByLabelText("Channel name"), "Ops");
    await user.click(screen.getByRole("button", { name: "Create channel" }));
    expect(
      await screen.findByText("A channel named that already exists"),
    ).toBeInTheDocument();
  });
});