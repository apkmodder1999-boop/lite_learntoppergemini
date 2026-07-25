import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fetchTopics } from "@/lib/api.functions";

export default defineTool({
  name: "list_topics",
  title: "List topics",
  description: "List topics for a subject within a batch.",
  inputSchema: {
    batch_id: z.string().min(1),
    subject_id: z.string().min(1),
    page: z.number().int().min(1).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ batch_id, subject_id, page }) => {
    const res = await fetchTopics({ data: { batchId: batch_id, subjectId: subject_id, page } });
    return {
      content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
      structuredContent: res,
    };
  },
});
