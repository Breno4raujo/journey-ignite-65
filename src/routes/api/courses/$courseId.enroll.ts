import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "@/lib/db";
import { verifyJwt, extractBearerToken, unauthorizedResponse } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api";

export const APIRoute = createAPIFileRoute("/api/courses/$courseId/enroll")({
  POST: async ({ request, params }) => {
    try {
      const token = extractBearerToken(request);
      if (!token) return unauthorizedResponse();

      const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
      const payload = await verifyJwt(token, secret);
      if (!payload) return unauthorizedResponse("Token inválido ou expirado.");

      const course = await prisma.course.findUnique({
        where: { id: params.courseId },
        include: { modules: { orderBy: { order: "asc" } } },
      });

      if (!course) return jsonError("Curso não encontrado.", 404);

      if (course.modules.length === 0)
        return jsonError("Este curso não possui módulos.", 400);

      await prisma.$transaction(async (tx: typeof prisma) => {
        for (const mod of course.modules) {
          await tx.userProgress.upsert({
            where: {
              userId_moduleId: { userId: payload.sub, moduleId: mod.id },
            },
            create: {
              userId: payload.sub,
              moduleId: mod.id,
              completedLessons: 0,
              lastAccessedAt: null,
              completedAt: null,
            },
            update: {},
          });
        }
      });

      const progress = await prisma.userProgress.findMany({
        where: {
          userId: payload.sub,
          moduleId: { in: course.modules.map((m: { id: string }) => m.id) },
        },
      });

      return jsonOk({ enrolled: true, courseId: course.id, progress });
    } catch (err) {
      console.error("[POST /api/courses/:courseId/enroll]", err);
      return jsonError("Erro interno do servidor.", 500);
    }
  },
});