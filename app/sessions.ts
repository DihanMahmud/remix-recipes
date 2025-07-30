import { createCookieSessionStorage } from "@remix-run/node";
import { sessionCookie } from "./cookies";

// there are many type of session storage, for cookie it is -> createCookieSessionStorage()
const { getSession, commitSession, destroySession } = createCookieSessionStorage({
    cookie: sessionCookie
});

export { getSession, commitSession, destroySession }