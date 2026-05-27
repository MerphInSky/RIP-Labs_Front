import fs from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";
import { VitePWA } from "vite-plugin-pwa";

function normalizeBase(raw: string | undefined): string {
  const b = (raw ?? "/").trim() || "/";
  if (b === "/") return "/";
  const withSlash = b.endsWith("/") ? b : `${b}/`;
  return withSlash;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = normalizeBase(env.VITE_BASE_PATH);
  const devApiProxy = env.VITE_DEV_API_PROXY || "http://localhost:8080";
  const pwaName = "Нагрев";
  const rootDir = process.cwd();
  const manualCertPath = path.resolve(rootDir, "cert.crt");
  const manualKeyPath = path.resolve(rootDir, "cert.key");
  const useManualHttpsCerts =
    mode === "development" &&
    fs.existsSync(manualCertPath) &&
    fs.existsSync(manualKeyPath);

  // Для GitHub Pages отключаем PWA в development режиме
  const isGitHubPages = base !== "/" && base !== "./";
  
  return {
    base,
    plugins: [
      react(),
      mode === "development" && !useManualHttpsCerts ? mkcert() : null,
      VitePWA({
        registerType: "autoUpdate",
        // Для GitHub Pages используем относительные пути
        injectRegister: "auto",
        includeAssets: ["pwa-192.png", "pwa-512.png", "vite.svg"],
        manifest: {
          name: pwaName,
          short_name: "Нагрев компонентов",
          description: "Каталог компонентов и заявки",
          start_url: base,
          scope: base,
          display: "standalone",
          background_color: "#f6f7f7",
          theme_color: "#c55f4d",
          orientation: "any",
          lang: "ru",
          icons: [
            { src: "pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          ],
        },
        workbox: {
          // Исключаем файлы, которые могут вызвать проблемы на GitHub Pages
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInSize: 35 * 1024 * 1024,
          // Важно для GitHub Pages: настройка стратегии кэширования
          navigateFallback: `${base}index.html`,
          navigateFallbackDenylist: [/^\/api/, /^\/object-media/],
        },
        // Отключаем devOptions для production сборки
        devOptions: {
          enabled: mode === "development" && !isGitHubPages,
        },
      }),
    ].filter(Boolean),
    server: {
      ...(useManualHttpsCerts
        ? {
            https: {
              cert: fs.readFileSync(manualCertPath),
              key: fs.readFileSync(manualKeyPath),
            },
          }
        : {}),
      proxy: {
        "/api": {
          target: devApiProxy,
          changeOrigin: true,
        },
        // 👇 Прокси для MinIO
        "/object-media": {
          target: "http://localhost:9000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/object-media/, ""),
          // secure: false, // раскомментируйте если MinIO на HTTPS с самоподписанным сертификатом
        },
      },
      watch: {
        usePolling: true,
      },
      host: true,
      strictPort: true,
      port: 3000,
    },
    // Важно для GitHub Pages: правильная обработка ассетов
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  };
});