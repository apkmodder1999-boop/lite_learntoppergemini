import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { EmptyState } from "../components/states";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "My Batches — LearnTopper" }] }),
  component: () => (
    <div className="min-h-screen pb-28">
      <TopBar showBack={false} />
      <main className="mx-auto max-w-5xl px-4 pt-10">
        <h1 className="mb-6 text-3xl font-bold">My Batches</h1>
        <EmptyState
          icon={<Heart className="h-7 w-7" />}
          title="No saved batches yet"
          description="Save batches from the home page to see them here."
        />
      </main>
      <BottomNav />
    </div>
  ),
});
