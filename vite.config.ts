import { defineConfig } from 'vite';
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createHtmlPlugin } from "vite-plugin-html";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
      // proxy: {
      //   '/chat' : {
      //     target: 'ws://localhost:1985',
      //     ws: true
      //   }
      // },
      fs: {
        strict: false
      }
    },
    build: {
      outDir: isProduction ? resolve(__dirname, "./server/src/main/resources/static") : "dist",
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          multi: resolve(__dirname, 'multi.html')
        }
      },
      define: {
        'window.API_URL': JSON.stringify(isProduction ? '' : 'http://localhost:1985')
      }


    },
    plugins: [
      // createHtmlPlugin({
      //   // entry: {
      //   //   main: resolve(__dirname, "index.html"),
      //   //   multiplayer: resolve(__dirname, 'multiplayer/multi.html')
      //   // },
      //   inject: {
      //     data: {
      //       API_URL: isProduction ? '' : 'http://localhost:1985',
      //     },
      //     tags: [
      //       {
      //         tag: 'script',
      //         children: `window.API_URL = "${isProduction ? '' : 'http://localhost:1985'}";`,
      //         injectTo: 'head'
      //       }
      //     ]
      //   },
      // }),
    ],
  }
});