import { useCallback, useEffect, useMemo, useState } from "react";
import { mockCourse, mockModules, initialProgress } from "@/lib/aprenderja/mockData";
import { computeProgressSummary } from "@/lib/aprenderja/progress";
import type {
  Course,
  Module,
  PaceMode,
  StudyActivity,
  StudySession,
  UserProgress,
} from "@/lib/aprenderja/types";

interface UseDashboardOptions {
  userId: string | null;
  pace: PaceMode;
}

interface StoredProfile {
  pace?: PaceMode;
  pausedWeek?: boolean;
}

interface StoredDashboard {
  courses?: Course[];
  modulesByCourse?: Record<string, Module[]>;
  progress?: UserProgress[];
  activities?: StudyActivity[];
  studySessions?: Record<string, StudySession>;
  activeStudySessionId?: string | null;
  activeCourseId?: string;
  seenBadgeIds?: string[];
}

const profileKey = (userId: string) => `aprenderja:profile:${userId}`;
const dashboardKey = (userId: string) => `aprenderja:dashboard:${userId}`;

function readDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? null : date;
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

function normalizeProgress(progress: UserProgress[] | undefined, userId: string): UserProgress[] {
  if (!Array.isArray(progress)) return [];
  return progress.map((p) => ({
    ...p,
    userId,
    lastAccessedAt: readDate(p.lastAccessedAt),
    completedAt: readDate(p.completedAt),
  }));
}

function normalizeActivities(
  activities: StudyActivity[] | undefined,
  userId: string,
): StudyActivity[] {
  if (!Array.isArray(activities)) return [];
  return activities
    .map((a) => {
      const createdAt = readDate(a.createdAt);
      if (!createdAt) return null;
      return { ...a, userId, createdAt };
    })
    .filter(Boolean) as StudyActivity[];
}

function normalizeSessions(
  sessions: Record<string, StudySession> | undefined,
  userId: string,
): Record<string, StudySession> {
  if (!sessions || Array.isArray(sessions) || typeof sessions !== "object") return {};
  return Object.fromEntries(
    Object.entries(sessions)
      .map(([id, session]) => {
        const startedAt = readDate(session.startedAt);
        const updatedAt = readDate(session.updatedAt);
        if (!startedAt || !updatedAt) return null;
        return [
          id,
          {
            ...session,
            id,
            userId,
            durationMinutes: Math.max(1, Number(session.durationMinutes) || 5),
            remainingSeconds: Math.max(0, Number(session.remainingSeconds) || 0),
            notes: session.notes ?? "",
            startedAt,
            updatedAt,
          },
        ] as const;
      })
      .filter(Boolean) as Array<readonly [string, StudySession]>,
  );
}

function readDashboard(userId: string): StoredDashboard {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(dashboardKey(userId)) ?? "{}");
    return {
      ...raw,
      progress: normalizeProgress(raw.progress, userId),
      activities: normalizeActivities(raw.activities, userId),
      studySessions: normalizeSessions(raw.studySessions, userId),
      seenBadgeIds: Array.isArray(raw.seenBadgeIds) ? raw.seenBadgeIds : [],
    };
  } catch {
    return {};
  }
}

function writeDashboard(userId: string, dashboard: StoredDashboard) {
  localStorage.setItem(dashboardKey(userId), JSON.stringify(dashboard));
}

function mergeCourses(stored: Course[] | undefined): Course[] {
  const byId = new Map<string, Course>([[mockCourse.id, mockCourse]]);
  if (Array.isArray(stored)) {
    stored.forEach((course) => {
      if (course?.id && course.title) byId.set(course.id, course);
    });
  }
  return [...byId.values()];
}

function buildLessonTitles(module: Module): string[] {
  if (Array.isArray(module.lessons) && module.lessons.length > 0) {
    const cleaned = module.lessons.map((lesson) => lesson.trim()).filter(Boolean);
    if (cleaned.length >= module.totalLessons) return cleaned.slice(0, module.totalLessons);
    return [
      ...cleaned,
      ...Array.from(
        { length: module.totalLessons - cleaned.length },
        (_, i) => `${module.title} - parte ${cleaned.length + i + 1}`,
      ),
    ];
  }

  return Array.from({ length: module.totalLessons }, (_, i) => `${module.title} - parte ${i + 1}`);
}

function normalizeModule(module: Module): Module {
  const totalLessons = Math.max(1, Number(module.totalLessons) || 1);
  const normalized = {
    ...module,
    totalLessons,
  };
  return {
    ...normalized,
    lessons: buildLessonTitles(normalized),
  };
}

function normalizeModules(modules: Module[]): Module[] {
  return modules.map(normalizeModule).sort((a, b) => a.order - b.order);
}

function mergeModules(stored: Record<string, Module[]> | undefined): Record<string, Module[]> {
  const next: Record<string, Module[]> = { [mockCourse.id]: normalizeModules(mockModules) };
  if (stored && !Array.isArray(stored) && typeof stored === "object") {
    Object.entries(stored).forEach(([courseId, modules]) => {
      if (Array.isArray(modules)) next[courseId] = normalizeModules(modules);
    });
  }
  return next;
}

function allModules(modulesByCourse: Record<string, Module[]>): Module[] {
  return Object.values(modulesByCourse).flat();
}

function ensureProgressForModules(
  progress: UserProgress[],
  modulesByCourse: Record<string, Module[]>,
  userId: string,
): UserProgress[] {
  const modules = allModules(modulesByCourse);
  const moduleById = new Map(modules.map((m) => [m.id, m]));
  const byModule = new Map<string, UserProgress>();

  progress.forEach((p) => {
    const mod = moduleById.get(p.moduleId);
    if (!mod) return;
    byModule.set(p.moduleId, {
      ...p,
      userId,
      completedLessons: Math.max(0, Math.min(mod.totalLessons, Number(p.completedLessons) || 0)),
      lastAccessedAt: readDate(p.lastAccessedAt),
      completedAt: readDate(p.completedAt),
    });
  });

  modules.forEach((mod) => {
    if (byModule.has(mod.id)) return;
    byModule.set(mod.id, {
      id: `p-${userId}-${mod.id}`,
      userId,
      moduleId: mod.id,
      completedLessons: 0,
      lastAccessedAt: null,
      completedAt: null,
    });
  });

  return [...byModule.values()];
}

function findModule(modulesByCourse: Record<string, Module[]>, moduleId: string): Module | null {
  return allModules(modulesByCourse).find((mod) => mod.id === moduleId) ?? null;
}

function upsertProgress(
  progress: UserProgress[],
  userId: string,
  mod: Module,
  completedLessons: number,
  now: Date,
): UserProgress[] {
  const nextCompleted = Math.max(0, Math.min(mod.totalLessons, completedLessons));
  const existing = progress.find((p) => p.moduleId === mod.id);
  const nextProgress: UserProgress = {
    id: existing?.id ?? `p-${userId}-${mod.id}`,
    userId,
    moduleId: mod.id,
    completedLessons: nextCompleted,
    lastAccessedAt: now,
    completedAt: nextCompleted >= mod.totalLessons ? (existing?.completedAt ?? now) : null,
  };

  if (!existing) return [...progress, nextProgress];
  return progress.map((p) => (p.moduleId === mod.id ? nextProgress : p));
}

function buildLessonActivities(
  userId: string,
  courseId: string,
  moduleId: string,
  fromLesson: number,
  toLesson: number,
  now: Date,
): StudyActivity[] {
  const items: StudyActivity[] = [];
  for (let lessonNumber = fromLesson; lessonNumber <= toLesson; lessonNumber += 1) {
    items.push({
      id: makeId("activity"),
      userId,
      courseId,
      moduleId,
      kind: "lesson",
      lessonNumber,
      createdAt: now,
    });
  }
  return items;
}

export function useDashboard({ userId, pace }: UseDashboardOptions) {
  const [courses, setCourses] = useState<Course[]>([mockCourse]);
  const [modulesByCourse, setModulesByCourse] = useState<Record<string, Module[]>>({
    [mockCourse.id]: mockModules,
  });
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [activities, setActivities] = useState<StudyActivity[]>([]);
  const [studySessions, setStudySessions] = useState<Record<string, StudySession>>({});
  const [activeStudySessionId, setActiveStudySessionId] = useState<string | null>(null);
  const [seenBadgeIds, setSeenBadgeIds] = useState<string[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>(mockCourse.id);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedPace, setSavedPace] = useState<PaceMode | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoaded(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const profile = readProfile(userId);
    const stored = readDashboard(userId);
    const nextCourses = mergeCourses(stored.courses);
    const nextModulesByCourse = mergeModules(stored.modulesByCourse);
    const defaultProgress = initialProgress.map((p) => ({ ...p, userId }));
    const nextProgress = ensureProgressForModules(
      [...defaultProgress, ...normalizeProgress(stored.progress, userId)],
      nextModulesByCourse,
      userId,
    );
    const nextActiveCourseId = nextCourses.some((course) => course.id === stored.activeCourseId)
      ? stored.activeCourseId!
      : mockCourse.id;

    setPaused(profile.pausedWeek ?? false);
    setSavedPace(profile.pace ?? null);
    setCourses(nextCourses);
    setModulesByCourse(nextModulesByCourse);
    setProgress(nextProgress);
    setActivities(normalizeActivities(stored.activities, userId));
    setStudySessions(normalizeSessions(stored.studySessions, userId));
    setActiveStudySessionId(stored.activeStudySessionId ?? null);
    setSeenBadgeIds(stored.seenBadgeIds ?? []);
    setActiveCourseId(nextActiveCourseId);
    setLoaded(true);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId || !loaded) return;
    writeDashboard(userId, {
      courses,
      modulesByCourse,
      progress,
      activities,
      studySessions,
      activeStudySessionId,
      activeCourseId,
      seenBadgeIds,
    });
  }, [
    userId,
    loaded,
    courses,
    modulesByCourse,
    progress,
    activities,
    studySessions,
    activeStudySessionId,
    activeCourseId,
    seenBadgeIds,
  ]);

  const activeCourse = useMemo(
    () => courses.find((course) => course.id === activeCourseId) ?? courses[0] ?? mockCourse,
    [activeCourseId, courses],
  );

  const activeModules = useMemo(
    () => modulesByCourse[activeCourse.id] ?? [],
    [activeCourse.id, modulesByCourse],
  );

  const activeModuleIds = useMemo(
    () => new Set(activeModules.map((mod) => mod.id)),
    [activeModules],
  );

  const activeProgress = useMemo(
    () => progress.filter((p) => activeModuleIds.has(p.moduleId)),
    [activeModuleIds, progress],
  );

  const activeActivities = useMemo(
    () => activities.filter((activity) => activity.courseId === activeCourse.id),
    [activeCourse.id, activities],
  );

  const summary = useMemo(
    () =>
      computeProgressSummary(activeCourse, activeModules, activeProgress, pace, activeActivities),
    [activeActivities, activeCourse, activeModules, activeProgress, pace],
  );

  const activeStudySession = useMemo(() => {
    if (!activeStudySessionId) return null;
    return studySessions[activeStudySessionId] ?? null;
  }, [activeStudySessionId, studySessions]);

  const addCourse = useCallback(
    (course: Course, modules: Module[]) => {
      if (!userId) return;
      const normalizedModules = normalizeModules(modules);
      setCourses((prev) => (prev.some((c) => c.id === course.id) ? prev : [...prev, course]));
      setModulesByCourse((prev) => ({ ...prev, [course.id]: normalizedModules }));
      setProgress((prev) => [
        ...prev,
        ...normalizedModules.map((mod) => ({
          id: `p-${userId}-${mod.id}`,
          userId,
          moduleId: mod.id,
          completedLessons: 0,
          lastAccessedAt: null,
          completedAt: null,
        })),
      ]);
      setActiveCourseId(course.id);
    },
    [userId],
  );

  const editCourse = useCallback(
    (courseId: string, patch: Pick<Course, "title" | "description">) => {
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? {
                ...course,
                title: patch.title.trim() || course.title,
                description: patch.description.trim() || course.description,
              }
            : course,
        ),
      );
    },
    [],
  );

  const removeCourse = useCallback(
    (courseId: string) => {
      const moduleIds = new Set((modulesByCourse[courseId] ?? []).map((mod) => mod.id));
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      setModulesByCourse((prev) => {
        const next = { ...prev };
        delete next[courseId];
        return next;
      });
      setProgress((prev) => prev.filter((p) => !moduleIds.has(p.moduleId)));
      setActivities((prev) => prev.filter((activity) => activity.courseId !== courseId));
      setStudySessions((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([, session]) => session.courseId !== courseId),
        ),
      );
      setActiveStudySessionId((current) => {
        if (!current) return null;
        const session = studySessions[current];
        return session?.courseId === courseId ? null : current;
      });
      setActiveCourseId((current) => (current === courseId ? mockCourse.id : current));
    },
    [modulesByCourse, studySessions],
  );

  const editModule = useCallback(
    (
      moduleId: string,
      patch: {
        title: string;
        totalLessons: number;
        lessons: string[];
      },
    ) => {
      const totalLessons = Math.max(1, Number(patch.totalLessons) || 1);
      setModulesByCourse((prev) => {
        let changedCourseId: string | null = null;
        const next = Object.fromEntries(
          Object.entries(prev).map(([courseId, modules]) => [
            courseId,
            modules.map((mod) => {
              if (mod.id !== moduleId) return mod;
              changedCourseId = courseId;
              return normalizeModule({
                ...mod,
                title: patch.title.trim() || mod.title,
                totalLessons,
                lessons: patch.lessons,
              });
            }),
          ]),
        );

        if (!changedCourseId) return prev;
        return next;
      });
      setProgress((prev) =>
        prev.map((item) => {
          if (item.moduleId !== moduleId) return item;
          const completedLessons = Math.min(item.completedLessons, totalLessons);
          return {
            ...item,
            completedLessons,
            completedAt: completedLessons >= totalLessons ? (item.completedAt ?? new Date()) : null,
          };
        }),
      );
      setActivities((prev) =>
        prev.filter((activity) => {
          if (activity.moduleId !== moduleId || activity.kind !== "lesson") return true;
          return (activity.lessonNumber ?? 0) <= totalLessons;
        }),
      );
    },
    [],
  );

  const deleteModule = useCallback(
    (moduleId: string) => {
      const mod = findModule(modulesByCourse, moduleId);
      if (!mod) return;

      setModulesByCourse((prev) => {
        const modules = prev[mod.courseId] ?? [];
        const filtered = modules
          .filter((item) => item.id !== moduleId)
          .map((item, index) => ({ ...item, order: index + 1 }));
        return { ...prev, [mod.courseId]: filtered };
      });
      setCourses((prev) =>
        prev.map((course) =>
          course.id === mod.courseId
            ? {
                ...course,
                totalModules: Math.max(0, (modulesByCourse[mod.courseId] ?? []).length - 1),
              }
            : course,
        ),
      );
      setProgress((prev) => prev.filter((item) => item.moduleId !== moduleId));
      setActivities((prev) => prev.filter((activity) => activity.moduleId !== moduleId));
      setStudySessions((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([, session]) => session.moduleId !== moduleId),
        ),
      );
      setActiveStudySessionId((current) => {
        if (!current) return null;
        return studySessions[current]?.moduleId === moduleId ? null : current;
      });
    },
    [modulesByCourse, studySessions],
  );

  const setModuleCompletedLessons = useCallback(
    (moduleId: string, completedLessons: number) => {
      if (!userId) throw new Error("Sem usuário ativo.");
      const mod = findModule(modulesByCourse, moduleId);
      if (!mod) throw new Error("Módulo não encontrado.");

      const now = new Date();
      const existing = progress.find((p) => p.moduleId === moduleId);
      const previousCompleted = Math.max(
        0,
        Math.min(mod.totalLessons, existing?.completedLessons ?? 0),
      );
      const nextCompleted = Math.max(0, Math.min(mod.totalLessons, completedLessons));
      const moduleCompleted =
        nextCompleted >= mod.totalLessons && previousCompleted < mod.totalLessons;
      const moduleUncompleted =
        nextCompleted < mod.totalLessons && previousCompleted >= mod.totalLessons;

      setProgress((prev) => upsertProgress(prev, userId, mod, nextCompleted, now));

      setActivities((prev) => {
        let next = prev;

        if (nextCompleted < previousCompleted) {
          next = next.filter((activity) => {
            if (activity.moduleId !== moduleId) return true;
            if (activity.kind === "module") return false;
            if (activity.kind !== "lesson") return true;
            return (activity.lessonNumber ?? 0) <= nextCompleted;
          });
        }

        if (nextCompleted > previousCompleted) {
          const additions = buildLessonActivities(
            userId,
            mod.courseId,
            moduleId,
            previousCompleted + 1,
            nextCompleted,
            now,
          );
          const addedKeys = new Set(additions.map((a) => `${a.moduleId}:${a.lessonNumber}`));
          next = [
            ...next.filter((activity) => {
              if (activity.kind !== "lesson") return true;
              return !addedKeys.has(`${activity.moduleId}:${activity.lessonNumber}`);
            }),
            ...additions,
          ];
        }

        if (moduleCompleted) {
          next = [
            ...next.filter(
              (activity) => !(activity.kind === "module" && activity.moduleId === moduleId),
            ),
            {
              id: makeId("activity"),
              userId,
              courseId: mod.courseId,
              moduleId,
              kind: "module",
              createdAt: now,
            },
          ];
        }

        if (moduleUncompleted) {
          next = next.filter(
            (activity) => !(activity.kind === "module" && activity.moduleId === moduleId),
          );
        }

        return next;
      });

      return { moduleCompleted, moduleTitle: mod.title };
    },
    [modulesByCourse, progress, userId],
  );

  const advanceLesson = useCallback(
    async (moduleId: string) => {
      const mod = findModule(modulesByCourse, moduleId);
      if (!mod) throw new Error("Módulo não encontrado.");
      const existing = progress.find((p) => p.moduleId === moduleId);
      const previousCompleted = existing?.completedLessons ?? 0;
      return setModuleCompletedLessons(moduleId, previousCompleted + 1);
    },
    [modulesByCourse, progress, setModuleCompletedLessons],
  );

  const startStudySession = useCallback(
    (moduleId: string, durationMinutes = 5) => {
      if (!userId) return;
      const mod = findModule(modulesByCourse, moduleId);
      if (!mod) return;
      const now = new Date();
      const minutes = Math.max(1, Math.min(120, durationMinutes));
      const existing = Object.values(studySessions).find(
        (session) => session.moduleId === moduleId,
      );
      const session: StudySession = existing
        ? {
            ...existing,
            remainingSeconds:
              existing.remainingSeconds > 0 ? existing.remainingSeconds : minutes * 60,
            updatedAt: now,
          }
        : {
            id: makeId("session"),
            userId,
            courseId: mod.courseId,
            moduleId,
            durationMinutes: minutes,
            remainingSeconds: minutes * 60,
            notes: "",
            startedAt: now,
            updatedAt: now,
          };

      setStudySessions((prev) => ({ ...prev, [session.id]: session }));
      setActiveStudySessionId(session.id);
      setActiveCourseId(mod.courseId);
    },
    [modulesByCourse, studySessions, userId],
  );

  const updateStudySession = useCallback((sessionId: string, patch: Partial<StudySession>) => {
    setStudySessions((prev) => {
      const current = prev[sessionId];
      if (!current) return prev;
      return {
        ...prev,
        [sessionId]: {
          ...current,
          ...patch,
          updatedAt: new Date(),
        },
      };
    });
  }, []);

  const recordStudyTime = useCallback(
    (moduleId: string, seconds: number) => {
      if (!userId || seconds < 1) return;
      const mod = findModule(modulesByCourse, moduleId);
      if (!mod) return;
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      setActivities((prev) => {
        const existing = [...prev]
          .reverse()
          .find(
            (activity) =>
              activity.kind === "time" &&
              activity.moduleId === moduleId &&
              new Date(activity.createdAt).toISOString().slice(0, 10) === today,
          );

        if (existing) {
          return prev.map((activity) =>
            activity.id === existing.id
              ? {
                  ...activity,
                  seconds: (activity.seconds ?? 0) + Math.floor(seconds),
                  createdAt: now,
                }
              : activity,
          );
        }

        return [
          ...prev,
          {
            id: makeId("activity"),
            userId,
            courseId: mod.courseId,
            moduleId,
            kind: "time",
            seconds: Math.floor(seconds),
            createdAt: now,
          },
        ];
      });
    },
    [modulesByCourse, userId],
  );

  const markBadgeSeen = useCallback((badgeId: string) => {
    setSeenBadgeIds((prev) => (prev.includes(badgeId) ? prev : [...prev, badgeId]));
  }, []);

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
    reload: async () => {},
    savedPace,
  };
}
