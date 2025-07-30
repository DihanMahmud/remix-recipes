import { redirect } from "@remix-run/node";
import { getUserById } from "~/models/user.server";
import { getSession } from "~/sessions";

export async function getCurrentUser(request: Request) {
  const getCookie = request.headers.get("cookie");
  const session = await getSession(getCookie);

  const userId = session.get("userId");

  // console.log(userId, "11 guys");
  

  if (typeof userId !== "string") {
    return null;
  }

  return getUserById(userId);
}


export async function requireLoggedOutUser(request: Request) {
    const user = await getCurrentUser(request);

    if (user !== null) {
        throw redirect("/app");
    }
}


export async function requireLoggedInUser(request: Request) {
    const user = await getCurrentUser(request)

    if (user === null) {
        throw redirect("/login")
    }

    return user;
}