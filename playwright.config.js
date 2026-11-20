import { defineConfig, devices } from "@playwright/test";

/**
 * Konfigurasi Playwright E2E Testing untuk EVENTO
 */
export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    /* Jalankan PHP artisan serve jika server lokal belum aktif */
    webServer: {
        command: "php artisan serve --port=8000",
        url: "http://127.0.0.1:8000",
        reuseExistingServer: true,
        timeout: 120 * 1000,
    },
});
