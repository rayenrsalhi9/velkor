import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeftIcon, HashIcon, LoadingIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import ChannelList from "@/components/chat/ChannelList";
import MessageThread from "@/components/chat/MessageThread";
import CreateChannelDialog from "@/components/chat/CreateChannelDialog";
import { useAuth } from "@/context/auth";
import { createChatSocket } from "@/lib/chatSocket";
import type { ChatSocketClient, ChatStatus } from "@/lib/chatSocket";
import {
  listChannels,
  listMessages,
  softDeleteMessage,
} from "@/lib/api";
import type { ChatChannel, ChatMessage } from "@/lib/api";

const STATUS_LABEL: Record<ChatStatus, string> = {
  connecting: "Connecting…",
  connected: "Connected",
  disconnected: "Disconnected — reconnecting…",
};

export default function ChatPage() {
  const { user } = useAuth();
  const currentUserId = user?.userId ?? null;

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [status, setStatus] = useState<ChatStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  const socketRef = useRef<ChatSocketClient | null>(null);

  const loadMessages = useCallback(
    async (channelId: string) => {
      setReloading(true);
      try {
        const list = await listMessages(channelId);
        setMessages([...list].reverse());
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load messages.",
        );
      } finally {
        setReloading(false);
      }
    },
    [],
  );

  const loadChannels = useCallback(async () => {
    setLoadingChannels(true);
    try {
      const data = await listChannels();
      setChannels(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load channels.",
      );
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  const selectChannel = useCallback(
    (channelId: string) => {
      setSelectedId(channelId);
      void loadMessages(channelId);
    },
    [loadMessages],
  );

  const showChannelList = useCallback(() => {
    setSelectedId(null);
    setMessages([]);
  }, []);

  const autoSelectedOnce = useRef(false);

  useEffect(() => {
    if (autoSelectedOnce.current) return;
    if (selectedId === null && channels.length > 0 && !loadingChannels) {
      autoSelectedOnce.current = true;
      selectChannel(channels[0].id);
    }
  }, [channels, loadingChannels, selectedId, selectChannel]);

  useEffect(() => {
    const socket = createChatSocket();
    socketRef.current = socket;
    socket.setCallbacks({
      onMessage: (message) => {
        if (message.channelId !== selectedIdRef.current) return;
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message],
        );
      },
      onMessageDeleted: (messageId) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      },
      onStatus: (next) => setStatus(next),
      onError: (message) => toast.error(message),
    });
    socket.connect();
    return () => socket.disconnect();
  }, []);

  const handleCreated = useCallback(
    (channelId: string) => {
      void loadChannels().then(() => {
        selectChannel(channelId);
      });
    },
    [loadChannels, selectChannel],
  );

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await softDeleteMessage(deletingId);
      setMessages((prev) => prev.filter((m) => m.id !== deletingId));
      toast.success("Message deleted");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete message.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const selected = channels.find((c) => c.id === selectedId) ?? null;
  const connected = status === "connected";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat"
        description="Realtime team conversation."
      />

      <div className="v-card flex h-[60dvh] min-h-[360px] overflow-hidden md:h-[calc(100dvh-13rem)]">
        <div
          className={cn(
            "w-full shrink-0 border-line bg-canvas md:block md:w-56 md:border-r",
            selectedId ? "hidden" : "block",
          )}
        >
          {loadingChannels ? (
            <div className="flex h-full items-center justify-center">
              <HugeiconsIcon
                icon={LoadingIcon}
                size={20}
                className="animate-spin text-ink-3"
              />
            </div>
          ) : (
            <ChannelList
              channels={channels}
              selectedId={selectedId}
              onSelect={selectChannel}
              onNew={() => setCreateOpen(true)}
            />
          )}
        </div>

        <div
          className={cn(
            "min-w-0 flex-1 flex-col md:flex",
            selectedId ? "flex" : "hidden",
          )}
        >
          <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-line px-3 md:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={showChannelList}
                aria-label="Back to channels"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink-1 md:hidden"
              >
                <HugeiconsIcon icon={ArrowLeftIcon} size={16} />
              </button>
              <HugeiconsIcon icon={HashIcon} size={15} className="hidden text-ink-3 md:block" />
              <span className="truncate text-[14px] font-semibold text-ink-1">
                {selected?.name ?? "Channel"}
              </span>
            </div>
            <span
              role="status"
              className={cn(
                "flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium",
                connected ? "text-ink-3" : "text-amber-600",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  connected ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
              {STATUS_LABEL[status]}
            </span>
          </div>

          {error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <p role="alert" className="text-[13px] font-medium text-danger">
                {error}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedId) void loadMessages(selectedId);
                  void loadChannels();
                }}
              >
                Try again
              </Button>
            </div>
          ) : (
            <MessageThread
              messages={messages}
              currentUserId={currentUserId}
              connected={connected}
              reloading={reloading}
              channelName={selected?.name ?? ""}
              onDelete={setDeletingId}
              onSend={(body) => {
                if (selectedId) {
                  socketRef.current?.sendMessage(selectedId, body);
                }
              }}
            />
          )}
        </div>
      </div>

      <CreateChannelDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it for everyone in the channel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              Delete message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}