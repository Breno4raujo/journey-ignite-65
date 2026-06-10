import { useEffect } from "react";
import { Lock, Sparkles, X } from "lucide-react";
import type { SoftSkillBadge } from "@/lib/aprenderja/types";

interface Props {
  badge: SoftSkillBadge | null;
  celebrate: boolean;
  onClose: () => void;
}

const CONFETTI_COLORS = ["var(--color-accent)", "var(--color-primary)", "var(--color-success)"];

export function AchievementModal({ badge, celebrate, onClose }: Props) {
  useEffect(() => {
    if (!badge) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [badge, onClose]);

  if (!badge) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Conquista"
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {celebrate && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 block h-2 w-2 rounded-sm animate-confetti"
              style={{
                left: `${(i * 97) % 100}%`,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${(i % 8) * 0.12}s`,
                transform: `rotate(${(i * 37) % 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <div
        className="relative w-full max-w-md rounded-3xl bg-card border border-border shadow-glow p-8 text-center animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:bg-muted transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className={`mx-auto h-16 w-16 rounded-2xl grid place-items-center shadow-glow ${
            badge.earned ? "bg-gradient-celebrate" : "bg-muted"
          }`}
        >
          {badge.earned ? (
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          ) : (
            <Lock className="h-7 w-7 text-muted-foreground" />
          )}
        </div>

        <p className="mt-5 text-xs uppercase tracking-widest text-accent font-semibold">
          {badge.earned ? "Conquista desbloqueada" : "Conquista bloqueada"}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{badge.label}</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{badge.description}</p>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-gradient-primary text-primary-foreground font-semibold py-3 shadow-soft hover:opacity-95 active:scale-[0.99] transition"
        >
          {badge.earned ? "Guardar conquista" : "Continuar estudando"}
        </button>
      </div>
    </div>
  );
}
