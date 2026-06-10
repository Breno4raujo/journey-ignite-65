import { createFileRoute } from "@tanstack/react-router";
import { hash } from "argon2";
import { prisma } from "@/lib/server/prisma";
import { createToken } from "@/lib/server/auth";
import { RegisterSchema } from "@/shared/schemas/auth.schemas";

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const parsed = RegisterSchema.safeParse(body);

          if (!parsed.success) {
            return Response.json(
              { error: parsed.error.errors[0]?.message ?? "Dados inválidos." },
              { status: 400 },
            );
          }

          const { name, email, password } = parsed.data;

          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            return Response.json(
              { error: "Este e-mail já está cadastrado." },
              { status: 409 },
            );
          }

          const passwordHash = await hash(password);

          const user = await prisma.user.create({
            data: {
              name,
              email,
              passwordHash,
              profile: {
                create: {},
              },
            },
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          });

          const token = createToken(user.id);

          return Response.json({ user, token });
        } catch {
          return Response.json(
            { error: "Erro interno ao criar conta." },
            { status: 500 },
          );
        }
      },
    },
  },
});