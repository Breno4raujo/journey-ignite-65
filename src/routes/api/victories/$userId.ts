import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "@/lib/db";
import { verifyJwt, extractBearerToken, unauthorizedResponse } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api";

export const APIRoute = createAPIFileRoute("/api/victories/$userId")({
  GET: async ({ request, params }) => {
    try {
      const token = extractBearerToken(request);
      if (!token) return unauthorizedResponse();

      const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
      const payload = await verifyJwt(token, secret);
      if (!payload) return unauthorizedResponse("Token inválido ou expirado.");

      if (payload.sub !== params.userId)
        return jsonError("Acesso negado.", 403);

      const victories = await prisma.victory.findMany({
        where: { userId: params.userId },
        orderBy: { earnedAt: "desc" },
      });

      return jsonOk({ victories });
    } catch (err) {
      console.error("[GET /api/victories/:userId]", err);
      return jsonError("Erro interno do servidor.", 500);
    }
  },
});