import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bell as BellIcon } from "@hugeicons/core-free-icons";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationsBell() {
  const { unread } = useNotifications();

  return (
    <Link
      to="/notifications"
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      className="relative grid h-9 w-9 place-items-center rounded-md border border-line bg-surface text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1"
    >
      <HugeiconsIcon icon={BellIcon} size={16} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
