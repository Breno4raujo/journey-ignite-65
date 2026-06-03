import { useCallback, useEffect, useMemo, useState } from "react";
import { mockCourse, mockModules, initialProgress } from "@/lib/aprenderja/mockData";
import { computeProgressSummary } from "@/lib/aprenderja/progress";
import type { Course, Module, PaceMode, UserProgress } from "@/lib/aprenderja/types";

interface UseDashboardOptions {
  userId: string | null;
  pace: PaceMode;
}

interface StoredProfile {
  pace?: PaceMode;
  pausedWeek?: boolean;
}

interface StoredProgress {
  moduleId: string;
  completedLessons: number;
  lastAccessedAt: string | null;
  completedAt: string | null;
}

const progressKey = (userId: string) => `aprenderja:progress:${userId}`;
const profileKey = (userId: string) => `aprenderja:profile:${userId}`;

function readProgress(userId: string): UserProgress[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(progressKey(userId));
  if (!raw) {
    const seed = initialProgress.map((p) => ({ ...p, userId }));
    return seed;
  }
  try {
    const parsed: StoredProgress[] = JSON.parse(raw);
    return parsed.map((p, i) => ({
      id: `p-${i}`,
      userId,
      moduleId: p.moduleId,
      completedLessons: p.completedLessons,
      lastAccessedAt: p.lastAccessedAt ? new Date(p.lastAccessedAt) : null,
      completedAt: p.completedAt ? new Date(p.completedAt) : null,
    }));
  } catch {
    return initialProgress.map((p) => ({ ...p, userId }));
  }
}

function writeProgress(userId: string, progress: UserProgress[]) {
  const serialized: StoredProgress[] = progress.map((p) => ({
    moduleId: p.moduleId,
    completedLessons: p.completedLessons,
    lastAccessedAt: p.lastAccessedAt ? p.lastAccessedAt.toISOString() : null,
    completedAt: p.completedAt ? p.completedAt.toISOString() : null,
  }));
  localStorage.setItem(progressKey(userId), JSON.stringify(serialized));
}

function readProfile(userId: string): StoredProfile {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(profileKey(userId)) ?? "{}");
  } catch {
    return {};
  }
}

function writeProfile(userId: string, profile: StoredProfile) {
  localStorage.setItem(profileKey(userId), JSON.stringify(profile));
}

export function useDashboard({ userId, pace }: UseDashboardOptions) {
  const courses: Course[] = useMemo(() => [mockCourse], []);
  const modulesByCourse: Record<string, Module[]> = useMemo(
    () => ({ [mockCourse.id]: mockModules }),
    [],
  );

  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(mockCourse.id);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedPace, setSavedPace] = useState<PaceMode | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const p = readProgress(userId);
    const prof = readProfile(userId);
    setProgress(p);
    setPaused(prof.pausedWeek ?? false);
    if (prof.pace) setSavedPace(prof.pace);
    setLoading(false);
  }, [userId]);

  const summary = useMemo(
    () => computeProgressSummary(mockCourse, mockModules, progress, pace),
    [progress, pace],
  );

  const advanceLesson = useCallback(
    async (moduleId: string) => {
      if (!userId) throw new Error("Sem usuário ativo.");
      const mod = mockModules.find((m) => m.id === moduleId);
      if (!mod) throw new Error("Módulo não encontrado.");
      let moduleCompleted = false;
      const now = new Date();
      const next = progress.map((p) => {
        if (p.moduleId !== moduleId) return p;
        const completedLessons = Math.min(mod.totalLessons, p.completedLessons + 1);
        const isDone = completedLessons >= mod.totalLessons;
        if (isDone && !p.completedAt) moduleCompleted = true;
        return {
          ...p,
          completedLessons,
          lastAccessedAt: now,
          completedAt: isDone ? p.completedAt ?? now : p.completedAt,
        };
      });
      setProgress(next);
      writeProgress(userId, next);
      return { moduleCompleted, moduleTitle: mod.title };
    },
    [progress, userId],
  );

  const updateProfile = useCallback(
    async (data: { pace?: PaceMode; pausedWeek?: boolean }) => {
      if (!userId) return;
      const current = readProfile(userId);
      const next = { ...current, ...data };
      writeProfile(userId, next);
      if (data.pausedWeek !== undefined) setPaused(data.pausedWeek);
    },
    [userId],
  );

  return {
    courses,
    modulesByCourse,
    summaries: [summary],
    activeCourseId,
    setActiveCourseId,
    activeSummary: summary,
    paused,
    loading,
    error: null as string | null,
    advanceLesson,
    updateProfile,
    reload: async () => {
      if (userId) setProgress(readProgress(userId));
    },
    savedPace,
  };
}
