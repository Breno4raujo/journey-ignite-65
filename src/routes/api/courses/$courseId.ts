import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "@/lib/db";
import { verifyJwt, extractBearerToken, unauthorizedResponse } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api";

export const APIRoute = createAPIFileRoute("/api/courses/$courseId")({
  DELETE: async ({ request, params }) => {
    try {
      const token = extractBearerToken(request);
      if (!token) return unauthorizedResponse();

      const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
      const payload = await verifyJwt(token, secret);
      if (!payload) return unauthorizedResponse("Token inválido ou expirado.");

      const course = await prisma.course.findUnique({
        where: { id: params.courseId },
      });

      if (!course) return jsonError("Curso não encontrado.", 404);

      await prisma.course.delete({
        where: { id: params.courseId },
      });

      return jsonOk({ deleted: true, courseId: params.courseId });
    } catch (err) {
      console.error("[DELETE /api/courses/:courseId]", err);
      return jsonError("Erro interno do servidor.", 500);
    }
  },
});