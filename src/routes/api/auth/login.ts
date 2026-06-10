import { createFileRoute } from "@tanstack/react-router";
import { verify } from "argon2";
import { prisma } from "@/lib/server/prisma";
import { createToken } from "@/lib/server/auth";
import { LoginSchema } from "@/shared/schemas/auth.schemas";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const parsed = LoginSchema.safeParse(body);

          if (!parsed.success) {
            return Response.json(
              { error: parsed.error.errors[0]?.message ?? "Dados inválidos." },
              { status: 400 },
            );
          }

          const { email, password } = parsed.data;

          const userFound = await prisma.user.findUnique({
            where: { email },
          });

          if (!userFound) {
            return Response.json(
              { error: "E-mail ou senha inválidos." },
              { status: 401 },
            );
          }

          const passwordIsValid = await verify(userFound.passwordHash, password);

          if (!passwordIsValid) {
            return Response.json(
              { error: "E-mail ou senha inválidos." },
              { status: 401 },
            );
          }

          const user = {
            id: userFound.id,
            name: userFound.name,
            email: userFound.email,
            createdAt: userFound.createdAt,
          };

          const token = createToken(user.id);

          return Response.json({ user, token });
        } catch {
          return Response.json(
            { error: "Erro interno ao entrar." },
            { status: 500 },
          );
        }
      },
    },
  },
});