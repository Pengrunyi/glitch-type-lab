import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
const site = JSON.parse(
  readFileSync(new URL("./.local-site.json", import.meta.url), "utf8"),
);
function attachHealth(server: Pick<ViteDevServer, "middlewares">) {
  server.middlewares.use("/health", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ projectId: site.projectId, name: "GLITCH TYPE — Digital Chaos Lab" }));
  });
}
export default defineConfig({
  plugins: [
    react(),
    {
      name: "site-health",
      configureServer: attachHealth,
      configurePreviewServer: attachHealth,
    },
  ],
  server: {
    port: site.port,
    strictPort: true,
    watch: {
      ignored: ["**/work/**", "**/outputs/**", "**/.playwright-mcp/**"],
    },
  },
  preview: { port: site.port, strictPort: true },
});
