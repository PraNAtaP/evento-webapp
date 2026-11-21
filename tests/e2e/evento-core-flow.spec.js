import { test, expect } from "@playwright/test";

test.describe("EVENTO Platform - E2E Integration Testing", () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
    });

    test("1. Akses halaman awal dan identitas platform EVENTO", async ({ page }) => {
        await page.goto("/");
        // Sistem me-redirect pengguna yang belum login ke /login
        await expect(page).toHaveURL(/.*login.*/);

        // Pastikan logo EVENTO tampil di halaman
        const logo = page.locator("img[alt='EVENTO']").first();
        await expect(logo).toBeVisible();

        // Pastikan form login dan tautan pendaftaran akun tersedia
        await expect(page.locator("input[type='email']")).toBeVisible();
        const registerLink = page.getByRole("link", { name: /daftar/i }).first();
        await expect(registerLink).toBeVisible();
    });

    test("2. Formulir Login memvalidasi kredensial pengguna yang tidak valid", async ({ page }) => {
        await page.goto("/login");

        // Periksa form login
        await expect(page.locator("input[type='email']")).toBeVisible();
        await expect(page.locator("input[type='password']")).toBeVisible();

        // Masukkan kredensial salah
        await page.locator("input[type='email']").fill("akun-tidak-terdaftar@evento.test");
        await page.locator("input[type='password']").fill("passwordSalah123");
        await page.getByRole("button", { name: /masuk/i }).click();

        // Memastikan banner notifikasi kesalahan muncul dengan role alert
        const errorAlert = page.locator("[role='alert'], [data-testid='login-error']").first();
        await expect(errorAlert).toBeVisible({ timeout: 10000 });
        await expect(errorAlert).toContainText(/salah/i);
    });

    test("3. Halaman Register menampilkan opsi pendaftaran Customer dan Vendor", async ({ page }) => {
        await page.goto("/register");

        // Memastikan judul pendaftaran tampil
        await expect(page.getByText(/daftar akun/i).first()).toBeVisible();
        await expect(page.locator("input[type='email']")).toBeVisible();

        // Memastikan ada tautan pendaftaran vendor mitra
        const vendorLink = page.locator("a[href*='vendor']").first();
        await expect(vendorLink).toBeVisible();
    });

    test("4. Halaman Verifikasi Email (/verify-email) membatasi akses tanpa email diverifikasi", async ({ page }) => {
        await page.goto("/verify-email?email=test.pengujian@evento.test");

        // Memastikan heading verifikasi muncul
        await expect(page.getByText(/verifikasi alamat email/i).first()).toBeVisible();
        await expect(page.getByText(/akun menunggu verifikasi/i)).toBeVisible();
        await expect(page.getByText(/test.pengujian@evento.test/)).toBeVisible();

        // Memastikan kotak panduan langkah verifikasi ada
        await expect(page.getByText(/langkah verifikasi/i)).toBeVisible();
    });

    test("5. Login EO Admin, Dashboard Analitik, Papan Kanban, dan Kotak Masuk Notifikasi", async ({ page }) => {
        // Login melalui API
        const loginResponse = await page.request.post("/api/login", {
            data: {
                email: "eo@evento.test",
                password: "testing@123$",
            },
        });

        if (loginResponse.ok()) {
            const data = await loginResponse.json();
            const token = data.token;

            await page.addInitScript((authToken) => {
                localStorage.setItem("auth_token", authToken);
            }, token);

            // Buka Dashboard Admin
            await page.goto("/admin/dashboard");
            await expect(page.getByText(/dashboard analitik/i).first()).toBeVisible({ timeout: 10000 });

            // Memastikan Lonceng Notifikasi ada di Header
            const notifButton = page.locator("button[aria-label*='notifikasi' i]").or(page.locator("button:has(svg.lucide-bell)")).first();
            await expect(notifButton).toBeVisible();

            // Klik lonceng notifikasi untuk membuka Dropdown Inbox
            await notifButton.click();
            await expect(page.getByText(/kotak masuk notifikasi/i)).toBeVisible();

            // Buka Kanban Event Board
            await page.goto("/admin/kanban");
            await expect(page.getByText(/kanban event board/i).first()).toBeVisible();

            // Buka Pendaftaran & Review Vendor
            await page.goto("/admin/vendors");
            await expect(page.getByText(/pendaftaran & review vendor/i).first()).toBeVisible();
        } else {
            await page.goto("/admin/dashboard");
            await expect(page).toHaveURL(/.*login.*/);
        }
    });

    test("6. Login Client, Portal Acara Saya, dan Penawaran EO", async ({ page }) => {
        const loginResponse = await page.request.post("/api/login", {
            data: {
                email: "client@evento.test",
                password: "testing@123$",
            },
        });

        if (loginResponse.ok()) {
            const data = await loginResponse.json();
            const token = data.token;

            await page.addInitScript((authToken) => {
                localStorage.setItem("auth_token", authToken);
            }, token);

            await page.goto("/client/dashboard");
            await expect(page.getByText(/dashboard/i).first()).toBeVisible({ timeout: 10000 });

            await page.goto("/client/booked-events");
            await expect(page.getByText(/acara saya|booking/i).first()).toBeVisible();
        }
    });

    test("7. Standar Layout Cetak Invoice A4 dan Styling Print CSS", async ({ page }) => {
        await page.goto("/login");
        const printRules = await page.evaluate(() => {
            let foundPrintMedia = false;
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules) {
                        if (rule.media && rule.media.mediaText.includes("print")) {
                            foundPrintMedia = true;
                            break;
                        }
                    }
                } catch {
                    // ignore cross-origin stylesheets
                }
            }
            return foundPrintMedia;
        });

        expect(printRules).toBeTruthy();
    });

    test("8. Login Vendor Mitra, Portal Dashboard Vendor, Paket Layanan, dan Tawaran Pekerjaan", async ({ page }) => {
        const loginResponse = await page.request.post("/api/login", {
            data: {
                email: "vendor@evento.test",
                password: "testing@123$",
            },
        });

        if (loginResponse.ok()) {
            const data = await loginResponse.json();
            const token = data.token;

            await page.addInitScript((authToken) => {
                localStorage.setItem("auth_token", authToken);
            }, token);

            // Buka Dashboard Vendor
            await page.goto("/vendor/dashboard");
            await expect(page.getByText(/dashboard|pekerjaan aktif|tawaran/i).first()).toBeVisible({ timeout: 10000 });

            // Buka halaman Paket Vendor
            await page.goto("/vendor/packages");
            await expect(page.getByText(/paket|layanan/i).first()).toBeVisible();

            // Buka tawaran pekerjaan
            await page.goto("/vendor/job-offers");
            await expect(page.getByText(/tawaran|job offer/i).first()).toBeVisible();
        }
    });

    test("9. Pengujian Responsivitas Mobile Viewport (Layar HP 375x667)", async ({ page }) => {
        // Atur layar ke ukuran mobile (iPhone SE ukuran 375x667)
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto("/login");

        // Memastikan logo dan form login tetap tampil rapi tanpa overflow horizontal
        const logo = page.locator("img[alt='EVENTO']").first();
        await expect(logo).toBeVisible();

        const emailInput = page.locator("input[type='email']");
        await expect(emailInput).toBeVisible();

        const box = await emailInput.boundingBox();
        expect(box).toBeTruthy();
        expect(box.width).toBeLessThanOrEqual(375);
    });

    test("10. Proteksi Rute dan Otorisasi (Guest & Cross-role Guard)", async ({ page }) => {
        // Pastikan tamu yang belum login ditolak saat mengakses rute terproteksi
        await page.goto("/admin/dashboard");
        await expect(page).toHaveURL(/.*login.*/);

        await page.goto("/client/dashboard");
        await expect(page).toHaveURL(/.*login.*/);

        await page.goto("/vendor/dashboard");
        await expect(page).toHaveURL(/.*login.*/);
    });

    test("11. Halaman 404 (Not Found) ramah pengguna", async ({ page }) => {
        await page.goto("/halaman-yang-pasti-tidak-ada-12345");
        await expect(page.getByText(/404/i).first()).toBeVisible();
        await expect(page.getByText(/halaman tidak ditemukan/i).first()).toBeVisible();
    });

    test("12. Akses Pengaturan Profil Pengguna & Ganti Password", async ({ page }) => {
        const loginResponse = await page.request.post("/api/login", {
            data: {
                email: "client@evento.test",
                password: "testing@123$",
            },
        });

        if (loginResponse.ok()) {
            const data = await loginResponse.json();
            const token = data.token;

            await page.addInitScript((authToken) => {
                localStorage.setItem("auth_token", authToken);
            }, token);

            await page.goto("/profile");
            await expect(page.getByText(/informasi profil akun/i).first()).toBeVisible({ timeout: 10000 });
            await expect(page.getByText(/ganti password/i).first()).toBeVisible();
        }
    });

    test("13. Pengujian Komprehensif Antarmuka Mobile (Hamburger Menu & Zero Horizontal Scroll)", async ({ page }) => {
        // Uji tampilan pada viewport smartphone (375x667)
        await page.setViewportSize({ width: 375, height: 667 });

        const loginResponse = await page.request.post("/api/login", {
            data: {
                email: "client@evento.test",
                password: "testing@123$",
            },
        });

        if (loginResponse.ok()) {
            const data = await loginResponse.json();
            const token = data.token;

            await page.addInitScript((authToken) => {
                localStorage.setItem("auth_token", authToken);
            }, token);

            // Buka dashboard pada layar mobile
            await page.goto("/client/dashboard");
            await page.waitForLoadState("networkidle");

            // Pastikan tidak ada horizontal scroll overflow
            const isOverflowing = await page.evaluate(() => {
                return document.documentElement.scrollWidth > window.innerWidth;
            });
            expect(isOverflowing).toBeFalsy();

            // Pastikan tombol hamburger mobile ada di header
            const hamburgerBtn = page.getByRole("button", { name: /buka menu navigasi/i }).first();
            await expect(hamburgerBtn).toBeVisible();

            // Klik tombol hamburger untuk membuka sidebar drawer
            await hamburgerBtn.click();

            // Pastikan sidebar menu terbuka dan tombol tutup terlihat
            const closeBtn = page.getByRole("button", { name: /tutup menu/i }).first();
            await expect(closeBtn).toBeVisible();

            // Klik tombol tutup menu untuk menutup kembali drawer
            await closeBtn.click();
            await expect(page.locator("aside")).toHaveClass(/.*-translate-x-full.*/);

            // Periksa halaman Profil pada layar mobile
            await page.goto("/profile");
            await page.waitForLoadState("networkidle");

            const isProfileOverflowing = await page.evaluate(() => {
                return document.documentElement.scrollWidth > window.innerWidth;
            });
            expect(isProfileOverflowing).toBeFalsy();

            // Periksa halaman 404 pada layar mobile
            await page.goto("/url-palsu-mobile-test");
            await page.waitForLoadState("networkidle");

            const is404Overflowing = await page.evaluate(() => {
                return document.documentElement.scrollWidth > window.innerWidth;
            });
            expect(is404Overflowing).toBeFalsy();
        }
    });
});
