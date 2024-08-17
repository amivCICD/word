import { defineConfig } from 'vite';
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createHtmlPlugin } from "vite-plugin-html";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    base: './',
    server: {
      port: 5173,
      open: true,
    },
    build: {
      outDir: isProduction ? resolve(__dirname, "./server/src/main/resources/static") : "dist",
    },
    plugins: [
      createHtmlPlugin({
        inject: {
          data: {
            API_URL: isProduction ? '' : 'http://localhost:1985',
          },
        },
      }),
    ],
  }
});