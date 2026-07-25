import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";

export const Route = createFileRoute("/telegram")({
  head: () => ({ meta: [{ title: "Join Telegram — LearnTopper" }] }),
  component: () => (
    <div className="min-h-screen pb-28">
      <TopBar showBack={false} />
      <main className="mx-auto max-w-5xl px-4 pt-10">
        <div className="rounded-3xl glass p-10 text-center shadow-premium">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-primary shadow-glow">
            <Send className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="mt-4 text-2xl font-bold">Join our Telegram</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get instant updates, lecture drops and study materials.
          </p>
          <a
            href="https://t.me/learn_topper"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-full gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Open Telegram
          </a>
        </div>
      </main>
      <BottomNav />
    </div>
  ),
});
