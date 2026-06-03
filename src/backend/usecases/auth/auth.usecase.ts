import { env } from "@/backend/config/env";
import { userRepository } from "@/backend/repositories/user.repository";
import { sessionRepository } from "@/backend/repositories/session.repository";
import { hashPassword, verifyPassword } from "@/backend/services/auth/password.service";
import {
  createTokenId,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/backend/utils/jwt";
import { appendAuthCookies, appendClearAuthCookies } from "@/backend/utils/cookies";
import { jsonOk, jsonError } from "@/backend/utils/response";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

async function issueTokenPair(user: PublicUser) {
  const jti = createTokenId();
  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
  const refreshToken = await signRefreshToken({ sub: user.id, jti });

  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);
  await sessionRepository.create(user.id, jti, expiresAt);

  return { accessToken, refreshToken };
}

function authResponse(user: PublicUser, tokens: { accessToken: string; refreshToken: string }) {
  const headers = new Headers();
  appendAuthCookies(headers, tokens.accessToken, tokens.refreshToken);
  return jsonOk(
    {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
      accessToken: tokens.accessToken,
    },
    200,
    headers,
  );
}

export async function loginUser(email: string, password: string): Promise<Response> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user) return jsonError("E-mail ou senha incorretos.", 401);

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) return jsonError("E-mail ou senha incorretos.", 401);

  const { passwordHash: _omit, ...publicUser } = user;
  const tokens = await issueTokenPair(publicUser);
  return authResponse(publicUser, tokens);
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<Response> {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await userRepository.findByEmail(normalizedEmail);
  if (existing) return jsonError("E-mail já cadastrado.", 409);

  const passwordHash = await hashPassword(password);
  const user = await userRepository.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
  });

  const tokens = await issueTokenPair(user);
  return authResponse(user, tokens);
}

export async function refreshSession(refreshToken: string): Promise<Response> {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) return jsonError("Sessão expirada. Faça login novamente.", 401);

  const session = await sessionRepository.findValid(payload.jti);
  if (!session) return jsonError("Sessão inválida. Faça login novamente.", 401);

  const user = await userRepository.findById(payload.sub);
  if (!user) return jsonError("Usuário não encontrado.", 401);

  await sessionRepository.revoke(payload.jti);
  const tokens = await issueTokenPair(user);
  return authResponse(user, tokens);
}

export async function logoutUser(refreshToken: string | null, userId?: string): Promise<Response> {
  if (refreshToken) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload) await sessionRepository.revoke(payload.jti);
  }
  if (userId) await sessionRepository.revokeAllForUser(userId);

  const headers = new Headers();
  appendClearAuthCookies(headers);
  return jsonOk({ message: "Logout realizado com sucesso." }, 200, headers);
}

export async function getAuthenticatedUser(userId: string): Promise<PublicUser | null> {
  return userRepository.findById(userId);
}
