import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/aprenderja/DashboardLayout";
import { DashboardSkeleton } from "@/components/aprenderja/DashboardSkeleton";
import { OverallProgressCard } from "@/components/aprenderja/OverallProgressCard";
import { ModuleList } from "@/components/aprenderja/ModuleList";
import { CelebrationModal } from "@/components/aprenderja/CelebrationModal";
import { ResumeCard } from "@/components/aprenderja/ResumeCard";
import { PaceSelector } from "@/components/aprenderja/PaceSelector";
import { BadgesShowcase } from "@/components/aprenderja/BadgesShowcase";
import { WeeklyEnergy } from "@/components/aprenderja/WeeklyEnergy";
import { MicroHabitCard } from "@/components/aprenderja/MicroHabitCard";
import { VictoriesWall } from "@/components/aprenderja/VictoriesWall";
import { ImpactCalculator } from "@/components/aprenderja/ImpactCalculator";
import { PauseWeek } from "@/components/aprenderja/PauseWeek";
import { CoursesManager } from "@/components/aprenderja/CoursesManager";
import { useAuth } from "@/frontend/context/AuthContext";
import { useDashboard } from "@/frontend/hooks/useDashboard";
import type { Course, Module, PaceMode, Victory } from "@/lib/aprenderja/types";

export const Route = createFileRoute("/")({
  component: Dashboard,
  ssr: false,
  beforeLoad: async () => {
    // Proteção client-side complementar — redirecionamento principal no componente
  },
  head: () => ({
    meta: [
      { title: "AprenderJá — Sua nova carreira, no seu ritmo" },
      {
        name: "description",
        content:
          "Plataforma de requalificação profissional para adultos. Aprenda no seu tempo, celebre cada conquista.",
      },
    ],
  }),
});

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [pace, setPace] = useState<PaceMode>("focado");
  const [paceInitialized, setPaceInitialized] = useState(false);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [victories, setVictories] = useState<Victory[]>([]);

  const {
    courses,
    modulesByCourse,
    activeCourseId,
    setActiveCourseId,
    activeSummary,
    paused,
    loading,
    error,
    advanceLesson,
    updateProfile,
    savedPace,
  } = useDashboard({ userId: user?.id ?? null, pace });

  useEffect(() => {
    if (savedPace && !paceInitialized) {
      setPace(savedPace);
      setPaceInitialized(true);
    }
  }, [savedPace, paceInitialized]);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login";
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user && pace && paceInitialized) {
      updateProfile({ pace });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pace, user?.id, paceInitialized]);

  useEffect(() => {
    if (!activeSummary) return;
    const seeded: Victory[] = activeSummary.modules
      .filter((m) => m.isCompleted)
      .map((m) => ({
        id: `seed-${m.module.id}`,
        kind: "module" as const,
        title: `Módulo conquistado: ${m.module.title}`,
        message: "Você concluiu este módulo no seu tempo. Esse passo ficou registrado.",
        earnedAt: m.lastAccessedAt ?? new Date(),
      }));
    if (activeSummary.overallPercent >= 25) {
      seeded.push({
        id: "seed-milestone",
        kind: "milestone",
        title: `Marco de ${activeSummary.overallPercent}% atingido`,
        message: activeSummary.encouragement,
        earnedAt: new Date(),
      });
    }
    setVictories(seeded);
  }, [activeCourseId, activeSummary]);

  const resumeOn = useMemo(() => {
    if (!paused) return null;
    const d = new Date();
    const day = d.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + daysUntilMonday);
    return d;
  }, [paused]);

  if (authLoading || !user) {
    return (
      <DashboardLayout userName="…" loading>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout userName={user.name}>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !activeSummary) {
    return (
      <DashboardLayout userName={user.name}>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {error ?? "Nenhum curso disponível no momento."}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const summary = activeSummary;
  const activeCourse = summary.course;
  const activeModules = modulesByCourse[activeCourse.id] ?? [];

  const remainingLessons = summary.totalLessons - summary.completedLessons;
  const minutesPerLessonFromPace =
    Math.round((summary.paceHoursPerWeek * 60) / Math.max(1, remainingLessons / 4)) || 30;

  const handleAdvance = async (moduleId: string) => {
    try {
      const result = await advanceLesson(moduleId);
      if (result.moduleCompleted) {
        setCelebrating(result.moduleTitle);
        setVictories((vs) => [
          ...vs,
          {
            id: `v-${moduleId}-${Date.now()}`,
            kind: "module",
            title: `Módulo conquistado: ${result.moduleTitle}`,
            message:
              "Que orgulho! Mais um passo firme na sua virada de carreira. Esse momento ficou guardado aqui.",
            earnedAt: new Date(),
          },
        ]);
      }
    } catch {
      // recarrega na próxima interação
    }
  };

  const handleResume = () => {
    const inProgress = summary.modules.find((m) => !m.isCompleted && m.completedLessons > 0);
    const target = inProgress ?? summary.modules.find((m) => !m.isCompleted);
    if (target) handleAdvance(target.module.id);
  };

  const handleAddCourse = (_course: Course, _mods: Module[]) => {
    // Cursos gerenciados pelo seed/admin — UI preservada para extensão futura
  };

  const handleRemoveCourse = (_courseId: string) => {
    // Remoção desabilitada em produção — dados vêm do banco
  };

  const handleTogglePause = async () => {
    const next = !paused;
    await updateProfile({ pausedWeek: next });
  };

  const currentInProgress =
    summary.modules.find((m) => !m.isCompleted && m.completedLessons > 0) ??
    summary.modules.find((m) => !m.isCompleted);

  return (
    <DashboardLayout userName={user.name}>
      <CoursesManager
        courses={courses}
        modulesByCourse={modulesByCourse}
        activeCourseId={activeCourse.id}
        onSelect={setActiveCourseId}
        onAdd={handleAddCourse}
        onRemove={handleRemoveCourse}
      />
      <OverallProgressCard summary={summary} />

      <PauseWeek paused={paused} resumeOn={resumeOn} onToggle={handleTogglePause} />

      <MicroHabitCard
        moduleTitle={currentInProgress?.module.title ?? null}
        lessonNumber={currentInProgress ? currentInProgress.completedLessons + 1 : null}
        minutesToday={Math.round((summary.paceHoursPerWeek * 60) / 7)}
        paused={paused}
        onStart={handleResume}
      />
      <ResumeCard context={summary.resumeContext} onResume={handleResume} />
      <div className="grid lg:grid-cols-2 gap-4">
        <PaceSelector pace={pace} onChange={setPace} />
        <WeeklyEnergy current={summary.weeklyEnergy.current} goal={summary.weeklyEnergy.goal} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <ImpactCalculator
          remainingLessons={remainingLessons}
          minutesPerLesson={Math.min(45, Math.max(15, minutesPerLessonFromPace))}
        />
        <VictoriesWall victories={victories} />
      </div>
      <ModuleList modules={summary.modules} onAdvance={handleAdvance} />
      <BadgesShowcase badges={summary.badges} />
      <CelebrationModal
        open={celebrating !== null}
        moduleTitle={celebrating}
        onClose={() => setCelebrating(null)}
      />
    </DashboardLayout>
  );
}