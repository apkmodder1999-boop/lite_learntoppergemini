import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar } from "lucide-react";
import type { Batch } from "../lib/api";

export function BatchCard({ batch, index = 0 }: { batch: Batch; index?: number }) {
  const img =
    batch.previewImage ||
    batch.pngUrl ||
    `https://placehold.co/640x360/1e1b4b/a5b4fc?text=${encodeURIComponent(batch.name)}`;
  return (
    <Link
      to="/batch/$batchId"
      params={{ batchId: batch.id }}
      className="group block animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <article className="overflow-hidden rounded-3xl glass shadow-premium transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
        <div className="relative aspect-[16/9] overflow-hidden bg-surface-elevated">
          <img
            src={img}
            alt={batch.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                `https://placehold.co/640x360/1e1b4b/a5b4fc?text=${encodeURIComponent(batch.name.slice(0, 24))}`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
          {batch.language && (
            <span className="absolute left-3 top-3 rounded-full glass-strong px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {batch.language}
            </span>
          )}
          {batch.type && (
            <span className="absolute right-3 top-3 rounded-full gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow">
              {batch.type.replace(/_/g, " ")}
            </span>
          )}
        </div>
        <div className="space-y-3 p-4">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">{batch.name}</h3>
          {batch.byName && (
            <p className="line-clamp-1 text-xs text-muted-foreground">{batch.byName}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {batch.startDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2.5 py-1">
                <Calendar className="h-3.5 w-3.5" />
                {batch.startDate}
              </span>
            )}
            {batch.endDate && (
              <span className="rounded-full bg-surface-elevated px-2.5 py-1">
                → {batch.endDate}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-success">
              {batch.feeTotal ? `₹${batch.feeTotal.toLocaleString()}` : "FREE"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform group-hover:translate-x-0.5">
              Start Learning <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
