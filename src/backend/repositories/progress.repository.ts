import { prisma } from "@/backend/lib/prisma";
import { computeProgressSummary } from "@/lib/aprenderja/progress";
import type { PaceMode } from "@/lib/aprenderja/types";

export const courseRepository = {
  findAllWithModules() {
    return prisma.course.findMany({
      include: { modules: { orderBy: { order: "asc" } } },
      orderBy: { title: "asc" },
    });
  },

  findByIdWithModules(courseId: string) {
    return prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { orderBy: { order: "asc" } } },
    });
  },
};

export const progressRepository = {
  findByUserAndModules(userId: string, moduleIds: string[]) {
    return prisma.userProgress.findMany({
      where: { userId, moduleId: { in: moduleIds } },
    });
  },

  findByUserAndModule(userId: string, moduleId: string) {
    return prisma.userProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });
  },

  advanceLesson(userId: string, moduleId: string, totalLessons: number) {
    const now = new Date();
    return prisma.userProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      create: {
        userId,
        moduleId,
        completedLessons: 1,
        lastAccessedAt: now,
        completedAt: totalLessons <= 1 ? now : null,
      },
      update: {
        completedLessons: { increment: 1 },
        lastAccessedAt: now,
      },
    });
  },

  markModuleCompleted(id: string) {
    return prisma.userProgress.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  },
};

export const profileRepository = {
  getOrCreate(userId: string) {
    return prisma.userProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  },

  update(userId: string, data: { pace?: PaceMode; pausedWeek?: boolean; pausedUntil?: Date | null }) {
    return prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },
};

export async function getUserProgressSummaries(userId: string, pace: PaceMode, courseId?: string) {
  const courses = await prisma.course.findMany({
    where: courseId ? { id: courseId } : undefined,
    include: { modules: { orderBy: { order: "asc" } } },
  });

  if (courses.length === 0) return [];

  const moduleIds = courses.flatMap((c) => c.modules.map((m) => m.id));
  const progressRecords = await progressRepository.findByUserAndModules(userId, moduleIds);

  return courses.map((course) => {
    const progressForSummary = course.modules.map((mod) => {
      const existing = progressRecords.find((p) => p.moduleId === mod.id);
      return {
        id: existing?.id ?? `auto-${mod.id}`,
        userId,
        moduleId: mod.id,
        completedLessons: existing?.completedLessons ?? 0,
        lastAccessedAt: existing?.lastAccessedAt ?? null,
        completedAt: existing?.completedAt ?? null,
      };
    });
    return computeProgressSummary(course, course.modules, progressForSummary, pace);
  });
}
