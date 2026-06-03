import { Heart, Sparkles, Trophy } from "lucide-react";
import type { Victory } from "@/lib/aprenderja/types";

interface Props { victories: Victory[] }

const ICON = {
  module: Trophy,
  milestone: Sparkles,
  badge: Heart,
} as const;

const getTimestamp = (date: string | Date | undefined) => {
  if (!date) return 0;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

function relTime(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff < 7) return `há ${diff} dias`;
  if (diff < 30) return `há ${Math.floor(diff / 7)} sem`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function VictoriesWall({ victories }: Props) {
  const sorted = [...victories].sort(
    (a, b) => getTimestamp(b.earnedAt) - getTimestamp(a.earnedAt),
  );
  return (
    <section className="rounded-2xl bg-card border border-border p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="font-semibold tracking-tight">Minhas vitórias</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Releia aqui nos dias difíceis. Você já provou que é capaz.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{sorted.length} guardadas</p>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground italic">
          Suas primeiras conquistas aparecerão aqui — toda mensagem de encorajamento fica guardada.
        </p>
      ) : (
        <ul className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
          {sorted.map((v) => {
            const Icon = ICON[v.kind];
            return (
              <li
                key={v.id}
                className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/60 p-3"
              >
                <div className="h-8 w-8 rounded-lg bg-accent-soft text-accent-foreground grid place-items-center shrink-0">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{v.title}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{relTime(v.earnedAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{v.message}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}