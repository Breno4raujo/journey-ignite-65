import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/lib/server/prisma";
import { verifyToken } from "@/lib/server/auth";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          const token = authHeader?.replace("Bearer ", "");

          if (!token) {
            return Response.json({ error: "Token ausente." }, { status: 401 });
          }

          const userId = verifyToken(token);

          if (!userId) {
            return Response.json({ error: "Token inválido." }, { status: 401 });
          }

          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          });

          if (!user) {
            return Response.json(
              { error: "Usuário não encontrado." },
              { status: 404 },
            );
          }

          return Response.json({ user });
        } catch {
          return Response.json(
            { error: "Erro interno ao buscar sessão." },
            { status: 500 },
          );
        }
      },
    },
  },
});