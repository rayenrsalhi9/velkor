import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

interface ListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  label: string;
  onPageChange: (page: number) => void;
}

export default function ListPagination({
  page,
  pageSize,
  total,
  label,
  onPageChange,
}: ListPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p role="status" className="text-[12px] text-ink-3">
        {total === 0
          ? `0 ${label}`
          : `${from}–${to} of ${total} ${label}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <HugeiconsIcon icon={ChevronLeftIcon} size={14} />
          Previous
        </Button>
        <span className="min-w-16 text-center text-[12px] text-ink-3">
          Page {page} of {pageCount}
        </span>
        <Button
          variant="outline"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <HugeiconsIcon icon={ChevronRightIcon} size={14} />
        </Button>
      </div>
    </div>
  );
}
