import type { LoaderFunctionArgs } from "@remix-run/node";
import { getStore } from "@netlify/blobs";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const isNetlifyEnvironment = process.env.NETLIFY === "true" || process.env.NODE_ENV === "production";

export async function loader({ params }: LoaderFunctionArgs) {
  const { filename } = params;
  
  if (!filename) {
    throw new Response("Filename required", { status: 400 });
  }
  
  try {
    if (isNetlifyEnvironment) {
      // Production: Serve from Netlify Blobs
      const store = getStore("recipe-images");
      const blob = await store.get(filename, { type: "arrayBuffer" });
      
      if (!blob) {
        throw new Response("Image not found", { status: 404 });
      }
      
      const metadata = await store.getMetadata(filename);
      const contentType = metadata?.contentType || "image/jpeg";
      
      return new Response(blob, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } else {
      // Development: Serve from local file system
      const filePath = join(process.cwd(), "public", "images", filename);
      
      if (!existsSync(filePath)) {
        throw new Response("Image not found", { status: 404 });
      }
      
      const buffer = readFileSync(filePath);
      const contentType = getContentType(filename);
      
      return new Response(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (error) {
    console.error("Error serving image:", error);
    throw new Response("Internal Server Error", { status: 500 });
  }
}

function getContentType(filename: string): string {
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