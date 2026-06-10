import { useEffect } from "react";
import { PartyPopper, X } from "lucide-react";

interface Props {
  open: boolean;
  moduleTitle: string | null;
  onClose: () => void;
}

const CONFETTI_COLORS = ["var(--color-accent)", "var(--color-primary)", "var(--color-success)"];

export function CelebrationModal({ open, moduleTitle, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open || !moduleTitle) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Módulo concluído"
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Confetti */}
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

        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-celebrate grid place-items-center shadow-glow">
          <PartyPopper className="h-8 w-8 text-primary-foreground" />
        </div>

        <p className="mt-5 text-xs uppercase tracking-widest text-accent font-semibold">
          Parabéns, módulo concluído!
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{moduleTitle}</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Que orgulho! Mais um passo firme na sua virada de carreira. Cada lição daqui pra frente é
          um investimento em você.
        </p>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-gradient-primary text-primary-foreground font-semibold py-3 shadow-soft hover:opacity-95 active:scale-[0.99] transition"
        >
          Continuar minha jornada
        </button>
      </div>
    </div>
  );
}
