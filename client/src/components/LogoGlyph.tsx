export default function LogoGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className} fill="none">
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path
        d="M9.5 12.5l6.5 9 6.5-9"
        stroke="#fff"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
