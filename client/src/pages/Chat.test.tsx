import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPage from "./Chat";
import {
  CHAT_CHANNELS,
  CHAT_MESSAGES,
  PROFILE,
} from "@/test/fixtures";
import { useAuth } from "@/context/auth";
import { createChatSocket } from "@/lib/chatSocket";
import type { ChatCallbacks } from "@/lib/chatSocket";
import type {
  ChatMessage,
  UserProfile,
} from "@/lib/api";

vi.mock("@/context/auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    listChannels: vi.fn(),
    listMessages: vi.fn(),
    softDeleteMessage: vi.fn(),
    createChannel: vi.fn(),
  };
});

vi.mock("@/lib/chatSocket", () => ({
  createChatSocket: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

import {
  listChannels,
  listMessages,
  softDeleteMessage,
  createChannel,
} from "@/lib/api";

const apiMock = {
  listChannels: vi.mocked(listChannels),
  listMessages: vi.mocked(listMessages),
  softDeleteMessage: vi.mocked(softDeleteMessage),
  createChannel: vi.mocked(createChannel),
};

interface ClientStub {
  callbacks: ChatCallbacks | null;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  sendMessage: ReturnType<typeof vi.fn>;
  setCallbacks: ReturnType<typeof vi.fn>;
  receiveIncoming: (message: ChatMessage) => void;
  receiveDeleted: (messageId: string) => void;
}

function makeClientStub(): ClientStub {
  const stub: ClientStub = {
    callbacks: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendMessage: vi.fn(),
    setCallbacks: vi.fn(function (this: ClientStub, cb: ChatCallbacks) {
      this.callbacks = cb;
    }),
    receiveIncoming: function (message: ChatMessage) {
      this.callbacks?.onMessage(message);
    },
    receiveDeleted: function (messageId: string) {
      this.callbacks?.onMessageDeleted(messageId);
    },
  };
  return stub;
}

function mockUser(user: UserProfile | null = PROFILE) {
  vi.mocked(useAuth).mockReturnValue({
    user,
  } as never);
}

function renderPage() {
  return render(<ChatPage />);
}

describe("ChatPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser();
    vi.mocked(createChatSocket).mockReturnValue(makeClientStub() as never);
    apiMock.listChannels.mockResolvedValue(CHAT_CHANNELS);
    apiMock.listMessages.mockResolvedValue(CHAT_MESSAGES);
    apiMock.softDeleteMessage.mockResolvedValue(undefined);
    apiMock.createChannel.mockResolvedValue({
      id: "ch-new",
      name: "New Channel",
      description: null,
      createdById: "u1",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("loads channels, selects the first and shows its messages", async () => {
    renderPage();
    expect(await screen.findByText("General")).toBeInTheDocument();
    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(await screen.findByText("Welcome to General")).toBeInTheDocument();
    expect(apiMock.listMessages).toHaveBeenCalledWith("ch-general");
  });

  it("switches channels on select and reloads messages", async () => {
    const user = userEvent.setup();
    apiMock.listMessages.mockResolvedValue([
      {
        id: "m3",
        channelId: "ch-ops",
        authorId: "u2",
        authorName: "Sara",
        authorEmail: "s@v.local",
        body: "ops chit chat",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    renderPage();
    await user.click(await screen.findByText("Operations"));
    expect(apiMock.listMessages).toHaveBeenLastCalledWith("ch-ops");
    expect(await screen.findByText("ops chit chat")).toBeInTheDocument();
  });

  it("sends a message over the socket when connected", async () => {
    const user = userEvent.setup();
    const stub = makeClientStub();
    vi.mocked(createChatSocket).mockReturnValue(stub as never);
    renderPage();
    stub.callbacks?.onStatus("connected");
    const input = await screen.findByLabelText("Message");
    await user.type(input, "hello world");
    await user.keyboard("{Enter}");
    expect(stub.sendMessage).toHaveBeenCalledWith("ch-general", "hello world");
  });

  it("appends incoming messages for the selected channel and ignores others", async () => {
    const stub = makeClientStub();
    vi.mocked(createChatSocket).mockReturnValue(stub as never);
    renderPage();
    await screen.findByText("Welcome to General");
    const incoming: ChatMessage = {
      id: "m9",
      channelId: "ch-general",
      authorId: "u2",
      authorName: "Sara",
      authorEmail: "s@v.local",
      body: "live message",
      createdAt: "2026-01-01T10:00:00.000Z",
    };
    stub.receiveIncoming({ ...incoming, channelId: "ch-ops" });
    expect(screen.queryByText("live message")).not.toBeInTheDocument();
    stub.receiveIncoming(incoming);
    expect(await screen.findByText("live message")).toBeInTheDocument();
    stub.receiveDeleted("m1");
    await waitFor(() =>
      expect(screen.queryByText("Welcome to General")).not.toBeInTheDocument(),
    );
  });

  it("keeps a socket message that arrives while history is loading", async () => {
    const stub = makeClientStub();
    vi.mocked(createChatSocket).mockReturnValue(stub as never);
    let resolveMessages: (value: ChatMessage[]) => void = () => {};
    apiMock.listMessages.mockReturnValue(
      new Promise((resolve) => {
        resolveMessages = resolve;
      }),
    );
    renderPage();
    await waitFor(() =>
      expect(apiMock.listMessages).toHaveBeenCalledWith("ch-general"),
    );
    stub.receiveIncoming({
      id: "m-live",
      channelId: "ch-general",
      authorId: "u2",
      authorName: "Sara",
      authorEmail: "s@v.local",
      body: "live during load",
      createdAt: "2026-01-01T12:00:00.000Z",
    });
    resolveMessages(CHAT_MESSAGES);
    expect(await screen.findByText("Welcome to General")).toBeInTheDocument();
    expect(screen.getByText("live during load")).toBeInTheDocument();
  });

  it("keeps a deletion received while history is loading", async () => {
    const stub = makeClientStub();
    vi.mocked(createChatSocket).mockReturnValue(stub as never);
    let resolveMessages: (value: ChatMessage[]) => void = () => {};
    apiMock.listMessages.mockReturnValue(
      new Promise((resolve) => {
        resolveMessages = resolve;
      }),
    );
    renderPage();
    await waitFor(() =>
      expect(apiMock.listMessages).toHaveBeenCalledWith("ch-general"),
    );
    stub.receiveDeleted("m1");
    resolveMessages(CHAT_MESSAGES);
    expect(await screen.findByText("Hi there")).toBeInTheDocument();
    expect(screen.queryByText("Welcome to General")).not.toBeInTheDocument();
  });

  it("drops a history response that resolves after leaving the channel", async () => {
    const user = userEvent.setup();
    const resolvers: ((value: ChatMessage[]) => void)[] = [];
    apiMock.listMessages.mockImplementation(
      () =>
        new Promise<ChatMessage[]>((resolve) => {
          resolvers.push(resolve);
        }),
    );
    renderPage();
    await waitFor(() => expect(resolvers).toHaveLength(1));
    await user.click(screen.getByRole("button", { name: "Back to channels" }));
    resolvers[0]([
      ...CHAT_MESSAGES,
      {
        id: "m-stale",
        channelId: "ch-general",
        authorId: "u2",
        authorName: "Sara",
        authorEmail: "s@v.local",
        body: "stale after leaving",
        createdAt: "2026-01-01T09:02:00.000Z",
      },
    ]);
    await user.click(await screen.findByText("General"));
    await waitFor(() => expect(resolvers).toHaveLength(2));
    resolvers[1](CHAT_MESSAGES);
    expect(await screen.findByText("Hi there")).toBeInTheDocument();
    expect(screen.queryByText("stale after leaving")).not.toBeInTheDocument();
  });

  it("removes an own message after confirming deletion", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Welcome to General");
    await user.click(
      screen.getByRole("button", { name: /Delete message/ }),
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Delete message" }),
    );
    expect(apiMock.softDeleteMessage).toHaveBeenCalledWith("m1");
    await waitFor(() =>
      expect(screen.queryByText("Welcome to General")).not.toBeInTheDocument(),
    );
  });

  it("keeps the message and toasts when deletion fails", async () => {
    const user = userEvent.setup();
    apiMock.softDeleteMessage.mockRejectedValue(
      new Error("Something went wrong."),
    );
    renderPage();
    await screen.findByText("Welcome to General");
    await user.click(
      screen.getByRole("button", { name: /Delete message/ }),
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Delete message" }),
    );
    expect(apiMock.softDeleteMessage).toHaveBeenCalledWith("m1");
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong.",
    );
    expect(screen.getByText("Welcome to General")).toBeInTheDocument();
  });

  it("announces the connection status and exposes a back button on mobile", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Welcome to General");
    expect(screen.getByRole("status")).toHaveTextContent(/Connecting|Connected/);
    await user.click(screen.getByRole("button", { name: "Back to channels" }));
    expect(screen.getByText("Channel", { selector: "span" })).toBeInTheDocument();
    expect(apiMock.listMessages.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("shows an error state with retry on a failed load", async () => {
    apiMock.listChannels.mockRejectedValue(new Error("Network exploded"));
    renderPage();
    expect(
      await screen.findByText("Network exploded"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("creates a channel from the dialog and selects the new channel", async () => {
    const user = userEvent.setup();
    apiMock.listChannels.mockResolvedValue([
      ...CHAT_CHANNELS,
      {
        id: "ch-new",
        name: "New Channel",
        description: null,
        createdById: "u1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    renderPage();
    await user.click(await screen.findByLabelText("New channel"));
    await user.type(screen.getByLabelText("Channel name"), "New Channel");
    await user.click(screen.getByRole("button", { name: "Create channel" }));
    expect(apiMock.createChannel).toHaveBeenCalledWith({
      name: "New Channel",
      description: null,
    });
    expect(await screen.findAllByText("New Channel")).not.toHaveLength(0);
    expect(apiMock.listMessages).toHaveBeenLastCalledWith("ch-new");
  });
});