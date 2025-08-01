import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createUser, getUser } from "~/models/user.server";
import { commitSession, getSession } from "~/sessions";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const firstName = url.searchParams.get("firstName");
  const lastName = url.searchParams.get("lastName");
  const email = url.searchParams.get("email");

  if (!email) {
    throw new Error("Email is required");
  }

  let user = await getUser(email);
//   let newUser;

  if (!user) {
    if (!firstName || !lastName) {
      throw new Error("First name and last name are required for new users");
    }
    user = await createUser(email, firstName, lastName);
  }

  const cookie = request.headers.get("cookie");
  const session = await getSession(cookie);

    session.set("userId", user.id);

  return redirect("/app",{
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  })
}
