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

const profileKey = (userId: string) => `aprenderja:profile:${userId}`;

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

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function useDashboard({ userId, pace }: UseDashboardOptions) {
  const [courses] = useState<Course[]>([mockCourse]);
  const [modulesByCourse] = useState<Record<string, Module[]>>({
    [mockCourse.id]: mockModules,
  });
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>(mockCourse.id);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedPace, setSavedPace] = useState<PaceMode | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    const token = getToken();
    const prof = readProfile(userId);
    setPaused(prof.pausedWeek ?? false);
    if (prof.pace) setSavedPace(prof.pace);

    // Tenta buscar progresso real da API
    if (token) {
      fetch(`/api/progress/${userId}?pace=${pace}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.summaries?.[0]?.modules) {
            // Mapeia o progresso da API para o formato local
            const apiProgress: UserProgress[] = data.summaries[0].modules.map(
              (m: { module: { id: string }; completedLessons: number; lastAccessedAt: string | null; isCompleted: boolean }) => ({
                id: `p-${m.module.id}`,
                userId,
                moduleId: m.module.id,
                completedLessons: m.completedLessons,
                lastAccessedAt: m.lastAccessedAt ? new Date(m.lastAccessedAt) : null,
                completedAt: m.isCompleted ? new Date() : null,
              }),
            );
            setProgress(apiProgress);
          } else {
            // Fallback para mock se API não retornar dados
            setProgress(initialProgress.map((p) => ({ ...p, userId })));
          }
        })
        .catch(() => {
          // Se banco offline, usa mock
          setProgress(initialProgress.map((p) => ({ ...p, userId })));
        })
        .finally(() => setLoading(false));
    } else {
      setProgress(initialProgress.map((p) => ({ ...p, userId })));
      setLoading(false);
    }
  }, [userId, pace]);

  const summary = useMemo(
    () => computeProgressSummary(mockCourse, mockModules, progress, pace),
    [progress, pace],
  );

  const advanceLesson = useCallback(
    async (moduleId: string) => {
      if (!userId) throw new Error("Sem usuário ativo.");
      const mod = mockModules.find((m) => m.id === moduleId);
      if (!mod) throw new Error("Módulo não encontrado.");

      const token = getToken();

      // Tenta registrar na API
      if (token) {
        try {
          const res = await fetch("/api/progress/lesson", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ moduleId }),
          });
          if (res.ok) {
            const data = await res.json();
            // Atualiza progresso local com resposta da API
            setProgress((prev) =>
              prev.map((p) =>
                p.moduleId === moduleId
                  ? {
                      ...p,
                      completedLessons: data.lessonNumber,
                      lastAccessedAt: new Date(),
                      completedAt: data.moduleCompleted ? new Date() : p.completedAt,
                    }
                  : p,
              ),
            );
            return { moduleCompleted: data.moduleCompleted, moduleTitle: data.moduleTitle };
          }
        } catch {
          // Se falhar, continua com lógica local
        }
      }

      // Fallback local
      let moduleCompleted = false;
      const now = new Date();
      setProgress((prev) =>
        prev.map((p) => {
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
        }),
      );

      return { moduleCompleted, moduleTitle: mod.title };
    },
    [userId],
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
    error,
    advanceLesson,
    updateProfile,
    reload: async () => {},
    savedPace,
  };
}