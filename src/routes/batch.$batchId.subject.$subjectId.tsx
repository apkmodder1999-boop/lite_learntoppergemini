import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  BrainCircuit,
  ChevronRight,
  ClipboardList,
  FileText,
  Layers,
  Map,
  NotebookText,
  PlayCircle,
} from "lucide-react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { EmptyState, ErrorState, SkeletonCard } from "../components/states";
import { fetchSubjectContents } from "../lib/api.functions";
import type { Subject, Topic } from "../lib/api";

export const Route = createFileRoute("/batch/$batchId/subject/$subjectId")({
  head: () => ({ meta: [{ title: "Subject Contents — LearnTopper" }] }),
  component: SubjectPage,
});

type CountMap = Record<string, number | undefined>;
type ContentTab = "videos" | "notes" | "exercises" | "DppNotes" | "DppSolution" | "DppVideos";
type ResourceGroup = {
  id: string;
  label: string;
  description: string;
  icon: typeof PlayCircle;
  tab: ContentTab;
  topicKey?: keyof Topic;
  countKey?: string;
  matcher?: string;
};

const RESOURCE_GROUPS: ResourceGroup[] = [
  {
    id: "videos",
    label: "Videos",
    description: "Lecture videos and recorded classes",
    icon: PlayCircle,
    tab: "videos",
    topicKey: "lectureVideos",
    countKey: "videos",
  },
  {
    id: "notes",
    label: "Notes",
    description: "Class notes and study PDFs",
    icon: NotebookText,
    tab: "notes",
    topicKey: "notes",
    countKey: "notes",
  },
  {
    id: "exercises",
    label: "Exercises",
    description: "Exercise sets and quizzes",
    icon: ClipboardList,
    tab: "exercises",
    topicKey: "exercises",
    countKey: "exercises",
  },
  {
    id: "pdfs",
    label: "PDFs",
    description: "Downloadable PDF material",
    icon: FileText,
    tab: "notes",
    topicKey: "notes",
    countKey: "notes",
  },
  {
    id: "mindmaps",
    label: "Mind Maps",
    description: "Mind map PDF chapters",
    icon: BrainCircuit,
    tab: "notes",
    matcher: "mind map",
  },
  {
    id: "dpps",
    label: "DPPs",
    description: "Daily practice problem PDFs",
    icon: FileText,
    tab: "DppNotes",
    countKey: "DppNotes",
  },
  {
    id: "dpp-videos",
    label: "DPP Videos",
    description: "DPP solution videos",
    icon: PlayCircle,
    tab: "DppVideos",
    countKey: "DppVideos",
  },
  {
    id: "practice-sheets",
    label: "Practice Sheets",
    description: "Practice sheet topics and PDFs",
    icon: Map,
    tab: "notes",
    matcher: "practice sheet",
  },
];

function SubjectPage() {
  const { batchId, subjectId } = Route.useParams();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== `/batch/${batchId}/subject/${subjectId}`) return <Outlet />;

  return <SubjectContents batchId={batchId} subjectId={subjectId} />;
}

function SubjectContents({ batchId, subjectId }: { batchId: string; subjectId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["subject-contents", batchId, subjectId],
    queryFn: () => fetchSubjectContents({ data: { batchId, subjectId } }),
    staleTime: 60_000,
  });

  const payload = data?.data as
    | { subjectId?: string; subject?: Subject | null; topics?: Topic[]; counts?: CountMap }
    | undefined;
  const resolvedSubjectId = payload?.subjectId ?? subjectId;
  const subject = payload?.subject;
  const subjectTitle =
    subject?.subject ?? (subject as { name?: string } | undefined)?.name ?? "Subject Contents";
  const topics = Array.isArray(payload?.topics) ? payload!.topics! : [];
  const counts = payload?.counts ?? {};
  const totalTopicCounts = topics.reduce<number>(
    (sum, topic) =>
      sum +
      (topic.lectureVideos ?? topic.videos ?? 0) +
      (topic.notesCount ?? topic.notes ?? 0) +
      (topic.exerciseCount ?? topic.exercises ?? 0),
    0,
  );
  const totalContent = Object.values(counts).reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const hasContent = topics.length > 0 || totalTopicCounts > 0 || totalContent > 0;

  return (
    <div className="min-h-screen pb-28">
      <TopBar title={subjectTitle} />
      <main className="mx-auto max-w-5xl px-4 pt-4">
        {isLoading && (
          <div className="space-y-4">
            <SkeletonCard className="h-32" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} className="h-28" />
              ))}
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <ErrorState message="Couldn't load this subject's contents." onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && !hasContent && (
          <EmptyState
            title="No Content Available"
            description="No videos, notes, PDFs, DPPs or practice material are available for this subject yet."
          />
        )}

        {!isLoading && !isError && hasContent && (
          <div className="space-y-5 animate-fade-up">
            <section className="overflow-hidden rounded-3xl glass p-5 shadow-premium">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
                  <BookOpen className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary-glow">
                    Subject Contents
                  </p>
                  <h1 className="mt-1 text-2xl font-bold leading-tight">{subjectTitle}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {topics.length} topic{topics.length === 1 ? "" : "s"} ·{" "}
                    {totalContent || totalTopicCounts} available items
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {RESOURCE_GROUPS.map((group, index) => {
                const count = getGroupCount(group, topics, counts);
                if (count <= 0) return null;
                const firstTopic = pickTopicForGroup(topics, group);
                const Icon = group.icon;
                return (
                  <Link
                    key={group.id}
                    to="/batch/$batchId/subject/$subjectId/topic/$topicId"
                    params={{
                      batchId,
                      subjectId: resolvedSubjectId,
                      topicId: firstTopic?._id ?? firstTopic?.name ?? "all",
                    }}
                    search={{ tab: group.tab }}
                    className="group rounded-3xl glass p-4 shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-glow animate-fade-up"
                    style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary-glow">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                    <h3 className="text-base font-bold">{group.label}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {group.description}
                    </p>
                    <p className="mt-4 text-2xl font-black text-gradient">{count}</p>
                  </Link>
                );
              })}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Topics</h2>
                <span className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {topics.length} total
                </span>
              </div>
              {topics.map((topic, i) => (
                <TopicLinkCard
                  key={topic._id ?? topic.name}
                  topic={topic}
                  batchId={batchId}
                  subjectId={resolvedSubjectId}
                  index={i}
                />
              ))}
            </section>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function getGroupCount(group: ResourceGroup, topics: Topic[], counts: CountMap) {
  if (group.matcher) {
    const matcher = group.matcher.toLowerCase();
    return topics
      .filter((topic) => topic.name?.toLowerCase().includes(matcher))
      .reduce(
        (sum, topic) =>
          sum +
          (topic.notesCount ?? topic.notes ?? 0) +
          (topic.exerciseCount ?? topic.exercises ?? 0) +
          (topic.lectureVideos ?? topic.videos ?? 0),
        0,
      );
  }
  if (group.id === "pdfs") return counts.notes ?? 0;
  if (group.countKey && counts[group.countKey] !== undefined) return counts[group.countKey] ?? 0;
  if (group.topicKey) {
    return topics.reduce<number>((sum, topic) => sum + Number(topic[group.topicKey!] ?? 0), 0);
  }
  return 0;
}

function pickTopicForGroup(topics: Topic[], group: ResourceGroup) {
  if (group.matcher) {
    const matcher = group.matcher.toLowerCase();
    const matched = topics.find((topic) => topic.name?.toLowerCase().includes(matcher));
    if (matched) return matched;
  }
  if (group.topicKey) {
    const matched = topics.find((topic) => Number(topic[group.topicKey!] ?? 0) > 0);
    if (matched) return matched;
  }
  return topics[0];
}

function TopicLinkCard({
  topic,
  batchId,
  subjectId,
  index,
}: {
  topic: Topic;
  batchId: string;
  subjectId: string;
  index: number;
}) {
  const videos = topic.lectureVideos ?? topic.videos ?? 0;
  const notes = topic.notesCount ?? topic.notes ?? 0;
  const exercises = topic.exerciseCount ?? topic.exercises ?? 0;
  const firstTab: ContentTab =
    videos > 0 ? "videos" : notes > 0 ? "notes" : exercises > 0 ? "exercises" : "videos";
  const topicId = topic._id ?? topic.name;

  return (
    <Link
      to="/batch/$batchId/subject/$subjectId/topic/$topicId"
      params={{ batchId, subjectId, topicId }}
      search={{ tab: firstTab }}
      className="group flex items-center gap-3 rounded-3xl glass p-4 shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-glow animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
        <Layers className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">{topic.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {videos} Videos · {notes} Notes · {exercises} Exercises
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
