// Server functions proxying the apex-study-stream backend.
//   Batches list  -> https://rarestudy.github.io/rarestudy/batches.json
//   PW endpoints  -> https://learnbyakp.onrender.com/api/penpencil/<path>
// No auth token is required — the upstream handles it.

import { createServerFn } from "@tanstack/react-start";

const PW_BASE = "https://learnbyakp.onrender.com/api/penpencil";
const BATCHES_URL = "https://rarestudy.github.io/rarestudy/batches.json";

type ApiResponse = Record<string, unknown>;

const responseCache = new Map<string, { at: number; data: ApiResponse }>();
const CACHE_TTL = 60_000;

async function pwFetch(path: string): Promise<ApiResponse> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const cacheKey = `pw:${cleanPath}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch(`${PW_BASE}${cleanPath}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    let data: ApiResponse;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, message: "Invalid upstream response" };
    }
    if (data?.success !== false) responseCache.set(cacheKey, { at: Date.now(), data });
    return data;
  } catch (err) {
    if (cached) return cached.data;
    return {
      success: false,
      data: [],
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ---- Exported server functions ----

export const fetchBatches = createServerFn({ method: "GET" }).handler(async () => {
  const cached = responseCache.get("batches");
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data;
  try {
    const res = await fetch(BATCHES_URL, { headers: { Accept: "application/json" } });
    const json = (await res.json()) as ApiResponse;
    const list = Array.isArray(json.batches)
      ? json.batches
      : Array.isArray(json.data)
        ? json.data
        : [];
    const mapped = (list as Array<Record<string, unknown>>).map((b) => ({
      id: String(b._id ?? ""),
      name: String(b.name ?? ""),
      byName: b.byName ? String(b.byName) : undefined,
      previewImage: b.previewImage,
      startDate: b.startDate ? String(b.startDate) : undefined,
      endDate: b.endDate ? String(b.endDate) : undefined,
      language: b.language ? String(b.language) : undefined,
      feeTotal: typeof b.feeTotal === "number" ? b.feeTotal : undefined,
      type: b.type ? String(b.type) : undefined,
      slug: b.slug ? String(b.slug) : undefined,
    }));
    const out: ApiResponse = { success: true, data: mapped };
    responseCache.set("batches", { at: Date.now(), data: out });
    return out;
  } catch (err) {
    if (cached) return cached.data;
    return {
      success: false,
      data: [],
      message: err instanceof Error ? err.message : "Failed to load batches",
    };
  }
});

export const fetchBatchDetails = createServerFn({ method: "GET" })
  .inputValidator((d: { batchId: string }) => d)
  .handler(async ({ data }) => pwFetch(`/v3/batches/${data.batchId}/details?type=EXPLORE_LEAD`));

export const fetchTodaysSchedule = createServerFn({ method: "GET" })
  .inputValidator((d: { batchId: string; date?: string }) => d)
  .handler(async ({ data }) => {
    const date = data.date ?? new Date().toISOString().slice(0, 10);
    return pwFetch(
      `/v1/batches/${data.batchId}/todays-schedule?batchId=${data.batchId}&isNewStudyMaterialFlow=true&date=${date}`,
    );
  });

export const fetchTopics = createServerFn({ method: "GET" })
  .inputValidator((d: { batchId: string; subjectId: string; page?: number }) => d)
  .handler(async ({ data }) =>
    pwFetch(`/v2/batches/${data.batchId}/subject/${data.subjectId}/topics?page=${data.page ?? 1}`),
  );

async function contentRequest(
  batchId: string,
  subjectId: string,
  contentType: string,
  page: number,
  tag?: string,
) {
  const params = new URLSearchParams({ page: String(page), contentType });
  if (tag) params.set("tag", tag);
  return pwFetch(`/v2/batches/${batchId}/subject/${subjectId}/contents?${params}`);
}

function readArrayData(res: ApiResponse): unknown[] {
  if (Array.isArray(res?.data)) return res.data;
  const nested = (res?.data as Record<string, unknown> | undefined)?.data;
  if (Array.isArray(nested)) return nested;
  return [];
}

export const fetchContent = createServerFn({ method: "GET" })
  .inputValidator(
    (d: { batchId: string; subjectId: string; tag?: string; contentType: string; page: number }) =>
      d,
  )
  .handler(async ({ data }) => {
    const res = await contentRequest(
      data.batchId,
      data.subjectId,
      data.contentType,
      data.page,
      data.tag,
    );
    const items = readArrayData(res);
    return { ...res, data: items };
  });

export const fetchSubjectContents = createServerFn({ method: "GET" })
  .inputValidator((d: { batchId: string; subjectId: string }) => d)
  .handler(async ({ data }) => {
    const [topicsRes, ...counts] = await Promise.all([
      pwFetch(`/v2/batches/${data.batchId}/subject/${data.subjectId}/topics?page=1`),
      ...["videos", "notes", "exercises", "DppNotes", "DppSolution", "DppVideos"].map((t) =>
        contentRequest(data.batchId, data.subjectId, t, 1),
      ),
    ]);
    const topics = readArrayData(topicsRes);
    const types = ["videos", "notes", "exercises", "DppNotes", "DppSolution", "DppVideos"];
    const countsMap: Record<string, number> = {};
    counts.forEach((res, idx) => {
      const total =
        res?.paginate?.totalCount ?? res?.data?.paginate?.totalCount ?? readArrayData(res).length;
      countsMap[types[idx]] = typeof total === "number" ? total : 0;
    });
    return {
      success: true,
      data: {
        subjectId: data.subjectId,
        topics,
        counts: countsMap,
      },
    };
  });

// Full schedule details for a lecture/note — returns homework attachments with signed keys,
// which the paginated /contents endpoint strips out.
export const fetchScheduleDetails = createServerFn({ method: "GET" })
  .inputValidator((d: { batchId: string; subjectId: string; scheduleId: string }) => d)
  .handler(async ({ data }) =>
    pwFetch(
      `/v1/batches/${data.batchId}/subject/${data.subjectId}/schedule/${data.scheduleId}/schedule-details`,
    ),
  );
