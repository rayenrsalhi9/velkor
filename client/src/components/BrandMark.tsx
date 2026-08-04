export default function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" aria-hidden className="size-8" fill="none">
        <rect width="32" height="32" rx="8" className="fill-indigo-600" />
        <path
          d="M9.5 12.5l6.5 9 6.5-9"
          stroke="#fff"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Velkor
      </span>
    </span>
  );
}
