import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        laravel({
            input: ["resources/css/app.css", "resources/js/main.jsx"],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    test: {
        include: ["resources/js/**/*.{test,spec}.{js,jsx}"],
        exclude: ["tests/e2e/**", "node_modules/**"],
    },
});
