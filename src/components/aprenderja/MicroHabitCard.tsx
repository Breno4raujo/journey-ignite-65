import { Timer, Sparkles } from "lucide-react";

interface Props {
  moduleTitle: string | null;
  lessonNumber: number | null;
  /** Minutes the user committed to today (from the impact calculator/pace). */
  minutesToday: number;
  paused?: boolean;
  onStart: (minutes: number) => void;
}

export function MicroHabitCard({
  moduleTitle,
  lessonNumber,
  minutesToday,
  paused,
  onStart,
}: Props) {
  const minutes = Math.max(3, Math.min(minutesToday, 25));
  const tiny = Math.min(minutes, 5);

  if (paused) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
        Sua semana está em pausa programada. Nenhuma micro-meta hoje — descanse com tranquilidade.
        🌿
      </div>
    );
  }

  if (!moduleTitle) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-gradient-to-br from-primary-soft to-accent-soft/50 border border-primary/15 p-5 shadow-soft">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 shadow-soft">
          <Timer className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary font-semibold">
            <Sparkles className="h-3 w-3" /> Micro-meta de hoje
          </div>
          <p className="mt-1 text-base font-semibold text-foreground leading-snug">
            Só {tiny} minutinhos hoje já mantêm seu ritmo.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Abra a lição {lessonNumber ?? 1} de “{moduleTitle}”. Sem cobrança — qualquer passo
            conta.
          </p>
        </div>
        <button
          onClick={() => onStart(tiny)}
          className="text-xs font-semibold px-3.5 py-2 rounded-full bg-foreground text-background hover:opacity-90 transition shrink-0"
        >
          {tiny} min agora
        </button>
      </div>
    </section>
  );
}
