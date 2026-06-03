import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { handleApiRequest } from "./backend/routes/api.router";

const apiMiddleware = createMiddleware().server(async ({ request, next }) => {
  const apiResponse = await handleApiRequest(request);
  if (apiResponse) return apiResponse;
  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [apiMiddleware, errorMiddleware],
}));
