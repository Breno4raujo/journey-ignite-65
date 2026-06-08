import { Leaf, Target, Flame } from "lucide-react";
import type { PaceMode } from "@/lib/aprenderja/types";
import { PACE_HOURS } from "@/lib/aprenderja/progress";

interface Props {
  pace: PaceMode;
  onChange: (p: PaceMode) => void;
}

const OPTIONS: { value: PaceMode; label: string; title: string; icon: typeof Leaf; helper: string }[] = [
  { value: "leve", label: "Sem pressa", title: "Modo sem pressa", icon: Leaf, helper: "Semana corrida? Tudo bem." },
  { value: "focado", label: "Focado", title: "Modo focado", icon: Target, helper: "Equilíbrio saudável." },
  { value: "intenso", label: "Intenso", title: "Modo intenso", icon: Flame, helper: "Quero acelerar." },
];

export function PaceSelector({ pace, onChange }: Props) {
  const current = OPTIONS.find((o) => o.value === pace) ?? OPTIONS[1];

  return (
    <section className="rounded-2xl bg-card border border-border p-5 shadow-soft">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold tracking-tight">{current.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Você escolhe o ritmo — a estimativa se ajusta. Nenhuma cobrança.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Atual: <span className="font-medium text-foreground">{PACE_HOURS[pace]}h/semana</span>
        </p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => {
          const active = o.value === pace;
          const Icon = o.icon;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`text-left rounded-xl border p-3 transition-all ${
                active
                  ? "border-primary bg-primary-soft shadow-soft"
                  : "border-border hover:border-primary/30 bg-background"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <p
                className={`mt-2 text-xs sm:text-sm font-medium leading-tight ${active ? "text-primary" : "text-foreground"}`}
              >
                {o.label}
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {o.helper}
              </p>
              <p className="text-[10px] sm:text-[11px] font-medium mt-1.5 text-foreground/70">
                {PACE_HOURS[o.value]}h/sem
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
