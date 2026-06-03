import { useMemo, useState } from "react";
import { CalendarClock, Sparkles } from "lucide-react";

interface Props {
  remainingLessons: number;
  /** ~min per lesson, derived from pace. */
  minutesPerLesson?: number;
}

export function ImpactCalculator({ remainingLessons, minutesPerLesson = 30 }: Props) {
  const [minutesPerDay, setMinutesPerDay] = useState(20);

  const { finishDate, weeks, daysNeeded } = useMemo(() => {
    const totalMinutes = remainingLessons * minutesPerLesson;
    const days = Math.max(1, Math.ceil(totalMinutes / Math.max(1, minutesPerDay)));
    const date = new Date();
    date.setDate(date.getDate() + days);
    return { finishDate: date, weeks: Math.max(1, Math.ceil(days / 7)), daysNeeded: days };
  }, [remainingLessons, minutesPerLesson, minutesPerDay]);

  const formatted = finishDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="rounded-2xl bg-card border border-border p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-accent-soft text-accent grid place-items-center shrink-0">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold tracking-tight">Calculadora de impacto</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Veja como pequenos minutos por dia mudam a sua data de chegada.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="impact-slider" className="text-muted-foreground">
            Estudo por dia
          </label>
          <span className="font-semibold text-foreground tabular-nums">{minutesPerDay} min</span>
        </div>
        <input
          id="impact-slider"
          type="range"
          min={5}
          max={120}
          step={5}
          value={minutesPerDay}
          onChange={(e) => setMinutesPerDay(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--color-primary)] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>5 min</span>
          <span>30 min</span>
          <span>1 h</span>
          <span>2 h</span>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-primary-soft/70 border border-primary/15 p-4">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary font-semibold">
          <Sparkles className="h-3 w-3" /> Sua nova projeção
        </div>
        {remainingLessons === 0 ? (
          <p className="mt-1 text-sm text-foreground">
            Você já concluiu tudo — sem mais contagens. Aproveite a conquista! 🎉
          </p>
        ) : (
          <p className="mt-1 text-sm text-foreground leading-relaxed break-words">
            Com <span className="font-semibold">{minutesPerDay} minutos por dia</span>, você termina em{" "}
            <span className="font-semibold text-primary">
              {weeks} {weeks === 1 ? "semana" : "semanas"}
            </span>
            {" "}— por volta de <span className="font-semibold">{formatted}</span>.
            <span className="block text-xs text-muted-foreground mt-1">
              {daysNeeded} {daysNeeded === 1 ? "dia" : "dias"} de estudo para fechar {remainingLessons} lições.
            </span>
          </p>
        )}
      </div>
    </section>
  );
}