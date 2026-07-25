import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, FileText, Loader2, PlayCircle } from "lucide-react";
import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { EmptyState, ErrorState, SkeletonCard } from "../components/states";
import { fetchContent, fetchScheduleDetails } from "../lib/api.functions";
import {
  buildExternalPlayerUrl,
  formatDate,
  formatDuration,
  inferPlayerVideoType,
  type ContentItem,
} from "../lib/api";

const TABS = [
  { id: "videos", label: "Lectures", type: "videos" },
  { id: "notes", label: "Notes", type: "notes" },
  { id: "exercises", label: "Exercises", type: "exercises" },
  { id: "DppNotes", label: "DPP", type: "DppNotes" },
  { id: "DppSolution", label: "DPP PDF", type: "DppSolution" },
  { id: "DppVideos", label: "DPP Videos", type: "DppVideos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export const Route = createFileRoute("/batch/$batchId/subject/$subjectId/topic/$topicId")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: (typeof s.tab === "string" ? (s.tab as TabId) : "videos") as TabId,
  }),
  head: () => ({ meta: [{ title: "Lectures — LearnTopper" }] }),
  component: TopicPage,
});

function TopicPage() {
  const { batchId, subjectId, topicId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["content", batchId, subjectId, topicId, active.type],
    queryFn: () =>
      fetchContent({
        data: {
          batchId,
          subjectId,
          tag: topicId === "all" ? undefined : topicId,
          contentType: active.type,
          page: 1,
        },
      }),
    staleTime: 30_000,
  });
  const items: ContentItem[] = Array.isArray(data?.data) ? data!.data : [];

  return (
    <div className="min-h-screen pb-28">
      <TopBar title={decodeURIComponent(topicId).slice(0, 60)} />
      <main className="mx-auto max-w-5xl px-4 pt-4">
        <div className="sticky top-16 z-30 -mx-4 px-4 pb-3 pt-1">
          <div className="flex gap-2 overflow-x-auto rounded-2xl glass-strong p-1.5 no-scrollbar">
            {TABS.map((t) => {
              const isActive = active.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() =>
                    navigate({
                      to: "/batch/$batchId/subject/$subjectId/topic/$topicId",
                      params: { batchId, subjectId, topicId },
                      search: { tab: t.id },
                    })
                  }
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? "gradient-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} className="h-28" />
            ))}
          </div>
        )}
        {isError && !isLoading && (
          <ErrorState message="Couldn't load this section." onRetry={() => refetch()} />
        )}
        {!isLoading && !isError && items.length === 0 && (
          <EmptyState
            title={`No ${active.label.toLowerCase()} available`}
            description="Content will appear here as soon as it's published."
          />
        )}
        {!isLoading && !isError && items.length > 0 && (
          <div className="space-y-3">
            {items.map((it, i) =>
              active.id === "videos" || active.id === "DppVideos" ? (
                <LectureCard
                  key={it._id ?? i}
                  item={it}
                  batchId={batchId}
                  subjectId={subjectId}
                  topicId={topicId}
                  index={i}
                />
              ) : (
                <NotesCard
                  key={it._id ?? i}
                  item={it}
                  index={i}
                  batchId={batchId}
                  subjectId={subjectId}
                />
              ),
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function LectureCard({
  item,
  batchId,
  subjectId,
  topicId,
  index,
}: {
  item: ContentItem;
  batchId: string;
  subjectId: string;
  topicId: string;
  index: number;
}) {
  const v = item.videoDetails as
    (ContentItem["videoDetails"] & Record<string, unknown>) | undefined;
  // IMPORTANT: use the schedule _id (Marco's lectureId), NOT videoDetails._id.
  const videoId = item._id;
  const row = item as ContentItem & Record<string, unknown>;
  const videoName = String(v?.name ?? item.topic ?? "Lecture");
  const videoImg = String(v?.image ?? "");
  const videoUrl = String(v?.videoUrl ?? item.url ?? row.ytStreamUrl ?? row.hls_url ?? "");
  const contentType = item.isDPPVideos ? "DppVideos" : "videos";
  const playerUrl = buildExternalPlayerUrl({
    batchId,
    subjectId,
    topicId,
    videoId: String(videoId),
    videoUrl,
    videoName,
    videoImg,
    videoType: inferPlayerVideoType(item),
    playType: contentType === "DppVideos" ? "DPP Video" : "Lecture",
  });
  const rawDuration = v?.duration ?? row.duration ?? row.videoDuration;
  const duration =
    typeof rawDuration === "string"
      ? rawDuration.includes(":")
        ? rawDuration
        : Number(rawDuration)
      : Number(rawDuration ?? 0);
  const date = String(item.date ?? item.startTime ?? row.createdAt ?? row.updatedAt ?? "");
  const time = String(item.startTime ?? row.startAt ?? row.liveAt ?? "");
  const thumb =
    v?.image ||
    `https://placehold.co/400x225/1e1b4b/a5b4fc?text=${encodeURIComponent(v?.name ?? "Lecture")}`;
  return (
    <a
      href={playerUrl}
      onClick={() => {
        try {
          const key = "vidyaverse_continue";
          const list = JSON.parse(localStorage.getItem(key) ?? "[]");
          const entry = {
            batchId,
            subjectId,
            topicId,
            videoId: String(videoId),
            name: videoName,
            image: videoImg,
            at: Date.now(),
          };
          const dedup = [
            entry,
            ...list.filter((x: { videoId?: string }) => x.videoId !== entry.videoId),
          ].slice(0, 20);
          localStorage.setItem(key, JSON.stringify(dedup));
        } catch {
          /* ignore storage error */
        }
      }}
      className="group flex gap-3 rounded-3xl glass p-3 shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-glow animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
    >
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-2xl bg-surface-elevated sm:w-40">
        <img src={thumb} alt={v?.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 grid place-items-center bg-background/40 opacity-0 transition-opacity group-hover:opacity-100">
          <PlayCircle className="h-10 w-10 text-primary-foreground drop-shadow-lg" />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-1 pr-2">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">
          {videoName}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {duration ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />{" "}
              {typeof duration === "string" ? duration : formatDuration(duration)}
            </span>
          ) : null}
          {date && <span>{formatDate(date)}</span>}
          {time && <span>{formatTime(time)}</span>}
        </div>
      </div>
      <CompletedBadge id={String(videoId)} />
    </a>
  );
}

function formatTime(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function CompletedBadge({ id }: { id: string }) {
  const done = typeof window !== "undefined" && localStorage.getItem(`watched:${id}`) === "1";
  return (
    <div className="self-center pr-2">
      <CheckCircle2 className={`h-6 w-6 ${done ? "text-success" : "text-muted-foreground/40"}`} />
    </div>
  );
}

type Attachment = { baseUrl?: string; key?: string; name?: string; url?: string };
type Homework = {
  _id: string;
  topic?: string;
  name?: string;
  title?: string;
  attachmentIds?: Attachment[];
};

function attachmentHref(a?: Attachment): string | undefined {
  if (!a) return undefined;
  if (a.url) return a.url;
  if (a.baseUrl && a.key) return `${a.baseUrl}${a.key}`;
  return undefined;
}

function NotesCard({
  item,
  index,
  batchId,
  subjectId,
}: {
  item: ContentItem;
  index: number;
  batchId: string;
  subjectId: string;
}) {
  const hw = (item.homeworkIds?.[0] ?? (item as { homework?: unknown }).homework) as
    Homework | undefined;
  const exercise = (item as { exerciseIds?: Array<{ title?: string; exerciseDetails?: string }> })
    .exerciseIds?.[0];
  const listAttachments =
    hw?.attachmentIds ?? (item as { attachmentIds?: Attachment[] }).attachmentIds ?? [];
  const listHref = attachmentHref(listAttachments[0]);

  const [resolvedHref, setResolvedHref] = useState<string | undefined>(listHref);
  const [error, setError] = useState<string | null>(null);

  const resolveMut = useMutation({
    mutationFn: async () => {
      const res = await fetchScheduleDetails({
        data: { batchId, subjectId, scheduleId: item._id },
      });
      const detail = (res as { data?: Record<string, unknown> }).data ?? {};
      const homeworks = (detail.homeworkIds as Homework[] | undefined) ?? [];
      for (const h of homeworks) {
        for (const a of h.attachmentIds ?? []) {
          const href = attachmentHref(a);
          if (href) return href;
        }
      }
      return undefined;
    },
    onSuccess: (href) => {
      if (href) {
        setResolvedHref(href);
        window.open(href, "_blank", "noopener,noreferrer");
      } else {
        setError("No document attached yet.");
      }
    },
    onError: () => setError("Couldn't open this document. Please try again."),
  });

  const title =
    hw?.topic ??
    hw?.title ??
    hw?.name ??
    exercise?.title ??
    item.topic ??
    listAttachments[0]?.name ??
    "Resource";

  const busy = resolveMut.isPending;

  function handleClick(e: React.MouseEvent) {
    if (resolvedHref) return; // <a> handles it
    e.preventDefault();
    if (busy) return;
    setError(null);
    resolveMut.mutate();
  }

  const Body = (
    <>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">
          {exercise?.exerciseDetails ?? formatDate(item.date)}
          {" · "}
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : busy ? (
            "Fetching document…"
          ) : (
            "Tap to open PDF"
          )}
        </p>
      </div>
    </>
  );
  const className =
    "flex items-center gap-3 rounded-3xl glass p-4 shadow-premium animate-fade-up transition-all hover:-translate-y-0.5 hover:shadow-glow cursor-pointer";
  const style = { animationDelay: `${Math.min(index, 10) * 30}ms` };
  return resolvedHref ? (
    <a
      href={resolvedHref}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
    >
      {Body}
    </a>
  ) : (
    <button
      type="button"
      onClick={handleClick}
      className={`${className} w-full text-left`}
      style={style}
    >
      {Body}
    </button>
  );
}
