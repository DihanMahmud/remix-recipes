// import { vitePlugin as remix } from "@remix-run/dev";
// import { installGlobals } from "@remix-run/node";
// import { createRoutesFromFolders } from "@remix-run/v1-route-convention";
// import { defineConfig } from "vite";
// import tsconfigPaths from "vite-tsconfig-paths";

// declare module "@remix-run/node" {
//   interface Future {
//     v3_singleFetch: true;
//   }
// }

// installGlobals();

// export default defineConfig({
//   plugins: [
//     remix({
//       future: {
//         v3_fetcherPersist: true,
//         v3_relativeSplatPath: true,
//         v3_throwAbortReason: true,
//         v3_singleFetch: true,
//         v3_lazyRouteDiscovery: true,
//       },
//       //it tells remix to ignore version 2 routing convention
//       ignoredRouteFiles: ["**/.*"],

//       //this routes function allows you to tell remix how to create route from your files
//       routes(defineRoutes) {
//         return defineRoutes((route) => {
//           if (process.env.INCLUDE_TEST_ROUTES === "true") {
//             if (process.env.NODE_ENV === "production") {
//               console.warn(
//                 "NODE_ENV is set to production, but INCLUDE_TEST_ROUTES is set to true. This is not recommended for production environments."
//               );
//               return;
//             }
//           }
//           route("__test/login", "__test-routes__/login.tsx");
//         });

//         //this "createRoutesFromFolders()" function tells remix to use version 1 routing convention
//         return createRoutesFromFolders(defineRoutes);
//       },
//     }),
//     tsconfigPaths(),
//   ],
//   server: {
//     port: 3000,
//   },
// });

// // in the /route or /app we need to change from _index.tsx to index.jsx. Beacuse V1 route convention doesn't know what to do with the "_" in the file name






import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { createRoutesFromFolders } from "@remix-run/v1-route-convention";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

installGlobals();

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      // It tells remix to ignore version 2 routing convention
      ignoredRouteFiles: ["**/.*"],

      // This routes function allows you to tell remix how to create routes from your files
      routes(defineRoutes) {
        // Get all file-based routes using v1 convention
        const fileBasedRoutes = createRoutesFromFolders(defineRoutes);
        
        // Add custom routes by calling defineRoutes again and merging
        const customRoutes = defineRoutes((route) => {
          if (process.env.INCLUDE_TEST_ROUTES === "true") {
            if (process.env.NODE_ENV === "production") {
              console.warn(
                "NODE_ENV is set to production, but INCLUDE_TEST_ROUTES is set to true. This is not recommended for production environments."
              );
            } else {
              route("__test/login", "__test-routes__/login.tsx");
            }
          }
          
          // Add more custom routes here if needed
          // route("custom-path", "path/to/component.tsx");
        });
        
        // Merge both route configurations
        return {
          ...fileBasedRoutes,
          ...customRoutes,
        };
      },
    }),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
  },
});

// Note: In your routes folder, change from _index.tsx to index.tsx
// because V1 route convention doesn't use the "_" prefix for index routes