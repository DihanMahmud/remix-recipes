import { ActionFunction, data, json, LoaderFunction } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import classNames from "classnames";
import { z } from "zod";
import { ErrorMessage, PrimaryButton, PrimaryInput } from "~/components/form";
import { sessionCookie } from "~/cookies";
import { generateMagicLinks, sendMagicLinkEmail } from "~/magic-links.server";
import { getUser } from "~/models/user.server";
import { commitSession, getSession } from "~/sessions";
import { validateForm } from "~/utils/validation";
import { v4 as uuid } from "uuid";
import { requireLoggedOutUser } from "~/utils/auth.server";

const loginSchema = z.object({
  email: z.string().email(),
});

// const loginSchema = z.object({
//   email: z.string().email().refine((email) => email.endsWith('@gmail.com') || email.endsWith('@outlook.com'), {
//     message: 'Email must be from gmail.com or outlook.com',
//   }),
// });

export const loader: LoaderFunction = async ({ request }) => {
  //if we want the cookie value in a loader,
  // const getCookie = request.headers.get("cookie");
  // const cookieValue = await sessionCookie.parse(getCookie); // get data from cookie by this
  // const session = await getSession(getCookie); // (getSession)it is used by remix session helper. using getSession() you can get data where ever the data is stored.

  // console.log(session.data);

  await requireLoggedOutUser(request);

  return null;
};

export const action: ActionFunction = async ({ request }) => {
  await requireLoggedOutUser(request);
  const getCookie = request.headers.get("cookie");
  const session = await getSession(getCookie);
  const formData = await request.formData();
  // return validateForm(formData, loginSchema, ({email}) => {}, (errors) => data({errors, email: formData.get("email")}, {status: 400}))
  return validateForm(
    formData,
    loginSchema,
    async ({ email }) => {
      const nonce = uuid();
      // session.flash("nonce", nonce); // use .flash instead of .set, after using flash if you use .get to retrive the cookie, it will delete the cookie after .get | .flash is used for seting the cookie only for one time. but remember that after using .get you have to set the cookie in the header, commitSession(session) the "session". But there is problem using flash, see 84 no video after 6:30
      session.set("nonce", nonce);
      const link = generateMagicLinks(email, nonce);
      console.log(link, "hello");
      await sendMagicLinkEmail(link, email);

      return data(
        { "ok": link },
        { status: 200, headers: { "Set-Cookie": await commitSession(session) } }
      );
    },
    (errors) => json({ errors, email: formData.get("email") }, { status: 400 })
  );
};

// we are not using Fetcher to submit the form that's why we will use action to get the data

export default function Login() {
  const actionData = useActionData();
  // console.log(actionData);

  return (
    <div className="text-center mt-36">
      {actionData === "ok" ? (
        <>
          <div>Please check your email</div>{" "}
          <div className="mt-1 p-1 rounded bg-slate-300">
            Demo: <a href={actionData?.ok}>Click this</a>
          </div>
        </>
      ) : (
        <div>
          <h1 className="text-3xl mb-8">Remix Recipes</h1>
          <form method="post" className="mx-auto md:w-1/3">
            <div className="text-left pb-4">
              <PrimaryInput
                type="email"
                placeholder="Email"
                autoComplete="off"
                name="email"
                defaultValue={actionData?.email}
              />
              <ErrorMessage>{actionData?.errors?.email}</ErrorMessage>
            </div>

            <PrimaryButton className={classNames("w-1/3 mx-auto")}>
              Log In
            </PrimaryButton>
          </form>{" "}
        </div>
      )}
    </div>
  );
}

// async ({ email }) => {
//   const user = await getUser(email);
//   if (user === null) {
//     return json(
//       { errors: { email: "User with this email doesn't exist!" } },
//       { status: 401 }
//     );
//   }

//   // in general way or how web works
//   // return data({user}, {
//   //   headers: {
//   //       "Set-Cookie": `remix-recipes__userId=${user.id}; HttpOnly; Secure`
//   //   }
//   // })

//   return data({user}, {
//     headers: {
//            // .serialize function does 2 things. 1st it call JSON.stringify(value), that means, we can store an object with several attribute in a cookie. 2nd it encodes the value with base64
//            // remember that encodes and encryptions are not same thing.
//            // not all charecters are reliably handled by the web browsers, in the value there can be uncommon char or binary data which can be corupted by the web browsers, that's why cookie is being saved by base64 encoding the value
//         "Set-Cookie": await sessionCookie.serialize({userId : user.id}) // serialize returns promise, that's why we have to use await. Then pass the cookie value in it.
//     }
//   })
// },
