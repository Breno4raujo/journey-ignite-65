import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "@/lib/db";
import { verifyJwt, extractBearerToken, unauthorizedResponse } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api";

export const APIRoute = createAPIFileRoute("/api/victories")({
  POST: async ({ request }) => {
    try {
      const token = extractBearerToken(request);
      if (!token) return unauthorizedResponse();

      const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
      const payload = await verifyJwt(token, secret);
      if (!payload) return unauthorizedResponse("Token inválido ou expirado.");

      const body = await request.json() as {
        kind?: string;
        title?: string;
        message?: string;
        earnedAt?: string;
      };

      const { kind, title, message, earnedAt } = body;

      const validKinds = ["module", "milestone", "badge"];
      if (!kind || !validKinds.includes(kind))
        return jsonError("kind inválido. Use: module, milestone ou badge.");
      if (!title || typeof title !== "string" || title.trim().length === 0)
        return jsonError("Título é obrigatório.");
      if (!message || typeof message !== "string" || message.trim().length === 0)
        return jsonError("Mensagem é obrigatória.");

      const victory = await prisma.victory.create({
        data: {
          userId: payload.sub,
          kind,
          title: title.trim(),
          message: message.trim(),
          earnedAt: earnedAt ? new Date(earnedAt) : new Date(),
        },
      });

      return jsonOk({ victory }, 201);
    } catch (err) {
      console.error("[POST /api/victories]", err);
      return jsonError("Erro interno do servidor.", 500);
    }
  },
});