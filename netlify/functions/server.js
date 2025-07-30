import { createRequestHandler } from "@remix-run/netlify";
import * as build from "../../build/index.js";

const handler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
});

export { handler };