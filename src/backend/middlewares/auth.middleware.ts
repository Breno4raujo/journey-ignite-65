import { verifyAccessToken } from "@/backend/utils/jwt";
import { getAccessTokenFromRequest } from "@/backend/utils/cookies";
import { unauthorizedResponse } from "@/backend/utils/response";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
}

export async function requireAuth(request: Request): Promise<AuthenticatedUser> {
  const token = getAccessTokenFromRequest(request);
  if (!token) throw new AuthError("UNAUTHORIZED");

  const payload = await verifyAccessToken(token);
  if (!payload) throw new AuthError("INVALID_TOKEN");

  return {
    userId: payload.sub,
    email: payload.email,
    name: payload.name,
  };
}

export class AuthError extends Error {
  constructor(public code: "UNAUTHORIZED" | "INVALID_TOKEN" | "FORBIDDEN") {
    super(code);
  }
}

export function handleAuthError(error: unknown): Response {
  if (error instanceof AuthError) {
    if (error.code === "FORBIDDEN") {
      return unauthorizedResponse("Acesso negado.");
    }
    return unauthorizedResponse(
      error.code === "INVALID_TOKEN" ? "Token inválido ou expirado." : "Não autorizado.",
    );
  }
  return unauthorizedResponse();
}
