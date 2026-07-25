import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fetchContent } from "@/lib/api.functions";

export default defineTool({
  name: "list_content",
  title: "List content",
  description:
    "List videos, notes, exercises, or DPP items for a subject in a batch, optionally filtered by topic tag.",
  inputSchema: {
    batch_id: z.string().min(1),
    subject_id: z.string().min(1),
    content_type: z
      .enum(["videos", "notes", "exercises", "DppNotes", "DppSolution", "DppVideos"])
      .describe("Which type of content to list."),
    page: z.number().int().min(1).optional().describe("Page number (default 1)."),
    tag: z.string().optional().describe("Topic id to filter by."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ batch_id, subject_id, content_type, page, tag }) => {
    const res = await fetchContent({
      data: {
        batchId: batch_id,
        subjectId: subject_id,
        contentType: content_type,
        page: page ?? 1,
        tag,
      },
    });
    return {
      content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
      structuredContent: res,
    };
  },
});
