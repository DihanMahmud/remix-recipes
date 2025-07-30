import {
  ActionFunction,
  data,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import classNames from "classnames";
import { z } from "zod";
import { ErrorMessage, PrimaryButton, PrimaryInput } from "~/components/form";
import { getMagicLinkPayload, throwError } from "~/magic-links.server";
import { createUser, getUser } from "~/models/user.server";
import { commitSession, getSession } from "~/sessions";
import { validateForm } from "~/utils/validation";

const magicLinkMaxAge = 1000 * 60 * 10; // 10 minute

export const loader: LoaderFunction = async ({ request }) => {
  const magicLinkPayload = getMagicLinkPayload(request);
  // console.log(magicLinkPayload, "8");

  // validate expiration time
  const createdAt = new Date(magicLinkPayload.createAt);
  const expiresAt = createdAt.getTime() + magicLinkMaxAge;

  if (Date.now() > expiresAt) {
    throw throwError("The magic link has expired");
  }

  // validate nonce
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);
  // console.log(session.get("nonce"), session);

  if (session.get("nonce") !== magicLinkPayload.nonce) {
    session.unset("nonce");
    throw throwError("Invalid Nonce");
  }

  const user = await getUser(magicLinkPayload.email);

  if (user) {
    session.set("userId", user.id);
    session.unset("nonce");
    return redirect("/app", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  return data(
    { OK: "Alright" },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};

const signUpSchema = z.object({
  firstName: z.string().min(1, "First Name cannot be blank."),
  lastName: z.string().min(1, "Last Name cannot be blank."),
});

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  return validateForm(
    formData,
    signUpSchema,
    async ({ firstName, lastName }) => {
      const magicLinkPayload = getMagicLinkPayload(request);

      const user = await createUser(
        magicLinkPayload.email,
        firstName,
        lastName
      );

      const cookieHeader = request.headers.get("cookie");
      const session = await getSession(cookieHeader);

      session.set("userId", user.id);
      session.unset("nonce");

      return redirect("/app", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    },
    (errors) =>
      data(
        {
          errors,
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
        },
        { status: 400 }
      )
  );
};

export default function ValidMagicLink() {
  const actionData = useActionData();
  console.log(actionData);

  return (
    <div className="text-center">
      <div className="mt-24">
        <h1 className="text-2xl my-8">You're almost done!</h1>
        <h2>Type your name below to complete your signup process!</h2>

        <form
          method="post"
          className={classNames(
            "flex flex-col px-8 mx-16 md:mx-auto",
            "border-2 border-gray-200 rounded-md p-8 mt-8 md:w-80"
          )}
        >
          <fieldset className="mb-8 flex flex-col">
            <div className="text-left mb-4">
              <label htmlFor="firstName">First Name</label>
              <PrimaryInput
                type="text"
                autoComplete="off"
                id="firstName"
                name="firstName"
                defaultValue={actionData?.firstName}
              />
              <ErrorMessage>{actionData?.errors?.firstName}</ErrorMessage>
            </div>

            <div className="text-left">
              <label htmlFor="lastName">Last Name</label>
              <PrimaryInput
                type="text"
                autoComplete="off"
                id="lastName"
                name="lastName"
                defaultValue={actionData?.lastName}
              />
              <ErrorMessage>{actionData?.errors?.lastName}</ErrorMessage>
            </div>
          </fieldset>

          <PrimaryButton className="w-36 mx-auto">Sign Up</PrimaryButton>
        </form>
      </div>
    </div>
  );
}
