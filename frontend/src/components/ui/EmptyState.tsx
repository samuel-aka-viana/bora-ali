export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {description && <p className="text-muted mt-2">{description}</p>}
    </div>
  );
}
