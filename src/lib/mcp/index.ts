import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBatches from "./tools/list-batches";
import getBatchDetails from "./tools/get-batch-details";
import listTopics from "./tools/list-topics";
import listContent from "./tools/list-content";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "learntopper-mcp",
  title: "LearnTopper MCP",
  version: "0.1.0",
  instructions:
    "Tools to browse LearnTopper learning batches, subjects, topics, and lecture content on behalf of the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listBatches, getBatchDetails, listTopics, listContent],
});
