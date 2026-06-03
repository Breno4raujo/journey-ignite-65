import { useCallback, useEffect, useState } from "react";
import type { Course, Module, PaceMode, ProgressSummary } from "@/lib/aprenderja/types";

interface UseDashboardOptions {
  userId: string | null;
  pace: PaceMode;
}

export function useDashboard({ userId, pace }: UseDashboardOptions) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modulesByCourse, setModulesByCourse] = useState<Record<string, Module[]>>({});
  const [summaries, setSummaries] = useState<ProgressSummary[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedPace, setSavedPace] = useState<PaceMode | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const [coursesRes, progressRes] = await Promise.all([
        fetch("/api/courses", { credentials: "include" }),
        fetch(`/api/progress/${userId}?pace=${pace}`, { credentials: "include" }),
      ]);

      if (!coursesRes.ok || !progressRes.ok) {
        throw new Error("Não foi possível carregar seus dados.");
      }

      const coursesData = await coursesRes.json();
      const progressData = await progressRes.json();

      const loadedCourses: Course[] = (coursesData.courses ?? []).map(
        (c: Course & { modules?: Module[] }) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          totalModules: c.totalModules,
        }),
      );

      const modulesMap: Record<string, Module[]> = {};
      for (const c of coursesData.courses ?? []) {
        modulesMap[c.id] = (c.modules ?? []).map((m: Module) => ({
          id: m.id,
          courseId: c.id,
          title: m.title,
          order: m.order,
          totalLessons: m.totalLessons,
        }));
      }

      setCourses(loadedCourses);
      setModulesByCourse(modulesMap);
      setSummaries(progressData.summaries ?? []);
      setPaused(progressData.profile?.pausedWeek ?? false);
      setActiveCourseId((prev) => prev ?? loadedCourses[0]?.id ?? null);

      const loadedPace = progressData.pace as PaceMode | undefined;
      if (loadedPace) setSavedPace(loadedPace);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, [userId, pace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const advanceLesson = useCallback(
    async (moduleId: string) => {
      const res = await fetch("/api/progress/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ moduleId }),
      });
      if (!res.ok) throw new Error("Erro ao registrar progresso.");
      const data = await res.json();
      await loadData();
      return data;
    },
    [loadData],
  );

  const updateProfile = useCallback(
    async (data: { pace?: PaceMode; pausedWeek?: boolean }) => {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (data.pausedWeek !== undefined) setPaused(data.pausedWeek);
    },
    [],
  );

  const activeSummary = summaries.find((s) => s.course.id === activeCourseId) ?? summaries[0] ?? null;

  return {
    courses,
    modulesByCourse,
    summaries,
    activeCourseId,
    setActiveCourseId,
    activeSummary,
    paused,
    loading,
    error,
    advanceLesson,
    updateProfile,
    reload: loadData,
    savedPace,
  };
}
