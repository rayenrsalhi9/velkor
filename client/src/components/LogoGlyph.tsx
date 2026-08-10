export default function LogoGlyph({ className }: { className?: string }) {
  return (
    <img
      src="/favicon-32x32.png"
      alt=""
      aria-hidden
      draggable={false}
      className={className}
    />
  );
}
