import { useEffect, useRef, useState, type FormEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Airplane01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage } from "@/lib/api";

interface MessageThreadProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  connected: boolean;
  reloading: boolean;
  channelName?: string;
  onDelete: (messageId: string) => void;
  onSend: (body: string) => void;
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessageBubble({
  message,
  own,
  onDelete,
}: {
  message: ChatMessage;
  own: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      className={own ? "ml-12 self-end" : "mr-12 self-start"}
      data-testid="message-bubble"
    >
      <div
        className={
          own
            ? "rounded-xl rounded-br-sm bg-brand-fill px-3 py-2 text-white"
            : "rounded-xl rounded-bl-sm bg-surface-2 px-3 py-2 text-ink-1"
        }
      >
        {!own && (
          <p className="mb-0.5 text-[11.5px] font-semibold text-brand">
            {message.authorName}
          </p>
        )}
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
          {message.body}
        </p>
      </div>
      <p className="mt-1 text-[11px] text-ink-3">
        {own ? (
          <span className="flex items-center gap-2">
            <time dateTime={message.createdAt}>
              {timeLabel(message.createdAt)}
            </time>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete message sent at ${timeLabel(message.createdAt)}`}
              className="text-ink-3 transition-colors hover:text-danger"
            >
              <HugeiconsIcon icon={Delete02Icon} size={13} />
            </button>
          </span>
        ) : (
          <span>
            <time dateTime={message.createdAt}>
              {timeLabel(message.createdAt)}
            </time>{" "}
            · {message.authorEmail}
          </span>
        )}
      </p>
    </div>
  );
}

export default function MessageThread({
  messages,
  currentUserId,
  connected,
  reloading,
  channelName = "",
  onDelete,
  onSend,
}: MessageThreadProps) {
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastCount = useRef(messages.length);

  useEffect(() => {
    if (messages.length > lastCount.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
    lastCount.current = messages.length;
  }, [messages.length]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    onSend(text);
    setBody("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        role="log"
        aria-label={channelName ? `Messages in ${channelName}` : "Messages"}
        aria-busy={reloading}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4"
      >
        {reloading ? (
          <p className="text-[12.5px] text-ink-3">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-[12.5px] text-ink-3">
            No messages yet. Say hello.
          </p>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              own={message.authorId === currentUserId}
              onDelete={() => onDelete(message.id)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <p id="message-hint" className="sr-only">
        Press Enter to send. Shift+Enter adds a new line.
      </p>
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 border-t border-line p-3"
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (body.trim()) onSubmit(e);
            }
          }}
          placeholder={connected ? "Message…" : "Reconnecting…"}
          rows={1}
          disabled={!connected}
          aria-label="Message"
          aria-describedby="message-hint"
          className="min-h-[38px] max-h-32 flex-1 resize-none"
        />
        <Button
          type="submit"
          disabled={!connected || !body.trim()}
          size="icon"
          aria-label="Send message"
        >
          <HugeiconsIcon icon={Airplane01Icon} size={16} />
        </Button>
      </form>
    </div>
  );
}