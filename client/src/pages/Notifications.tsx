import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/cn";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Notifications() {
  const { items, unread, read, readAll } = useNotifications();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReadAll() {
    setBusy(true);
    setError(null);
    try {
      await readAll();
    } catch {
      setError("Failed to mark all as read. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleMarkRead(id: string) {
    setError(null);
    void read([id]).catch(() => {
      setError("Failed to mark notification as read.");
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 lg:px-6">
      <PageHeader
        title="Notifications"
        description={
          unread > 0
            ? `${unread} unread notification${unread === 1 ? "" : "s"}`
            : undefined
        }
        actions={
          unread > 0 ? (
            <button
              type="button"
              onClick={() => void handleReadAll()}
              disabled={busy}
              className="rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark all as read
            </button>
          ) : undefined
        }
      />

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-line text-ink-3">
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  if (!n.readAt) handleMarkRead(n.id);
                }}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors duration-150",
                  n.readAt ? "border-line bg-surface" : "border-brand-soft bg-brand-soft/40",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-ink-1">
                    {n.title}
                  </span>
                  {!n.readAt && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
                  )}
                  <span className="ml-auto text-[11px] text-ink-3">
                    {formatTime(n.createdAt)}
                  </span>
                </span>
                {n.body && (
                  <span className="text-[13px] text-ink-2">{n.body}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
