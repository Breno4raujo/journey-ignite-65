import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/aprenderja/DashboardLayout";
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
import { mockCourse, mockModules, mockUser, initialProgress } from "@/lib/aprenderja/mockData";
import { computeProgressSummary } from "@/lib/aprenderja/progress";
import type { Course, Module, PaceMode, UserProgress, Victory } from "@/lib/aprenderja/types";

export const Route = createFileRoute("/")({
  component: Dashboard,
  ssr: false,
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
  // Proteção de rota — redireciona para /login se não tiver token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  const [courses, setCourses] = useState<Course[]>([mockCourse]);
  const [modulesByCourse, setModulesByCourse] = useState<Record<string, Module[]>>({
    [mockCourse.id]: mockModules,
  });
  const [progressByCourse, setProgressByCourse] = useState<Record<string, UserProgress[]>>({
    [mockCourse.id]: initialProgress,
  });
  const [activeCourseId, setActiveCourseId] = useState<string>(mockCourse.id);
  const [pace, setPace] = useState<PaceMode>("focado");
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [victories, setVictories] = useState<Victory[]>([]);

  const activeCourse = courses.find((c) => c.id === activeCourseId) ?? courses[0];
  const activeModules = modulesByCourse[activeCourse.id] ?? [];
  const progress = progressByCourse[activeCourse.id] ?? [];

  const summary = useMemo(
    () => computeProgressSummary(activeCourse, activeModules, progress, pace),
    [activeCourse, activeModules, progress, pace],
  );

  useEffect(() => {
    const seeded: Victory[] = summary.modules
      .filter((m) => m.isCompleted)
      .map((m) => ({
        id: `seed-${m.module.id}`,
        kind: "module" as const,
        title: `Módulo conquistado: ${m.module.title}`,
        message: "Você concluiu este módulo no seu tempo. Esse passo ficou registrado.",
        earnedAt: m.lastAccessedAt ?? new Date(),
      }));
    if (summary.overallPercent >= 25) {
      seeded.push({
        id: "seed-milestone",
        kind: "milestone",
        title: `Marco de ${summary.overallPercent}% atingido`,
        message: summary.encouragement,
        earnedAt: new Date(),
      });
    }
    setVictories(seeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourseId]);

  const resumeOn = useMemo(() => {
    if (!paused) return null;
    const d = new Date();
    const day = d.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + daysUntilMonday);
    return d;
  }, [paused]);

  const remainingLessons = summary.totalLessons - summary.completedLessons;
  const minutesPerLessonFromPace =
    Math.round((summary.paceHoursPerWeek * 60) / Math.max(1, remainingLessons / 4)) || 30;

  const handleAdvance = (moduleId: string) => {
    const prevPercent = summary.overallPercent;
    setProgressByCourse((all) => {
      const prev = all[activeCourse.id] ?? [];
      const next = prev.map((p) => ({ ...p }));
      const mod = activeModules.find((m) => m.id === moduleId);
      const entry = next.find((p) => p.moduleId === moduleId);
      if (!mod || !entry) return all;
      if (entry.completedLessons >= mod.totalLessons) return all;
      entry.completedLessons += 1;
      entry.lastAccessedAt = new Date();
      if (entry.completedLessons >= mod.totalLessons) {
        entry.completedAt = new Date();
        setCelebrating(mod.title);
        setVictories((vs) => [
          ...vs,
          {
            id: `v-${mod.id}-${Date.now()}`,
            kind: "module",
            title: `Módulo conquistado: ${mod.title}`,
            message:
              "Que orgulho! Mais um passo firme na sua virada de carreira. Esse momento ficou guardado aqui.",
            earnedAt: new Date(),
          },
        ]);
      }
      return { ...all, [activeCourse.id]: next };
    });
    setTimeout(() => {
      const newProgress = progress.map((p) =>
        p.moduleId === moduleId
          ? {
              ...p,
              completedLessons: Math.min(
                (p.completedLessons || 0) + 1,
                activeModules.find((m) => m.id === moduleId)?.totalLessons ?? 0,
              ),
            }
          : p,
      );
      const newSummary = computeProgressSummary(activeCourse, activeModules, newProgress, pace);
      const newPercent = newSummary.overallPercent;
      const crossed = [25, 50, 75, 100].find((m) => prevPercent < m && newPercent >= m);
      if (crossed) {
        setVictories((vs) => [
          ...vs,
          {
            id: `m-${crossed}-${Date.now()}`,
            kind: "milestone",
            title: `Marco de ${crossed}% conquistado`,
            message: newSummary.encouragement,
            earnedAt: new Date(),
          },
        ]);
      }
    }, 0);
  };

  const handleResume = () => {
    const inProgress = summary.modules.find((m) => !m.isCompleted && m.completedLessons > 0);
    if (inProgress) handleAdvance(inProgress.module.id);
  };

  const handleAddCourse = (course: Course, mods: Module[]) => {
    setCourses((cs) => [...cs, course]);
    setModulesByCourse((m) => ({ ...m, [course.id]: mods }));
    setProgressByCourse((p) => ({
      ...p,
      [course.id]: mods.map((mod) => ({
        id: `p-${mod.id}`,
        userId: mockUser.id,
        moduleId: mod.id,
        completedLessons: 0,
        lastAccessedAt: null,
        completedAt: null,
      })),
    }));
    setActiveCourseId(course.id);
  };

  const handleRemoveCourse = (courseId: string) => {
    if (courses.length <= 1) return;
    setCourses((cs) => cs.filter((c) => c.id !== courseId));
    setModulesByCourse(({ [courseId]: _m, ...rest }) => rest);
    setProgressByCourse(({ [courseId]: _p, ...rest }) => rest);
    if (activeCourseId === courseId) {
      const next = courses.find((c) => c.id !== courseId);
      if (next) setActiveCourseId(next.id);
    }
  };

  const currentInProgress =
    summary.modules.find((m) => !m.isCompleted && m.completedLessons > 0) ??
    summary.modules.find((m) => !m.isCompleted);

  return (
    <DashboardLayout userName={mockUser.name}>
      <CoursesManager
        courses={courses}
        modulesByCourse={modulesByCourse}
        activeCourseId={activeCourse.id}
        onSelect={setActiveCourseId}
        onAdd={handleAddCourse}
        onRemove={handleRemoveCourse}
      />
      <OverallProgressCard summary={summary} />
      <PauseWeek paused={paused} resumeOn={resumeOn} onToggle={() => setPaused((p) => !p)} />
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