import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { BatchCard } from "../components/BatchCard";
import { BatchSkeletonGrid, EmptyState, ErrorState } from "../components/states";
import { fetchBatches } from "../lib/api.functions";
import type { Batch } from "../lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LearnTopper" },
      { name: "description", content: "Browse premium learning batches for JEE, NEET and more." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cachedBatches, setCachedBatches] = useState<Batch[]>([]);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["batches"],
    queryFn: () => fetchBatches(),
    staleTime: 60_000,
  });

  useEffect(() => {
    try {
      const cached =
        localStorage.getItem("vidyaverse_cached_batches") ||
        localStorage.getItem("pw_cached_batches");
      if (cached) setCachedBatches(JSON.parse(cached));
    } catch {
      setCachedBatches([]);
    }
  }, []);

  useEffect(() => {
    if (Array.isArray(data?.data) && data.data.length > 0) {
      localStorage.setItem("vidyaverse_cached_batches", JSON.stringify(data.data));
      setCachedBatches(data.data as Batch[]);
    }
  }, [data]);

  const batches: Batch[] = useMemo(() => {
    const live = Array.isArray(data?.data) ? (data!.data as Batch[]) : [];
    const arr = live.length > 0 ? live : cachedBatches;
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.byName?.toLowerCase().includes(q) ||
        b.language?.toLowerCase().includes(q) ||
        b.slug?.toLowerCase().includes(q),
    );
  }, [cachedBatches, data, query]);

  const dataRecord = data as Record<string, unknown> | undefined;

  const hasBackendError =
    !isLoading && (isError || dataRecord?.success === false) && cachedBatches.length === 0;

  return (
    <div className="min-h-screen pb-28">
      <TopBar showBack={false} />
      <main className="mx-auto max-w-5xl px-4 pt-6">
        <div className="animate-fade-up space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary-glow" />
              Premium Learning
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Explore <span className="text-gradient">Batches</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Find your batch and start learning instantly.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for Arjuna, Lakshya, JEE..."
              className="w-full rounded-2xl glass px-12 py-3.5 text-sm outline-none ring-0 transition-all placeholder:text-muted-foreground focus:shadow-glow"
            />
          </div>
        </div>

        <section className="mt-8">
          {isLoading && <BatchSkeletonGrid />}
          {hasBackendError && (
            <ErrorState
              message={
                (dataRecord?.message as string) ||
                (dataRecord?.error as string) ||
                "We couldn't load batches right now."
              }
              onRetry={() => refetch()}
            />
          )}
          {!isLoading && !hasBackendError && batches.length === 0 && (
            <EmptyState
              title="No batches found"
              description={
                query
                  ? `No results match "${query}". Try a different keyword.`
                  : "Nothing available right now."
              }
            />
          )}
          {!isLoading && !hasBackendError && batches.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {batches.slice(0, 60).map((b, i) => (
                <BatchCard key={b.id} batch={b} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>
      <BottomNav />
      <button
        onClick={() => router.invalidate()}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
