import { createCookie } from "@remix-run/node";

if (typeof process.env.AUTH_COOKIE_SECRET !== "string") {
    throw new Error("missing env AUTH_COOKIE_SECRET")
}

//createCookie helper functions takes 2 argument/ 1st is cookie name. 2nd is object, containing the cookie attributes
export const sessionCookie = createCookie("remix-recipes__session", {
  secrets: [process.env.AUTH_COOKIE_SECRET],
  httpOnly: true,
  secure: true,
});


export const themeCookie = createCookie("remix-recipes__theme")