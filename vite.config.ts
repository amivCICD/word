import { defineConfig } from 'vite';
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createHtmlPlugin } from "vite-plugin-html";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function customRoutingPlugin() {
  return {
    name: 'custom-routing',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        console.log("Plugin middleware hit, URL:", url);
        if (url.startsWith('/multi_player/') && !url.endsWith('/multi_player/index.html')) {
          console.log("Rewriting to /multi_player/index.html for:", url);
          req.url = `/multi_player/index.html${url.includes('?') ? url.substring(url.indexOf('?')) : ''}`;
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  // const isProduction = false;
  console.log(`isproduction\t ${isProduction}`);
  console.info("__dirname\t", __dirname);

  return {
    base: './',
    server: {
      port: 5173,
      open: true,
    },
    plugins: [customRoutingPlugin()],
    build: {
      outDir: isProduction ? resolve(__dirname, "./server/src/main/resources/static") : "dist",
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          multi_player: resolve(__dirname, 'multi_player/index.html'),
        }
      },
      define: {
        'window.API_URL': JSON.stringify(isProduction ? '' : 'http://localhost:1985')
      }


    },
    // plugins: [
    //   createHtmlPlugin({
    //     entry: {
    //       main: resolve(__dirname, "index.html"),
    //       multi_player: resolve(__dirname, 'multi_player/index.html')
    //     },
    //   }),
    // ],
  }
});