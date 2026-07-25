import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fetchBatches } from "@/lib/api.functions";

export default defineTool({
  name: "list_batches",
  title: "List batches",
  description:
    "List available learning batches (e.g. JEE, NEET). Returns id, name, teacher, language, and slug.",
  inputSchema: {
    search: z
      .string()
      .optional()
      .describe(
        "Optional case-insensitive filter matched against name, teacher, language, or slug.",
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .describe("Max batches to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ search, limit }) => {
    const res = await fetchBatches();
    const list = Array.isArray(res?.data) ? res.data : [];
    const q = (search ?? "").toLowerCase().trim();
    const filtered = q
      ? list.filter((b: Record<string, unknown>) =>
          [b.name, b.byName, b.language, b.slug]
            .filter((v): v is string => typeof v === "string")
            .some((v) => v.toLowerCase().includes(q)),
        )
      : list;
    const trimmed = filtered.slice(0, limit ?? 50);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ count: trimmed.length, batches: trimmed }, null, 2),
        },
      ],
      structuredContent: { count: trimmed.length, batches: trimmed },
    };
  },
});
