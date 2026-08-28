import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/lib/api";
import type { AppNotification } from "@/lib/api";

const POLL_INTERVAL = 30_000;

export function useNotifications() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const id = ++latest.current;
    try {
      const result = await listNotifications({ limit: 50 });
      if (id === latest.current) {
        setItems(result.items);
        setUnread(result.unread);
      }
    } catch {
      // keep last known state; polling retries
    }
  }, []);

  const read = useCallback(async (ids: string[]) => {
    const unique = [...new Set(ids)];
    await markNotificationsRead(unique);
    setUnread((prev) => {
      const unreadIds = new Set(
        items.filter((n) => !n.readAt).map((n) => n.id),
      );
      return Math.max(0, prev - unique.filter((id) => unreadIds.has(id)).length);
    });
    setItems((prev) =>
      prev.map((n) => (unique.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  }, [items]);

  const readAll = useCallback(async () => {
    await markAllNotificationsRead();
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  }, []);

  const onVisible = useEffectEvent(() => {
    void load();
  });

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_INTERVAL);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return { items, unread, refresh: load, read, readAll };
}
