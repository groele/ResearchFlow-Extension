import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: "ScholarFlow",
    version: "2.0.0",
    description: "Academic research productivity tool. Capture literature, manage projects, build timelines, and sync across private clouds.",
    permissions: [
      "storage",
      "activeTab",
      "scripting",
      "sidePanel",
      "unlimitedStorage",
      "contextMenus"
    ],
    host_permissions: [
      "https://api.github.com/*",
      "https://graph.microsoft.com/*",
      "https://www.googleapis.com/*",
      "https://api.openai.com/*",
      "https://api.deepseek.com/*",
      "http://*/*",
      "https://*/*"
    ],
    action: {
      default_title: "ScholarFlow"
    },
    minimum_chrome_version: "116"
  }
});
