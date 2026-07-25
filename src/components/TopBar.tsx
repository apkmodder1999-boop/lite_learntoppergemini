import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, GraduationCap } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  title?: string;
  showBack?: boolean;
  right?: ReactNode;
}

export function TopBar({ title, showBack = true, right }: Props) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 glass-strong">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-sm font-extrabold tracking-tight sm:text-base">
            LEARNTOPPER<span className="text-primary">.IN</span>
          </span>
        </Link>
        {showBack && (
          <button
            onClick={() => router.history.back()}
            aria-label="Back"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-elevated/70 text-foreground transition-transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        {title ? (
          <h1 className="line-clamp-1 min-w-0 flex-1 text-base font-semibold sm:text-lg">
            {title}
          </h1>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex shrink-0 items-center gap-2">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
