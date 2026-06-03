export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 rounded-2xl bg-muted" />
      <div className="h-24 rounded-2xl bg-muted" />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="h-20 rounded-2xl bg-muted" />
      </div>
      <div className="h-64 rounded-2xl bg-muted" />
    </div>
  );
}