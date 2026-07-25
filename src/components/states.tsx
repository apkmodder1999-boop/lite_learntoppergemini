import { Inbox, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

export function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-3xl ${className}`} />;
}

export function BatchSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} className="h-64" />
      ))}
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description = "Check back later.",
  icon,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl glass p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-elevated text-muted-foreground">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl glass p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/15 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold">Something went wrong</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {message ?? "Please try again in a moment."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-full gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Try again
        </button>
      )}
    </div>
  );
}
