// Tests run against file:// URLs on purpose — the app's core promise is that
// every page works when opened directly from disk with no server.
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./tests",
    timeout: 30000,
    use: {
        viewport: { width: 1400, height: 900 },
    },
});
