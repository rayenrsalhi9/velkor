import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink-1">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[13px] text-ink-2">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}