export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-ink-3">{title}: coming soon</p>
    </div>
  );
}
