import { env } from "@/backend/config/env";

const ALGORITHM = "HS256";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  type: "access";
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: "refresh";
  iat: number;
  exp: number;
}

function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "==".slice(0, (4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signPayload(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: ALGORITHM, typ: "JWT" })));
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const data = `${header}.${body}`;
  const key = await getSigningKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return `${data}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function verifyPayload<T extends { exp: number; type: string }>(
  token: string,
  secret: string,
  expectedType: T["type"],
): Promise<T | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, sig] = parts;
    const data = `${header}.${body}`;
    const key = await getSigningKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(sig),
      new TextEncoder().encode(data),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as T;
    if (payload.type !== expectedType) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function signAccessToken(input: { sub: string; email: string; name: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    ...input,
    type: "access",
    iat: now,
    exp: now + env.ACCESS_TOKEN_TTL_SECONDS,
  };
  return signPayload(payload, env.JWT_SECRET);
}

export async function signRefreshToken(input: { sub: string; jti: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: RefreshTokenPayload = {
    sub: input.sub,
    jti: input.jti,
    type: "refresh",
    iat: now,
    exp: now + env.REFRESH_TOKEN_TTL_SECONDS,
  };
  return signPayload(payload, env.JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  return verifyPayload<AccessTokenPayload>(token, env.JWT_SECRET, "access");
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  return verifyPayload<RefreshTokenPayload>(token, env.JWT_REFRESH_SECRET, "refresh");
}

export function createTokenId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
