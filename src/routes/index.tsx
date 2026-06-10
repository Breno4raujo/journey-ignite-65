import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { StudySession } from "@/components/aprenderja/StudySession";
import { AchievementModal } from "@/components/aprenderja/AchievementModal";
import { useAuth } from "@/frontend/context/AuthContext";
import { useDashboard } from "@/frontend/hooks/useDashboard";
import type { Course, Module, PaceMode, SoftSkillBadge, Victory } from "@/lib/aprenderja/types";

export const Route = createFileRoute("/")({
  component: Dashboard,
  ssr: false,
  beforeLoad: async () => {
    // Proteção client-side complementar: o redirecionamento principal fica no componente.
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
  const [studyOpen, setStudyOpen] = useState(false);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [badgeModal, setBadgeModal] = useState<{
    badge: SoftSkillBadge;
    celebrate: boolean;
  } | null>(null);
  const [victories, setVictories] = useState<Victory[]>([]);
  const badgeWatchInitialized = useRef(false);
  const earnedBadgeIdsRef = useRef<Set<string>>(new Set());

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
    setModuleCompletedLessons,
    addCourse,
    editCourse,
    removeCourse,
    editModule,
    deleteModule,
    startStudySession,
    updateStudySession,
    recordStudyTime,
    activeStudySession,
    seenBadgeIds,
    markBadgeSeen,
    updateProfile,
    savedPace,
  } = useDashboard({ userId: user?.id ?? null, pace });

  const addVictory = useCallback((victory: Victory) => {
    setVictories((prev) => (prev.some((v) => v.id === victory.id) ? prev : [...prev, victory]));
  }, []);

  const addBadgeVictory = useCallback(
    (badge: SoftSkillBadge) => {
      addVictory({
        id: `badge-${badge.id}`,
        kind: "badge",
        title: `Conquista desbloqueada: ${badge.label}`,
        message: badge.description,
        earnedAt: new Date(),
      });
    },
    [addVictory],
  );

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
    setVictories((prev) => {
      const byId = new Map<string, Victory>();
      seeded.forEach((victory) => byId.set(victory.id, victory));
      prev.forEach((victory) => byId.set(victory.id, victory));
      return [...byId.values()];
    });
  }, [activeCourseId, activeSummary]);

  useEffect(() => {
    if (!activeSummary || badgeModal) return;
    const earnedBadges = activeSummary.badges.filter((badge) => badge.earned);
    const nextEarnedIds = new Set(earnedBadges.map((badge) => badge.id));

    if (!badgeWatchInitialized.current) {
      earnedBadgeIdsRef.current = nextEarnedIds;
      badgeWatchInitialized.current = true;
      return;
    }

    const nextBadge = earnedBadges.find(
      (badge) => !earnedBadgeIdsRef.current.has(badge.id) && !seenBadgeIds.includes(badge.id),
    );
    earnedBadgeIdsRef.current = nextEarnedIds;

    if (nextBadge) {
      setBadgeModal({ badge: nextBadge, celebrate: true });
      markBadgeSeen(nextBadge.id);
      addBadgeVictory(nextBadge);
    }
  }, [activeSummary, addBadgeVictory, badgeModal, markBadgeSeen, seenBadgeIds]);

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
  const remainingLessons = summary.totalLessons - summary.completedLessons;
  const minutesPerLessonFromPace =
    Math.round((summary.paceHoursPerWeek * 60) / Math.max(1, remainingLessons / 4)) || 30;

  const registerModuleCompletion = (
    moduleId: string,
    result: { moduleCompleted: boolean; moduleTitle: string },
  ) => {
    if (!result.moduleCompleted) return;
    setCelebrating(result.moduleTitle);
    addVictory({
      id: `v-${moduleId}-${Date.now()}`,
      kind: "module",
      title: `Módulo conquistado: ${result.moduleTitle}`,
      message:
        "Que orgulho! Mais um passo firme na sua virada de carreira. Esse momento ficou guardado aqui.",
      earnedAt: new Date(),
    });
  };

  const openStudySession = (moduleId: string, minutes = 5) => {
    startStudySession(moduleId, minutes);
    setStudyOpen(true);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const handleAdvance = async (moduleId: string) => {
    try {
      const result = await advanceLesson(moduleId);
      registerModuleCompletion(moduleId, result);
    } catch {
      // O estado local permanece intacto; a próxima interação recalcula o resumo.
    }
  };

  const handleToggleLesson = (moduleId: string, lessonNumber: number, checked: boolean) => {
    try {
      const result = setModuleCompletedLessons(moduleId, checked ? lessonNumber : lessonNumber - 1);
      registerModuleCompletion(moduleId, result);
    } catch {
      // Sem ação visual: o checklist continua refletindo o último estado consistente.
    }
  };

  const handleResume = () => {
    const targetModuleId =
      activeStudySession?.moduleId ??
      summary.resumeContext?.moduleId ??
      summary.modules.find((m) => !m.isCompleted && m.completedLessons > 0)?.module.id ??
      summary.modules.find((m) => !m.isCompleted)?.module.id;

    if (targetModuleId) openStudySession(targetModuleId, 5);
  };

  const handleAddCourse = (course: Course, mods: Module[]) => {
    addCourse(course, mods);
  };

  const handleEditCourse = (courseId: string, patch: Pick<Course, "title" | "description">) => {
    editCourse(courseId, patch);
  };

  const handleRemoveCourse = (courseId: string) => {
    removeCourse(courseId);
  };

  const handleTogglePause = async () => {
    const next = !paused;
    await updateProfile({ pausedWeek: next });
  };

  const handleBadgeClick = (badge: SoftSkillBadge) => {
    if (!badge.earned) return;
    setBadgeModal({ badge, celebrate: true });
    if (badge.earned) {
      markBadgeSeen(badge.id);
      if (!seenBadgeIds.includes(badge.id)) addBadgeVictory(badge);
    }
  };

  const currentInProgress =
    summary.modules.find((m) => !m.isCompleted && m.completedLessons > 0) ??
    summary.modules.find((m) => !m.isCompleted);

  const activeSessionModuleView = activeStudySession
    ? summary.modules.find((m) => m.module.id === activeStudySession.moduleId)
    : null;

  const overlays = (
    <>
      <CelebrationModal
        open={celebrating !== null}
        moduleTitle={celebrating}
        onClose={() => setCelebrating(null)}
      />
      <AchievementModal
        badge={badgeModal?.badge ?? null}
        celebrate={badgeModal?.celebrate ?? false}
        onClose={() => setBadgeModal(null)}
      />
    </>
  );

  if (studyOpen && activeStudySession && activeSessionModuleView) {
    return (
      <DashboardLayout userName={user.name}>
        <StudySession
          course={activeCourse}
          moduleView={activeSessionModuleView}
          session={activeStudySession}
          onBack={() => setStudyOpen(false)}
          onToggleLesson={handleToggleLesson}
          onUpdateSession={updateStudySession}
          onRecordStudyTime={recordStudyTime}
        />
        {overlays}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userName={user.name}>
      <CoursesManager
        courses={courses}
        modulesByCourse={modulesByCourse}
        activeCourseId={activeCourse.id}
        onSelect={setActiveCourseId}
        onAdd={handleAddCourse}
        onEdit={handleEditCourse}
        onRemove={handleRemoveCourse}
      />
      <OverallProgressCard summary={summary} />

      <PauseWeek paused={paused} resumeOn={resumeOn} onToggle={handleTogglePause} />

      <MicroHabitCard
        moduleTitle={currentInProgress?.module.title ?? null}
        lessonNumber={currentInProgress ? currentInProgress.completedLessons + 1 : null}
        minutesToday={Math.round((summary.paceHoursPerWeek * 60) / 7)}
        paused={paused}
        onStart={(minutes) => {
          if (currentInProgress) openStudySession(currentInProgress.module.id, minutes);
        }}
      />
      <ResumeCard context={summary.resumeContext} onResume={handleResume} />
      <div className="grid lg:grid-cols-2 gap-4">
        <PaceSelector pace={pace} onChange={setPace} />
        <WeeklyEnergy energy={summary.weeklyEnergy} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <ImpactCalculator
          remainingLessons={remainingLessons}
          minutesPerLesson={Math.min(45, Math.max(15, minutesPerLessonFromPace))}
        />
        <VictoriesWall victories={victories} />
      </div>
      <ModuleList
        modules={summary.modules}
        onAdvance={handleAdvance}
        onEdit={editModule}
        onDelete={deleteModule}
      />
      <BadgesShowcase
        badges={summary.badges}
        seenBadgeIds={seenBadgeIds}
        onBadgeClick={handleBadgeClick}
      />
      {overlays}
    </DashboardLayout>
  );
}
