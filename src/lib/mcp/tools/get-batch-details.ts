import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fetchBatchDetails } from "@/lib/api.functions";

export default defineTool({
  name: "get_batch_details",
  title: "Get batch details",
  description:
    "Get a batch's full details including its subjects. Pass the batch id returned by list_batches.",
  inputSchema: {
    batch_id: z.string().min(1).describe("Batch id (e.g. from list_batches)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ batch_id }) => {
    const res = await fetchBatchDetails({ data: { batchId: batch_id } });
    return {
      content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
      structuredContent: res,
    };
  },
});
