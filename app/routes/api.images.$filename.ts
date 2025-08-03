// import type { LoaderFunctionArgs } from "@remix-run/node";
// import { getStore } from "@netlify/blobs";
// import { readFileSync, existsSync } from "fs";
// import { join } from "path";

// const isNetlifyEnvironment = process.env.NETLIFY === "true" || process.env.NODE_ENV === "production";

// export async function loader({ params }: LoaderFunctionArgs) {
//   const { filename } = params;
  
//   if (!filename) {
//     throw new Response("Filename required", { status: 400 });
//   }
  
//   try {
//     if (isNetlifyEnvironment) {
//       // Production: Serve from Netlify Blobs
//       const store = getStore("recipe-images");
//       const blob = await store.get(filename, { type: "arrayBuffer" });
      
//       if (!blob) {
//         throw new Response("Image not found", { status: 404 });
//       }
      
//       const metadata = await store.getMetadata(filename);
//       const contentType = metadata?.contentType || "image/jpeg";
      
//       return new Response(blob, {
//         headers: {
//           "Content-Type": contentType,
//           "Cache-Control": "public, max-age=31536000, immutable",
//         },
//       });
//     } else {
//       // Development: Serve from local file system
//       const filePath = join(process.cwd(), "public", "images", filename);
      
//       if (!existsSync(filePath)) {
//         throw new Response("Image not found", { status: 404 });
//       }
      
//       const buffer = readFileSync(filePath);
//       const contentType = getContentType(filename);
      
//       return new Response(buffer, {
//         headers: {
//           "Content-Type": contentType,
//           "Cache-Control": "public, max-age=31536000, immutable",
//         },
//       });
//     }
//   } catch (error) {
//     console.error("Error serving image:", error);
//     throw new Response("Internal Server Error", { status: 500 });
//   }
// }

// function getContentType(filename: string): string {
//   const ext = filename.split('.').pop()?.toLowerCase();
//   switch (ext) {
//     case 'jpg':
//     case 'jpeg':
//       return 'image/jpeg';
//     case 'png':
//       return 'image/png';
//     case 'gif':
//       return 'image/gif';
//     case 'webp':
//       return 'image/webp';
//     default:
//       return 'image/jpeg';
//   }
// }


import type { LoaderFunctionArgs } from "@remix-run/node";
import { getStore } from "@netlify/blobs";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export async function loader({ params }: LoaderFunctionArgs) {
  const { filename } = params;
  
  if (!filename) {
    console.error("No filename provided");
    throw new Response("Filename required", { status: 400 });
  }
  
  const isProduction = 
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
    process.env.NETLIFY_DEV !== "true";

  console.log("Image serving debug:", {
    filename,
    isProduction,
    AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME
  });

  try {
    if (isProduction) {
      console.log("Attempting to serve from Netlify Blobs...");
      const store = getStore("recipe-images");
      
      // Try to get the blob
      const blob = await store.get(filename, { type: "arrayBuffer" });
      console.log("Blob retrieved:", blob !== null);
      
      if (!blob) {
        console.error("Image not found in Netlify Blobs:", filename);
        
        // List all blobs to debug
        const allBlobs = await store.list();
        console.log("Available blobs:", allBlobs.blobs?.map(b => b.key) || []);
        
        throw new Response("Image not found", { status: 404 });
      }
      
      // Get metadata for content type
      const metadata = await store.getMetadata(filename);
      console.log("Image metadata:", metadata);
      
      const contentType = metadata?.contentType || getContentTypeFromFilename(filename);
      
      console.log("Serving image:", { filename, contentType, size: blob.byteLength });
      
      return new Response(blob, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } else {
      // Development: serve from local file system
      console.log("Serving from local file system...");
      const filePath = join(process.cwd(), "public", "images", filename);
      
      if (!existsSync(filePath)) {
        console.error("Local file not found:", filePath);
        throw new Response("Image not found", { status: 404 });
      }
      
      const buffer = readFileSync(filePath);
      const contentType = getContentTypeFromFilename(filename);
      
      return new Response(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (error) {
    console.error("Error serving image:", {
      filename,
      error: error.message,
      stack: error.stack
    });
    
    if (error instanceof Response) {
      throw error;
    }
    
    throw new Response("Internal Server Error", { status: 500 });
  }
}

function getContentTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}