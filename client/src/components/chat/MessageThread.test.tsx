import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessageThread from "./MessageThread";
import { CHAT_MESSAGES } from "@/test/fixtures";

function renderThread(over: Record<string, unknown> = {}) {
  const onDelete = vi.fn();
  const onSend = vi.fn();
  render(
    <MessageThread
      messages={CHAT_MESSAGES}
      currentUserId="u1"
      connected
      reloading={false}
      onDelete={onDelete}
      onSend={onSend}
      {...over}
    />,
  );
  return { onDelete, onSend };
}

describe("MessageThread", () => {
  it("renders messages with author, time and email", () => {
    renderThread();
    expect(screen.getByText("Welcome to General")).toBeInTheDocument();
    expect(screen.getByText("Sara Mansour")).toBeInTheDocument();
    expect(
      screen.getByText("sara.mansour@velkor.local", { exact: false }),
    ).toBeInTheDocument();
  });

  it("exposes the message list as a live log region", () => {
    renderThread({ channelName: "General" });
    expect(screen.getByRole("log")).toHaveAccessibleName(
      "Messages in General",
    );
  });

  it("shows a delete button only on own messages and calls onDelete", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderThread();
    const buttons = screen.getAllByRole("button", { name: /Delete message/ });
    expect(buttons).toHaveLength(1);
    await user.click(buttons[0]);
    expect(onDelete).toHaveBeenCalledWith("m1");
  });

  it("sends on Enter and clears the input", async () => {
    const user = userEvent.setup();
    const { onSend } = renderThread();
    const input = screen.getByLabelText("Message");
    await user.type(input, "hey team");
    await user.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledWith("hey team");
    expect(input).toHaveValue("");
  });

  it("does not send an empty message", async () => {
    const user = userEvent.setup();
    const { onSend } = renderThread();
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables the composer while disconnected", () => {
    renderThread({ connected: false });
    expect(screen.getByLabelText("Message")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("shows an empty state", () => {
    renderThread({ messages: [] });
    expect(screen.getByText("No messages yet. Say hello.")).toBeInTheDocument();
  });
});