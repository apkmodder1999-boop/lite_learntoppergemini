import { useEffect, useState } from "react";
import { Send, X, Gift } from "lucide-react";

const STORAGE_KEY = "telegram_popup_seen_v1";

export function TelegramPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setOpen(true), 900);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, []);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl glass-strong p-6 shadow-premium animate-fade-up">
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-primary shadow-glow">
          <Send className="h-7 w-7 text-primary-foreground" />
        </div>

        <h2 className="mt-4 text-center text-xl font-bold">Join our Telegram</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Get instant updates, lecture drops and study materials.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
          <Gift className="h-3.5 w-3.5" />
          100% Free for Everyone
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <a
            href="https://t.me/learn_topper"
            target="_blank"
            rel="noreferrer"
            onClick={close}
            className="inline-flex items-center justify-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            <Send className="h-4 w-4" />
            Open Telegram
          </a>
          <button
            onClick={close}
            className="rounded-full border border-border px-5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
