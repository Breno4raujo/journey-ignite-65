import { loginUser, registerUser, refreshSession, logoutUser, getAuthenticatedUser } from "@/backend/usecases/auth/auth.usecase";
import { requireAuth, handleAuthError, AuthError } from "@/backend/middlewares/auth.middleware";
import { courseRepository, getUserProgressSummaries, profileRepository, progressRepository } from "@/backend/repositories/progress.repository";
import { prisma } from "@/backend/lib/prisma";
import { getRefreshTokenFromRequest } from "@/backend/utils/cookies";
import { jsonOk, jsonError, forbiddenResponse } from "@/backend/utils/response";
import { LoginSchema, RegisterSchema } from "@/shared/schemas/auth.schemas";
import type { PaceMode } from "@/lib/aprenderja/types";
import { z } from "zod";

type ApiContext = { request: Request; params: Record<string, string> };

type ApiHandler = (ctx: ApiContext) => Promise<Response>;

const AdvanceLessonSchema = z.object({ moduleId: z.string().min(1) });
const ProfileUpdateSchema = z.object({
  pace: z.enum(["leve", "focado", "intenso"]).optional(),
  pausedWeek: z.boolean().optional(),
  pausedUntil: z.string().datetime().nullable().optional(),
});

async function readJson<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

const routes: Array<{ method: string; pattern: RegExp; handler: ApiHandler }> = [
  {
    method: "POST",
    pattern: /^\/api\/auth\/login$/,
    handler: async ({ request }) => {
      const body = await readJson(request);
      const parsed = LoginSchema.safeParse(body);
      if (!parsed.success) return jsonError("E-mail ou senha inválidos.", 400);
      return loginUser(parsed.data.email, parsed.data.password);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/auth\/register$/,
    handler: async ({ request }) => {
      const body = await readJson(request);
      const parsed = RegisterSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400);
      }
      return registerUser(parsed.data.name, parsed.data.email, parsed.data.password);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/auth\/logout$/,
    handler: async ({ request }) => {
      let userId: string | undefined;
      try {
        userId = (await requireAuth(request)).userId;
      } catch {
        /* logout mesmo sem access token */
      }
      return logoutUser(getRefreshTokenFromRequest(request), userId);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/auth\/refresh$/,
    handler: async ({ request }) => {
      const refreshToken = getRefreshTokenFromRequest(request);
      if (!refreshToken) return jsonError("Sessão expirada.", 401);
      return refreshSession(refreshToken);
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/auth\/me$/,
    handler: async ({ request }) => {
      try {
        const auth = await requireAuth(request);
        const user = await getAuthenticatedUser(auth.userId);
        if (!user) return jsonError("Usuário não encontrado.", 404);
        return jsonOk({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt.toISOString(),
          },
        });
      } catch (err) {
        if (err instanceof AuthError) return handleAuthError(err);
        throw err;
      }
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/courses$/,
    handler: async ({ request }) => {
      try {
        await requireAuth(request);
        const courses = await courseRepository.findAllWithModules();
        return jsonOk({ courses });
      } catch (err) {
        if (err instanceof AuthError) return handleAuthError(err);
        throw err;
      }
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/progress\/([^/]+)$/,
    handler: async ({ request, params }) => {
      try {
        const auth = await requireAuth(request);
        if (auth.userId !== params.userId) return forbiddenResponse();

        const url = new URL(request.url);
        const courseId = url.searchParams.get("courseId") ?? undefined;
        const paceParam = url.searchParams.get("pace");
        const validPaces: PaceMode[] = ["leve", "focado", "intenso"];
        const profile = await profileRepository.getOrCreate(auth.userId);
        const pace = (paceParam && validPaces.includes(paceParam as PaceMode)
          ? paceParam
          : profile.pace) as PaceMode;

        const summaries = await getUserProgressSummaries(auth.userId, pace, courseId);
        if (courseId && summaries.length === 0) return jsonError("Nenhum curso encontrado.", 404);

        return jsonOk({
          userId: auth.userId,
          pace,
          profile: {
            pausedWeek: profile.pausedWeek,
            pausedUntil: profile.pausedUntil?.toISOString() ?? null,
          },
          summaries,
          global: {
            totalCourses: summaries.length,
            completedCourses: summaries.filter((s) => s.overallPercent === 100).length,
            averageProgress:
              summaries.length === 0
                ? 0
                : Math.round(summaries.reduce((acc, s) => acc + s.overallPercent, 0) / summaries.length),
          },
        });
      } catch (err) {
        if (err instanceof AuthError) return handleAuthError(err);
        throw err;
      }
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/progress\/lesson$/,
    handler: async ({ request }) => {
      try {
        const auth = await requireAuth(request);
        const body = await readJson(request);
        const parsed = AdvanceLessonSchema.safeParse(body);
        if (!parsed.success) return jsonError("moduleId é obrigatório.", 400);

        const { moduleId } = parsed.data;
        const module = await prisma.module.findUnique({ where: { id: moduleId } });
        if (!module) return jsonError("Módulo não encontrado.", 404);

        const existing = await progressRepository.findByUserAndModule(auth.userId, moduleId);
        const currentLessons = existing?.completedLessons ?? 0;

        if (currentLessons >= module.totalLessons) {
          return jsonOk({ message: "Módulo já concluído.", progress: existing, moduleCompleted: true });
        }

        const updated = await progressRepository.advanceLesson(auth.userId, moduleId, module.totalLessons);
        const isModuleCompleted = updated.completedLessons >= module.totalLessons;
        if (isModuleCompleted && !updated.completedAt) {
          await progressRepository.markModuleCompleted(updated.id);
          updated.completedAt = new Date();
        }

        return jsonOk({
          message: isModuleCompleted
            ? `Parabéns! Você concluiu o módulo "${module.title}"!`
            : `Lição ${updated.completedLessons} de ${module.totalLessons} concluída.`,
          progress: updated,
          moduleCompleted: isModuleCompleted,
          moduleTitle: module.title,
          lessonNumber: updated.completedLessons,
          totalLessons: module.totalLessons,
          percentComplete: Math.round((updated.completedLessons / module.totalLessons) * 100),
        });
      } catch (err) {
        if (err instanceof AuthError) return handleAuthError(err);
        throw err;
      }
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/profile$/,
    handler: async ({ request }) => {
      try {
        const auth = await requireAuth(request);
        const profile = await profileRepository.getOrCreate(auth.userId);
        return jsonOk({
          profile: {
            pace: profile.pace as PaceMode,
            pausedWeek: profile.pausedWeek,
            pausedUntil: profile.pausedUntil?.toISOString() ?? null,
          },
        });
      } catch (err) {
        if (err instanceof AuthError) return handleAuthError(err);
        throw err;
      }
    },
  },
  {
    method: "PATCH",
    pattern: /^\/api\/profile$/,
    handler: async ({ request }) => {
      try {
        const auth = await requireAuth(request);
        const body = await readJson(request);
        const parsed = ProfileUpdateSchema.safeParse(body);
        if (!parsed.success) return jsonError("Dados inválidos.", 400);

        const profile = await profileRepository.update(auth.userId, {
          pace: parsed.data.pace,
          pausedWeek: parsed.data.pausedWeek,
          pausedUntil:
            parsed.data.pausedUntil === undefined
              ? undefined
              : parsed.data.pausedUntil
                ? new Date(parsed.data.pausedUntil)
                : null,
        });

        return jsonOk({
          profile: {
            pace: profile.pace as PaceMode,
            pausedWeek: profile.pausedWeek,
            pausedUntil: profile.pausedUntil?.toISOString() ?? null,
          },
        });
      } catch (err) {
        if (err instanceof AuthError) return handleAuthError(err);
        throw err;
      }
    },
  },
];

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return null;

  for (const route of routes) {
    if (route.method !== request.method) continue;
    const match = url.pathname.match(route.pattern);
    if (!match) continue;

    const params: Record<string, string> = {};
    if (match[1]) params.userId = match[1];

    try {
      return await route.handler({ request, params });
    } catch (err) {
      console.error(`[API ${request.method} ${url.pathname}]`, err);
      return jsonError("Erro interno do servidor.", 500);
    }
  }

  return jsonError("Rota não encontrada.", 404);
}
