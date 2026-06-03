import { env } from "@/backend/config/env";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

export function getAccessTokenFromRequest(request: Request): string | null {
  const cookieToken = parseCookie(request, ACCESS_COOKIE);
  if (cookieToken) return cookieToken;

  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  return null;
}

export function getRefreshTokenFromRequest(request: Request): string | null {
  return parseCookie(request, REFRESH_COOKIE);
}

function parseCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1] ?? null;
}

function cookieFlags(maxAge: number): string {
  const secure = env.IS_PRODUCTION ? "; Secure" : "";
  return `HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

export function appendAuthCookies(headers: Headers, accessToken: string, refreshToken: string): void {
  headers.append("Set-Cookie", `${ACCESS_COOKIE}=${accessToken}; ${cookieFlags(env.ACCESS_TOKEN_TTL_SECONDS)}`);
  headers.append("Set-Cookie", `${REFRESH_COOKIE}=${refreshToken}; ${cookieFlags(env.REFRESH_TOKEN_TTL_SECONDS)}`);
}

export function appendClearAuthCookies(headers: Headers): void {
  const expired = "HttpOnly; SameSite=Lax; Path=/; Max-Age=0";
  headers.append("Set-Cookie", `${ACCESS_COOKIE}=; ${expired}`);
  headers.append("Set-Cookie", `${REFRESH_COOKIE}=; ${expired}`);
}
