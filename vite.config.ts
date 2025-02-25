import { defineConfig } from 'vite';
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createHtmlPlugin } from "vite-plugin-html";
import fs from 'fs';

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
      // middlewareMode: false,
      // configureServer: ({ middlewares }) => {
      //   middlewares.use((req, res, next) => {
      //     if (req.url.startsWith('/multi_player')) {
      //       const filePath = resolve(__dirname, 'multi_player', 'index.html');
      //       fs.readFile(filePath, (err, data) => {
      //         if (err) {
      //           next();
      //         } else {
      //           res.setHeader('Content-Type', 'text/html');
      //           res.send(data)
      //         }
      //       })
      //     } else {
      //       next();
      //     }
      //   });
      // }
      // rewrites: [
      //   {
      //     from: /\/multi_player\/.*/,
      //     to: '/multi_player/index.html'
      //   }
      // ],

      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';
          console.log("MIDDLEWARE HIT, URL:\t", req.url);
          if (url.startsWith('/multi_player/')) {
            console.log("MIDDLEWARE CAUGHT!\t", req.url);
            req.url = '/multi_player/index.html';
          }
          next();
        });
      },


      // rewrites: [
      //   {
      //     // from: /^\/multi_player\/.*/,
      //     // to: '/multi_player/index.html'
      //     from: /\/multi_player(\/.*)?$/,
      //     to: ({ match }) => {
      //       console.log("Rewrite matched", match[0]);
      //       return '/multi_player/index.html';
      //     }
      //   }
      // ]
    },
    build: {
      outDir: isProduction ? resolve(__dirname, "./server/src/main/resources/static") : "dist",
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          multi_player: resolve(__dirname, 'multi_player/index.html')
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