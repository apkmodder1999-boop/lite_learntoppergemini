import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  BookOpen,
  Bell,
  ChevronLeft,
  ClipboardList,
  ChevronRight,
  Clock,
  Radio,
  Megaphone,
} from "lucide-react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { EmptyState, ErrorState, SkeletonCard } from "../components/states";
import { fetchBatchDetails, fetchTodaysSchedule } from "../lib/api.functions";
import {
  buildExternalPlayerUrl,
  imageUrl,
  type BatchDetails,
  type Subject,
  type Teacher,
} from "../lib/api";

export const Route = createFileRoute("/batch/$batchId")({
  head: ({ params }) => ({ meta: [{ title: `Batch ${params.batchId} — LearnTopper` }] }),
  component: BatchPage,
});

type Tab = "classes" | "tests" | "announcements";

interface ScheduleItem {
  _id?: string;
  topic?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  status?: string;
  videoDetails?: {
    name?: string;
    image?: string;
    duration?: number;
    videoUrl?: string;
    id?: string;
  };
  teachers?: Teacher[];
  teacherIds?: Teacher[];
  batchId?: string;
  batchSubjectId?: string;
  tags?: Array<{ _id?: string; name?: string }>;
  url?: string;
  urlType?: string;
  liveAt?: string;
  type?: string;
  lectureType?: string;
  subjectName?: string;
  isSimulatedLecture?: boolean;
}

function unwrapSchedule(data: unknown, subjects: Subject[] = []): ScheduleItem[] {
  if (!data || typeof data !== "object") return [];
  // API can return: { data: { data: [] } } or { data: [] }
  const root = data as { data?: unknown };
  const lvl1 = root.data;
  const teacherMap = new Map<string, Teacher>();
  subjects.forEach((subject) => {
    subject.teacherIds?.forEach((teacher) => {
      if (teacher?._id) teacherMap.set(teacher._id, teacher);
    });
  });

  const normalize = (items: unknown[]) =>
    items
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const event = row as ScheduleItem & {
          data?: ScheduleItem & { subjectId?: { name?: string } };
        };
        const payload = event.data && typeof event.data === "object" ? event.data : event;
        if (event.isSimulatedLecture || payload.isSimulatedLecture) return null;
        const teacherIds = Array.isArray(payload.teachers) ? payload.teachers : [];
        const teachers = teacherIds
          .map((teacher) =>
            typeof teacher === "string" ? teacherMap.get(teacher) : (teacher as Teacher),
          )
          .filter(Boolean) as Teacher[];
        const subject = (payload as { subjectId?: { name?: string } }).subjectId;
        return {
          ...payload,
          _id: payload._id ?? event._id,
          type: event.type ?? payload.type,
          teachers,
          subjectName: subject?.name ?? payload.subjectName,
        } as ScheduleItem;
      })
      .filter((item): item is ScheduleItem => Boolean(item?._id || item?.topic || item?.startTime));

  if (Array.isArray(lvl1)) return normalize(lvl1);
  if (lvl1 && typeof lvl1 === "object") {
    const inner = (lvl1 as { data?: unknown }).data;
    if (Array.isArray(inner)) return normalize(inner);
  }
  return [];
}

function formatClassTime(item: ScheduleItem): string {
  const raw = item.startTime ?? item.liveAt ?? item.date;
  if (!raw) return "";
  // startTime can be "16:00" or full ISO
  if (/^\d{2}:\d{2}/.test(raw)) {
    const [h, m] = raw.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hr = ((h + 11) % 12) + 1;
    return `${hr}:${String(m).padStart(2, "0")} ${period}`;
  }
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function BatchPage() {
  const { batchId } = Route.useParams();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== `/batch/${batchId}`) return <Outlet />;

  return <BatchOverview batchId={batchId} />;
}

function BatchOverview({ batchId }: { batchId: string }) {
  const [tab, setTab] = useState<Tab>("classes");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => fetchBatchDetails({ data: { batchId } }),
    staleTime: 60_000,
  });

  const scheduleQuery = useQuery({
    queryKey: ["batch", batchId, "todays-schedule"],
    queryFn: () => fetchTodaysSchedule({ data: { batchId } }),
    staleTime: 60_000,
  });

  const details: BatchDetails | undefined = data?.data;
  const banner =
    details?.iosPreviewImageUrl ||
    imageUrl(details?.previewImage) ||
    `https://placehold.co/1200x600/1e1b4b/a5b4fc?text=${encodeURIComponent(details?.name ?? "Batch")}`;
  const subjects: Subject[] = details?.subjects ?? [];
  const schedule = scheduleQuery.isSuccess ? unwrapSchedule(scheduleQuery.data, subjects) : [];

  return (
    <div className="min-h-screen pb-28">
      <TopBar title={details?.name ?? "Batch"} />
      <main className="mx-auto max-w-5xl px-4 pt-4">
        {isLoading && (
          <div className="space-y-4">
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-44" />
            <div className="grid gap-3 sm:grid-cols-2">
              <SkeletonCard className="h-24" />
              <SkeletonCard className="h-24" />
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <ErrorState message="Couldn't load this batch." onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && details && (
          <div className="space-y-6 animate-fade-up">
            <div className="overflow-hidden rounded-3xl glass shadow-premium">
              <div className="relative aspect-[16/8] bg-surface-elevated">
                <img src={banner} alt={details.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h2 className="text-2xl font-bold leading-tight">{details.name}</h2>
                  {details.byName && (
                    <p className="mt-1 text-sm text-muted-foreground">{details.byName}</p>
                  )}
                  <div className="mt-2.5 flex items-center gap-2">
                    {details.feeTotal ? (
                      <span className="text-base font-semibold text-muted-foreground line-through decoration-red-500 decoration-2">
                        ₹{details.feeTotal.toLocaleString()}
                      </span>
                    ) : null}
                    <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30 shadow-glow">
                      FREE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {schedule.length > 0 && <TodaysLiveClass items={schedule} />}

            <div className="sticky top-16 z-30 -mx-4 px-4 pb-2 pt-1">
              <div className="flex gap-2 overflow-x-auto rounded-2xl glass-strong p-1.5 no-scrollbar">
                {(
                  [
                    { id: "classes", label: "All Classes", icon: BookOpen },
                    { id: "tests", label: "Tests", icon: ClipboardList },
                    { id: "announcements", label: "Announcements", icon: Bell },
                  ] as const
                ).map((t) => {
                  const active = tab === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                        active
                          ? "gradient-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="whitespace-nowrap">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {tab === "classes" && (
              <div className="space-y-3">
                {subjects.length === 0 ? (
                  <EmptyState title="No subjects available" description="Check back soon." />
                ) : (
                  subjects.map((s, i) => (
                    <SubjectCard key={s._id} subject={s} batchId={batchId} index={i} />
                  ))
                )}
              </div>
            )}

            {tab === "tests" && (
              <EmptyState
                icon={<ClipboardList className="h-7 w-7" />}
                title="No tests yet"
                description="New mock tests will appear here."
              />
            )}
            {tab === "announcements" && (
              <EmptyState
                icon={<Megaphone className="h-7 w-7" />}
                title="No announcements"
                description="You're all caught up."
              />
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function TodaysLiveClass({ items }: { items: ScheduleItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };
  const occurredCount = items.filter((i) => {
    const s = computeLiveStatus(i);
    return s === "ENDED" || s === "LIVE";
  }).length;
  const cancelledCount = items.length - occurredCount;

  return (
    <div className="rounded-3xl glass p-4 shadow-premium">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
            <Radio className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold">Today's Live Class</h3>
            <p className="text-xs text-muted-foreground">
              {`${items.length} class${items.length === 1 ? "" : "es"} (${occurredCount} occurred${cancelledCount > 0 ? `, ${cancelledCount} cancelled` : ""})`}
            </p>
          </div>
        </div>
        <div className="hidden shrink-0 gap-1 sm:flex">
          <button
            onClick={() => scrollBy(-320)}
            aria-label="Scroll left"
            className="grid h-9 w-9 place-items-center rounded-full glass-strong text-muted-foreground transition-all hover:text-foreground hover:shadow-glow"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollBy(320)}
            aria-label="Scroll right"
            className="grid h-9 w-9 place-items-center rounded-full glass-strong text-muted-foreground transition-all hover:text-foreground hover:shadow-glow"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 no-scrollbar snap-x scroll-smooth"
      >
        {items.map((item, i) => (
          <LiveClassCard key={item._id ?? i} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}

function computeLiveStatus(item: ScheduleItem): "LIVE" | "ENDED" | "CANCELLED" {
  const raw = String(item.status ?? "").toUpperCase();
  if (raw === "LIVE" || raw === "STARTED") return "LIVE";
  if (raw === "COMPLETED" || raw === "ENDED") return "ENDED";
  if (raw === "CANCELLED" || raw === "CANCELED") return "CANCELLED";

  const parseTime = (t?: string) => {
    if (!t) return null;
    if (/^\d{2}:\d{2}/.test(t)) {
      const [h, m] = t.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.getTime();
    }
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d.getTime();
  };

  const start = parseTime(item.startTime ?? item.liveAt ?? item.date);
  const end = parseTime(item.endTime) ?? (start ? start + 60 * 60 * 1000 : null);
  const now = Date.now();
  if (start && now >= start && end && now < end) return "LIVE";
  if (end && now >= end) return "ENDED";
  if (item.videoDetails?.videoUrl || item.url) return "ENDED";

  return "CANCELLED";
}

function LiveClassCard({ item, index }: { item: ScheduleItem; index: number }) {
  const teacher = (item.teachers ?? item.teacherIds ?? [])[0];
  const teacherName = teacher
    ? `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim()
    : "Teacher info unavailable";
  const thumb = imageUrl(teacher?.imageId) || item.videoDetails?.image || "";
  const title = item.topic ?? item.videoDetails?.name ?? "Scheduled class";
  const status = computeLiveStatus(item);
  const isLive = status === "LIVE";
  const isEnded = status === "ENDED";
  const isCancelled = status === "CANCELLED";
  const time = formatClassTime(item);
  const tagId = item.tags?.[0]?._id ?? "live";
  const subjectId = (item as { batchSubjectId?: string }).batchSubjectId ?? "live";
  const playerUrl = buildExternalPlayerUrl({
    batchId: (item as { batchId?: string }).batchId ?? "",
    subjectId,
    topicId: tagId,
    videoId: item._id ?? "",
    videoUrl: item.url ?? item.videoDetails?.videoUrl ?? "",
    videoName: title,
    videoImg: item.videoDetails?.image ?? thumb,
    videoType: isEnded ? "new" : "live",
    playType: "Lecture",
  });

  const badgeClass = isLive
    ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/40"
    : isEnded
      ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
      : "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40 font-bold";

  return (
    <a
      href={isCancelled && !(item.url || item.videoDetails?.videoUrl) ? undefined : playerUrl}
      className={`snap-start block w-64 shrink-0 overflow-hidden rounded-2xl glass-strong shadow-premium animate-fade-up transition-all hover:-translate-y-0.5 hover:shadow-glow ${
        isCancelled ? "opacity-90" : ""
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="relative aspect-video bg-surface-elevated">
        {thumb ? (
          <img src={thumb} alt={teacherName} className="h-full w-full object-contain" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-primary/10 text-primary-glow">
            <Radio className="h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent px-3 py-2">
          <p className="truncate text-xs font-semibold text-foreground">{teacherName}</p>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${badgeClass}`}
          >
            {isLive && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />}
            {status}
          </span>
          {time && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {time}
            </span>
          )}
        </div>
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug">{title}</h4>
        {item.subjectName && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{item.subjectName}</p>
        )}
      </div>
    </a>
  );
}

function SubjectCard({
  subject,
  batchId,
  index,
}: {
  subject: Subject;
  batchId: string;
  index: number;
}) {
  const teacher = subject.teacherIds?.[0];
  const teacherImg = imageUrl(teacher?.imageId);
  const subjectImg = imageUrl(subject.imageId);

  return (
    <Link
      to="/batch/$batchId/subject/$subjectId"
      params={{ batchId, subjectId: subject._id }}
      className="group block rounded-3xl glass p-4 shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-glow animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
    >
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface-elevated shadow-glow sm:h-20 sm:w-20">
          {subjectImg ? (
            <img src={subjectImg} alt={subject.subject} className="h-full w-full object-cover" />
          ) : (
            <BookOpen className="h-7 w-7 text-primary-glow" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold sm:text-lg">{subject.subject}</h3>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {subject.lectureCount ?? 0} Lectures · {subject.tagCount ?? 0} Chapters
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>

      {teacher && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-surface-elevated/60 p-3">
          {teacherImg ? (
            <img
              src={teacherImg}
              alt={teacher.firstName}
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-primary/30"
            />
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
              {(teacher.firstName ?? "?")[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {teacher.firstName} {teacher.lastName ?? ""}
            </p>
            {teacher.qualification && (
              <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                {teacher.qualification}
              </p>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
