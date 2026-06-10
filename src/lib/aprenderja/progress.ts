import type {
  Course,
  Module,
  ModuleProgressView,
  PaceMode,
  ProgressSummary,
  SoftSkillBadge,
  StudyActivity,
  UserProgress,
  WeeklyEnergySummary,
} from "./types";

export const PACE_HOURS: Record<PaceMode, number> = {
  leve: 2,
  focado: 5,
  intenso: 10,
};

const HOURS_PER_LESSON = 0.5; // estimativa acolhedora: ~30min por lição

function buildModuleViews(modules: Module[], progress: UserProgress[]): ModuleProgressView[] {
  const byId = new Map(progress.map((p) => [p.moduleId, p]));
  return [...modules]
    .sort((a, b) => a.order - b.order)
    .map((m) => {
      const p = byId.get(m.id);
      const completed = Math.max(0, Math.min(m.totalLessons, p?.completedLessons ?? 0));
      const percent = m.totalLessons === 0 ? 0 : Math.round((completed / m.totalLessons) * 100);
      return {
        module: m,
        completedLessons: completed,
        percent,
        isCompleted: percent >= 100,
        lastAccessedAt: p?.lastAccessedAt ?? null,
      };
    });
}

function buildEncouragement(
  overall: number,
  lastCompletedTitle: string | null,
  courseTitle: string,
  remainingModules: number,
): string {
  if (overall >= 100) {
    return `Você conseguiu! Concluiu toda a sua jornada no curso ${courseTitle}. Olhe para trás e orgulhe-se de cada hora dedicada!`;
  }
  if (overall >= 75) {
    return "Reta final! Você construiu uma rotina incrível até aqui. Só mais um pouco para consolidar essa virada de carreira.";
  }
  if (overall >= 50) {
    return `Você já passou da metade do caminho! Faltam apenas ${remainingModules} módulos. Seu esforço está valendo a pena.`;
  }
  if (overall >= 25) {
    const name = lastCompletedTitle ?? "o primeiro módulo";
    return `O primeiro passo é o mais difícil, e você já deu! Módulo ${name} concluído com sucesso. Vamos para o próximo?`;
  }
  return "Toda jornada começa com um pequeno passo. Que tal 10 minutinhos hoje? A gente caminha com você.";
}

function estimateWeeksRemaining(
  views: ModuleProgressView[],
  progress: UserProgress[],
  paceHoursPerWeek: number,
): number {
  const totalLessons = views.reduce((s, v) => s + v.module.totalLessons, 0);
  const completedLessons = views.reduce((s, v) => s + v.completedLessons, 0);
  const remainingLessons = Math.max(0, totalLessons - completedLessons);
  if (remainingLessons === 0) return 0;

  // velocidade histórica baseada em módulos concluídos
  const completedProgress = progress.filter((p) => p.completedAt && p.lastAccessedAt);
  let hoursPerLesson = HOURS_PER_LESSON;
  if (completedProgress.length >= 1) {
    const totals = completedProgress.map((p) => {
      const ms = p.completedAt!.getTime() - p.lastAccessedAt!.getTime();
      const days = Math.max(1, Math.abs(ms) / (1000 * 60 * 60 * 24));
      // assume ~paceHoursPerWeek de estudo durante esse período
      const estimatedHours = (days / 7) * paceHoursPerWeek;
      const mod = views.find((v) => v.module.id === p.moduleId);
      const lessons = mod?.module.totalLessons ?? 1;
      return estimatedHours / Math.max(1, lessons);
    });
    const avg = totals.reduce((s, x) => s + x, 0) / totals.length;
    if (avg > 0.15 && avg < 3) hoursPerLesson = avg;
  }

  const remainingHours = remainingLessons * hoursPerLesson;
  const weeks = remainingHours / Math.max(1, paceHoursPerWeek);
  return Math.max(1, Math.ceil(weeks));
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function buildResumeContext(views: ModuleProgressView[]) {
  const inProgress = views
    .filter((v) => !v.isCompleted && v.completedLessons > 0 && v.lastAccessedAt)
    .sort((a, b) => b.lastAccessedAt!.getTime() - a.lastAccessedAt!.getTime())[0];
  if (!inProgress) return null;
  return {
    courseId: inProgress.module.courseId,
    moduleId: inProgress.module.id,
    moduleTitle: inProgress.module.title,
    lessonNumber: inProgress.completedLessons + 1,
    daysSince: daysBetween(new Date(), inProgress.lastAccessedAt!),
  };
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function summarizeActivities(activities: StudyActivity[], start: Date, end: Date) {
  const lessons = new Set<string>();
  const modules = new Set<string>();
  let seconds = 0;

  activities.forEach((activity) => {
    const createdAt = new Date(activity.createdAt);
    if (Number.isNaN(createdAt.getTime()) || createdAt < start || createdAt >= end) return;

    if (activity.kind === "time") {
      seconds += Math.max(0, activity.seconds ?? 0);
    }

    if (activity.kind === "lesson" && activity.lessonNumber !== undefined) {
      lessons.add(`${activity.moduleId}:${activity.lessonNumber}`);
    }

    if (activity.kind === "module") {
      modules.add(activity.moduleId);
    }
  });

  return {
    studiedMinutes: Math.round(seconds / 60),
    completedLessons: lessons.size,
    completedModules: modules.size,
  };
}

function percentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function buildWeeklyEnergy(
  views: ModuleProgressView[],
  activities: StudyActivity[],
  paceHoursPerWeek: number,
): WeeklyEnergySummary {
  const currentStart = startOfWeek(new Date());
  const currentEnd = addDays(currentStart, 7);
  const previousStart = addDays(currentStart, -7);

  const currentStats = summarizeActivities(activities, currentStart, currentEnd);
  const previousStats = summarizeActivities(activities, previousStart, currentStart);

  const weeklyGoalMinutes = paceHoursPerWeek * 60;
  const current = currentStats.studiedMinutes;
  const remainingMinutes = Math.max(0, weeklyGoalMinutes - current);

  const currentRhythm =
    currentStats.completedLessons + currentStats.completedModules || currentStats.studiedMinutes;
  const previousRhythm =
    previousStats.completedLessons + previousStats.completedModules || previousStats.studiedMinutes;
  const rhythmDeltaPercent = percentChange(currentRhythm, previousRhythm);

  const message =
    remainingMinutes > 0
      ? `Faltam ${remainingMinutes} ${remainingMinutes === 1 ? "minuto" : "minutos"} para fechar a semana.`
      : "Semana fechada. Você cumpriu sua meta semanal.";

  return {
    current,
    goal: weeklyGoalMinutes,
    studiedMinutes: currentStats.studiedMinutes,
    completedLessons: currentStats.completedLessons,
    completedModules: currentStats.completedModules,
    rhythmDeltaPercent,
    message,
  };
}

function buildBadges(
  progress: UserProgress[],
  overallPercent = 0,
  totalLessons = 0,
  completedLessons = 0,
): SoftSkillBadge[] {
  const accessed = progress.filter((p) => p.lastAccessedAt);
  const completedMods = progress.filter((p) => p.completedAt);

  const hasWeekend = accessed.some((p) => {
    const d = p.lastAccessedAt!.getDay();
    return d === 0 || d === 6;
  });
  const hasEarly = accessed.some((p) => p.lastAccessedAt!.getHours() < 8);
  const hasNight = accessed.some((p) => p.lastAccessedAt!.getHours() >= 22);
  const hasLunch = accessed.some((p) => {
    const h = p.lastAccessedAt!.getHours();
    return h >= 12 && h < 14;
  });
  const comeback = progress.some((p) => {
    if (!p.lastAccessedAt || !p.completedAt) return false;
    return daysBetween(p.lastAccessedAt, p.completedAt) >= 5;
  });
  const firstStep = completedLessons >= 1;
  const explorer = accessed.length >= 2;
  const consistency = completedMods.length >= 2;
  const finisher = completedMods.length >= 3;
  const marathon = completedMods.length >= 5;
  const quickWin = completedMods.some((p) => {
    if (!p.completedAt || !p.lastAccessedAt) return false;
    return daysBetween(p.completedAt, p.lastAccessedAt) <= 2;
  });
  const now = Date.now();
  const weekStreak = accessed.some((p) => (now - p.lastAccessedAt!.getTime()) / 86400000 <= 7);
  const monthIn = accessed.some((p) => (now - p.lastAccessedAt!.getTime()) / 86400000 >= 21);
  const focus = completedLessons >= 10;
  const curiosity = completedLessons >= 5;
  const courage = firstStep; // ter começado já é coragem
  const balance =
    hasWeekend &&
    accessed.some((p) => {
      const d = p.lastAccessedAt!.getDay();
      return d >= 1 && d <= 5;
    });
  const rebuild = comeback;
  const spark = completedLessons >= 3;
  const pace = completedMods.length >= 1;
  const deepDive = totalLessons > 0 && completedLessons / totalLessons >= 0.4;

  return [
    {
      id: "firstStep",
      icon: "firstStep",
      label: "Primeiro Passo",
      description: "Concluiu sua primeira lição.",
      earned: firstStep,
    },
    {
      id: "courage",
      icon: "courage",
      label: "Coragem de Recomeçar",
      description: "Decidiu começar uma nova jornada.",
      earned: courage,
    },
    {
      id: "spark",
      icon: "spark",
      label: "Faísca Acesa",
      description: "Concluiu 3 lições — o ritmo está nascendo.",
      earned: spark,
    },
    {
      id: "curiosity",
      icon: "curiosity",
      label: "Curiosidade Ativa",
      description: "Concluiu 5 lições no seu tempo.",
      earned: curiosity,
    },
    {
      id: "focus",
      icon: "focus",
      label: "Foco de Adulto",
      description: "Concluiu 10 lições — disciplina real.",
      earned: focus,
    },
    {
      id: "explorer",
      icon: "explorer",
      label: "Explorador(a)",
      description: "Visitou mais de um módulo.",
      earned: explorer,
    },
    {
      id: "deepDive",
      icon: "deepDive",
      label: "Mergulho Profundo",
      description: "Passou de 40% do curso.",
      earned: deepDive,
    },
    {
      id: "halfway",
      icon: "halfway",
      label: "Travessia da Metade",
      description: "Atingiu 50% do curso.",
      earned: overallPercent >= 50,
    },
    {
      id: "milestone25",
      icon: "milestone25",
      label: "Primeiro Quarto",
      description: "Conquistou 25% da jornada.",
      earned: overallPercent >= 25,
    },
    {
      id: "milestone50",
      icon: "milestone50",
      label: "Meio Caminho",
      description: "Conquistou 50% da jornada.",
      earned: overallPercent >= 50,
    },
    {
      id: "milestone75",
      icon: "milestone75",
      label: "Reta Final à Vista",
      description: "Conquistou 75% da jornada.",
      earned: overallPercent >= 75,
    },
    {
      id: "consistency",
      icon: "consistency",
      label: "Ritmo Próprio",
      description: "Concluiu 2 módulos no seu tempo.",
      earned: consistency,
    },
    {
      id: "finisher",
      icon: "finisher",
      label: "Acabador(a)",
      description: "Concluiu 3 módulos.",
      earned: finisher,
    },
    {
      id: "marathon",
      icon: "marathon",
      label: "Maratonista da Vida",
      description: "Concluiu 5 módulos — fôlego raro.",
      earned: marathon,
    },
    {
      id: "quickWin",
      icon: "quickWin",
      label: "Vitória Rápida",
      description: "Fechou um módulo em até 2 dias.",
      earned: quickWin,
    },
    {
      id: "pace",
      icon: "pace",
      label: "Ritmo Encontrado",
      description: "Fechou seu primeiro módulo.",
      earned: pace,
    },
    {
      id: "weekend",
      icon: "weekend",
      label: "Guerreiro de Fim de Semana",
      description: "Estudou em um sábado ou domingo.",
      earned: hasWeekend,
    },
    {
      id: "early",
      icon: "early",
      label: "Madrugador(a)",
      description: "Estudou antes das 8h da manhã.",
      earned: hasEarly,
    },
    {
      id: "nightOwl",
      icon: "nightOwl",
      label: "Coruja Noturna",
      description: "Estudou depois das 22h.",
      earned: hasNight,
    },
    {
      id: "lunchBreak",
      icon: "lunchBreak",
      label: "Hora do Almoço",
      description: "Estudou entre 12h e 14h.",
      earned: hasLunch,
    },
    {
      id: "balance",
      icon: "balance",
      label: "Equilíbrio",
      description: "Estudou tanto na semana quanto no fim de semana.",
      earned: balance,
    },
    {
      id: "weekStreak",
      icon: "weekStreak",
      label: "Semana Viva",
      description: "Estudou nos últimos 7 dias.",
      earned: weekStreak,
    },
    {
      id: "monthIn",
      icon: "monthIn",
      label: "Mês de Jornada",
      description: "Está nessa caminhada há 3+ semanas.",
      earned: monthIn,
    },
    {
      id: "comeback",
      icon: "comeback",
      label: "Persistência",
      description: "Voltou a estudar após uma pausa de 5+ dias.",
      earned: comeback,
    },
    {
      id: "rebuild",
      icon: "rebuild",
      label: "Recomeço Bonito",
      description: "Retomou os estudos depois de uma pausa.",
      earned: rebuild,
    },
  ];
}

export function computeProgressSummary(
  course: Course,
  modules: Module[],
  progress: UserProgress[],
  pace: PaceMode,
  activities: StudyActivity[] = [],
): ProgressSummary {
  const views = buildModuleViews(modules, progress);
  const totalLessons = views.reduce((s, v) => s + v.module.totalLessons, 0);
  const completedLessons = views.reduce((s, v) => s + v.completedLessons, 0);
  const overallPercent =
    totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  const remainingModules = views.filter((v) => !v.isCompleted).length;
  const lastCompleted = [...views].reverse().find((v) => v.isCompleted)?.module.title ?? null;
  const encouragement = buildEncouragement(
    overallPercent,
    lastCompleted,
    course.title,
    remainingModules,
  );

  const paceHoursPerWeek = PACE_HOURS[pace];
  const estimatedWeeksRemaining = estimateWeeksRemaining(views, progress, paceHoursPerWeek);

  return {
    course,
    overallPercent,
    totalLessons,
    completedLessons,
    modules: views,
    estimatedWeeksRemaining,
    pace,
    paceHoursPerWeek,
    encouragement,
    resumeContext: buildResumeContext(views),
    weeklyEnergy: buildWeeklyEnergy(views, activities, paceHoursPerWeek),
    badges: buildBadges(progress, overallPercent, totalLessons, completedLessons),
  };
}
