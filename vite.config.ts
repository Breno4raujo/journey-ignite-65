// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { execSync } from "node:child_process";

function safeGit(cmd: string, fallback = "") {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return fallback;
  }
}

const commitSha = process.env.COMMIT_SHA || safeGit("git rev-parse --short HEAD", "dev");
const commitDate =
  process.env.COMMIT_DATE || safeGit("git log -1 --format=%cI", new Date().toISOString());
const commitMsg = process.env.COMMIT_MSG || safeGit("git log -1 --format=%s", "");

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    define: {
      __APP_COMMIT__: JSON.stringify(commitSha),
      __APP_COMMIT_DATE__: JSON.stringify(commitDate),
      __APP_COMMIT_MSG__: JSON.stringify(commitMsg),
    },
  },
});
