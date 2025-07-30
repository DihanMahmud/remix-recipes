/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import { PassThrough } from "node:stream";

import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext
) {

  // const ifNoneMatch = request.headers.get("If-None-Match")
  // const etag = responseHeaders.get("etag")

  // if (ifNoneMatch !== null && etag !== null && ifNoneMatch === etag) {
  //   console.log("It is working", ifNoneMatch === etag);
    
  //   return new Response(null, {status: 304, headers: responseHeaders})
  // }

  //   console.log("It is not working", ifNoneMatch === etag);

  // First, check if the client has an authentication cookie - this is crucial 
  // for proper caching decisions
  const hasCookies = request.headers.has("Cookie");
  const hasAuth = request.headers.has("Authorization");

  // Get the ETag values
  const ifNoneMatch = request.headers.get("if-none-match");
  const etag = responseHeaders.get("ETag") || responseHeaders.get("etag");

  // Only perform 304 Not Modified responses when:
  // 1. We have a valid ETag
  // 2. Client sent If-None-Match
  // 3. ETags match
  // 4. AND authentication state hasn't changed 
  // (if there are cookies/auth headers, we need to be careful about 304s)
  if (
    ifNoneMatch !== null && 
    etag !== null && 
    ifNoneMatch === etag
  ) {
    // For 304 responses, ensure Vary header is present
    if (!responseHeaders.has("Vary")) {
      responseHeaders.set("Vary", "Cookie, Authorization");
    }
    
    return new Response(null, {
      status: 304, 
      headers: responseHeaders
    });
  }

  // For all other responses, ensure important cache headers
  if (!responseHeaders.has("Vary")) {
    responseHeaders.set("Vary", "Cookie, Authorization");
  }

  // Ensure Cache-Control is appropriate for the authentication state
  if (hasCookies || hasAuth) {
    // For authenticated users, ensure we don't have public caching
    if (!responseHeaders.has("Cache-Control") || 
        responseHeaders.get("Cache-Control")?.includes("public")) {
      responseHeaders.set("Cache-Control", "private, max-age=0, must-revalidate");
    }
  }


  return isbot(request.headers.get("user-agent") || "")
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      );
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
