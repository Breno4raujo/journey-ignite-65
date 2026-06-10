import { createHmac } from "node:crypto";

const SECRET = process.env.AUTH_SECRET ?? "dev-secret";

export function createToken(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    }),
  ).toString("base64url");

  const signature = createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function verifyToken(token: string) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) return null;

  const expected = createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");

  if (signature !== expected) return null;

  const data = JSON.parse(Buffer.from(payload, "base64url").toString());

  if (Date.now() > data.exp) return null;

  return data.userId as string;
}