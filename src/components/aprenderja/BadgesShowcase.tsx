import {
  Sun,
  Moon,
  Heart,
  Trophy,
  Lock,
  Footprints,
  Coffee,
  Compass,
  Flag,
  Medal,
  Rocket,
  Zap,
  CalendarCheck,
  CalendarDays,
  Target,
  Sparkles,
  Shield,
  Scale,
  RefreshCw,
  Flame,
  Gauge,
  BookOpen,
  Star,
} from "lucide-react";
import type { BadgeIcon, SoftSkillBadge } from "@/lib/aprenderja/types";

const ICONS: Record<BadgeIcon, React.ComponentType<{ className?: string }>> = {
  weekend: Sun,
  early: Moon,
  comeback: Heart,
  consistency: Trophy,
  firstStep: Footprints,
  nightOwl: Moon,
  lunchBreak: Coffee,
  explorer: Compass,
  halfway: Flag,
  finisher: Medal,
  marathon: Rocket,
  quickWin: Zap,
  weekStreak: CalendarCheck,
  monthIn: CalendarDays,
  focus: Target,
  curiosity: Sparkles,
  courage: Shield,
  balance: Scale,
  rebuild: RefreshCw,
  spark: Flame,
  pace: Gauge,
  deepDive: BookOpen,
  milestone25: Star,
  milestone50: Star,
  milestone75: Star,
};

interface Props {
  badges: SoftSkillBadge[];
  seenBadgeIds: string[];
  onBadgeClick: (badge: SoftSkillBadge) => void;
}

export function BadgesShowcase({ badges, seenBadgeIds, onBadgeClick }: Props) {
  return (
    <section className="rounded-2xl bg-card border border-border p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="font-semibold tracking-tight">Conquistas invisíveis</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Reconhecimento pelo esforço real — não só pela nota.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {badges.filter((b) => b.earned).length}/{badges.length}
        </p>
      </div>
      <ul className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {badges.map((b) => {
          const Icon = ICONS[b.icon];
          const seen = seenBadgeIds.includes(b.id);
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => b.earned && onBadgeClick(b)}
                disabled={!b.earned}
                aria-disabled={!b.earned}
                className={`w-full rounded-xl border p-3 text-center transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  b.earned
                    ? seen
                      ? "border-accent/40 bg-accent-soft/50 hover:border-primary/30"
                      : "border-accent bg-accent-soft/70 shadow-soft hover:border-primary/30"
                    : "border-dashed border-border bg-background/60 opacity-70 cursor-not-allowed"
                }`}
              >
                <div
                  className={`mx-auto h-9 w-9 rounded-full grid place-items-center ${
                    b.earned ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {b.earned ? <Icon className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                </div>
                <p className="mt-2 text-xs font-medium leading-tight">{b.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                  {b.description}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
