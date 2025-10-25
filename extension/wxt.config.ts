import { defineConfig } from "wxt";

import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    permissions: ["sidePanel", "storage", "tabs"],
    host_permissions: ["http://localhost:3001/*", "https://app.example.com/*"],
  },

  entrypointsDir: "src/entrypoints",
});
