import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Send } from "lucide-react";

const items = [
  { to: "/", label: "All Batches", icon: Compass },
  { to: "/telegram", label: "Telegram", icon: Send },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-4">
      <div className="mx-auto flex max-w-md items-center justify-around rounded-3xl glass-strong px-2 py-2 shadow-premium">
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs transition-all ${
                active
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
