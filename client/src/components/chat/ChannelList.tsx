import { HugeiconsIcon } from "@hugeicons/react";
import { HashIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/cn";
import type { ChatChannel } from "@/lib/api";

interface ChannelListProps {
  channels: ChatChannel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function ChannelList({
  channels,
  selectedId,
  onSelect,
  onNew,
}: ChannelListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <h2 className="text-[10.5px] font-semibold tracking-[0.09em] text-ink-3 uppercase">
          Channels
        </h2>
        <button
          type="button"
          onClick={onNew}
          aria-label="New channel"
          className="grid h-6 w-6 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink-1"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} />
        </button>
      </div>

      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        {channels.map((channel) => {
          const active = channel.id === selectedId;
          return (
            <li key={channel.id}>
              <button
                type="button"
                onClick={() => onSelect(channel.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-ink-2 hover:bg-surface-2 hover:text-ink-1",
                )}
              >
                <HugeiconsIcon icon={HashIcon} size={15} className="shrink-0" />
                <span className="truncate">{channel.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}