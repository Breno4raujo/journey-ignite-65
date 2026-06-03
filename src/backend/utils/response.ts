export function jsonOk<T>(data: T, status = 200, extraHeaders?: Headers): Response {
  const headers = extraHeaders ?? new Headers();
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return new Response(JSON.stringify(data), { status, headers });
}

export function jsonError(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function unauthorizedResponse(message = "Não autorizado"): Response {
  return jsonError(message, 401);
}

export function forbiddenResponse(message = "Acesso negado"): Response {
  return jsonError(message, 403);
}
