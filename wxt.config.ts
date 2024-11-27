import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    manifest_version: 3,
    permissions: ["storage", "scripting", "activeTab", "contextMenus"],
    optional_host_permissions: [`*://*/*`],
    name: "stky",
    version: "1.0.0",
    description: "A simple note-taking Chrome extension.",
    hooks: {
      "build:manifestGenerated": (wxt, manifest) => {
        if (wxt.config.command === "serve") {
          // During development, content script is not listed in manifest, causing
          // "webext-dynamic-content-scripts" to throw an error. So we need to
          // add it manually.
          manifest.content_scripts ??= [];
          manifest.content_scripts.push({
            matches: ["<all_urls>"],
            js: ["content-scripts/content.js"],
            // If the script has CSS, add it here.
          });
        }
      },
    },
  },
});
