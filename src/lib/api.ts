// Shared client types & helpers.

export interface Batch {
  id: string;
  name: string;
  byName?: string;
  previewImage?: string;
  startDate?: string;
  endDate?: string;
  language?: string;
  feeTotal?: number;
  type?: string;
  slug?: string;
  // legacy fallbacks so old UI still compiles
  pngUrl?: string;
  cohort?: string;
  medium?: string;
  exam?: string;
  startsOn?: string;
}

export interface ImageRef {
  baseUrl?: string;
  key?: string;
}

export interface Teacher {
  _id: string;
  firstName?: string;
  lastName?: string;
  imageId?: ImageRef;
  qualification?: string;
}

export interface Subject {
  _id: string;
  subject: string;
  subjectId?: string;
  slug?: string;
  teacherIds?: Teacher[];
  imageId?: ImageRef;
  lectureCount?: number;
  tagCount?: number;
}

export interface BatchDetails {
  _id: string;
  name: string;
  batchName?: string;
  byName?: string;
  description?: string;
  previewImage?: ImageRef | string;
  iosPreviewImageUrl?: string;
  startDate?: string;
  endDate?: string;
  language?: string;
  exam?: string;
  subjects?: Subject[];
}

export interface Topic {
  _id: string;
  name: string;
  slug?: string;
  videos?: number;
  notes?: number;
  exercises?: number;
  lectureVideos?: number;
  notesCount?: number;
  exerciseCount?: number;
  homeworkCount?: number;
  displayOrder?: number;
}

export interface ContentItem {
  _id: string;
  topic?: string;
  videoDetails?: {
    name?: string;
    image?: string;
    duration?: number;
    videoUrl?: string;
    id?: string;
    _id?: string;
    videoId?: string;
    videoDetails?: string;
  };
  homeworkIds?: Array<{ _id: string; topic?: string }>;
  tags?: Array<{ _id: string; name?: string; slug?: string }>;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  url?: string;
  lectureType?: string;
  isDPPVideos?: boolean;
}

export function imageUrl(img?: ImageRef | string | null, fallback = ""): string {
  if (!img) return fallback;
  if (typeof img === "string") return img || fallback;
  if (!img.baseUrl && !img.key) return fallback;
  return `${img.baseUrl ?? ""}${img.key ?? ""}`;
}

export function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return "";
  if (seconds > 100_000) seconds = Math.floor(seconds / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export const EXTERNAL_PLAYER = {
  // External Vidcloud player.
  base: "https://vidyaverse-pw2.vercel.app/play.php",
};

export type PlayerSearch = {
  video_url?: string;
  video_name?: string;
  video_img?: string;
  video_type?: "new" | "live";
  play_type?: string;
  content_type?: "videos" | "DppVideos";
};

export function buildExternalPlayerUrl(params: {
  batchId: string;
  subjectId: string;
  topicId: string;
  videoId: string;
  videoUrl?: string;
  videoName?: string;
  videoImg?: string;
  videoType?: "new" | "live";
  playType?: string;
}) {
  const qs = new URLSearchParams({
    batch_id: params.batchId,
    subject_id: params.subjectId,
    topic_id: params.topicId,
    video_id: params.videoId,
    video_url: params.videoUrl ?? "",
    video_name: params.videoName ?? "Lecture",
    video_img: params.videoImg ?? "",
    video_type: params.videoType ?? "new",
    play_type: params.playType ?? "Lecture",
  });
  return `${EXTERNAL_PLAYER.base}?${qs.toString()}`;
}

export function inferPlayerVideoType(item?: ContentItem | null): "new" | "live" {
  if (!item) return "new";
  const row = item as ContentItem & Record<string, unknown>;
  const status = String(item.status ?? "").toUpperCase();
  const tag = String(row.tag ?? "").toUpperCase();
  const lectureType = String(item.lectureType ?? row.lectureType ?? "").toUpperCase();
  const video = item.videoDetails;
  const hasRecordedAsset = Boolean(
    video?._id || video?.id || video?.duration || status === "COMPLETED" || status === "READY",
  );

  if (status === "LIVE" || status === "STARTED" || tag.includes("LIVE")) return "live";
  if (tag.includes("UPCOMING") || (lectureType === "LIVE" && !hasRecordedAsset)) return "live";
  return "new";
}
