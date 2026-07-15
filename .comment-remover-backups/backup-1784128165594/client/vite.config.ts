import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // 🚨 Simulates a browser!
    setupFiles: ['./src/setupTests.ts'], // Runs before every test
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "logo.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/graphql/, /^\/api\/auth\/.*$/],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: "Skribe",
        short_name: "Skribe",
        description: "Collaborative Storytelling & Drafting",
        theme_color: "#0A0A14",
        background_color: "#0A0A14",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/ic_launcher.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/playstore.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
    sentryVitePlugin({
      org: "demo-me",
      project: "javascript-react"
    })
  ],

  build: {
    sourcemap: true
  }
});