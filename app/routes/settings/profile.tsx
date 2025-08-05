import { LoaderFunction } from "@remix-run/node";
import { useLoaderData, useRouteError } from "@remix-run/react";
import { getCurrentUser } from "~/utils/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const data = await getCurrentUser(request);

  return data;

  // return new Response(JSON.stringify({ message: "Hey bro!" }), {
  //   status: 200,
  //   headers: {
  //     "Content-Type": "application/json",
  //     custom: "dihan mahmud",
  //   },
  // });
};

export default function Profile() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="">
      <h1 className=" text-3xl">Profile</h1>
      {data === null ? (
        <p>Please Login First</p>
      ) : (
        <>
          <p>
            <span className="font-semibold">Name: </span>
            {data.firstName} {data.lastName}
          </p>
          <p>
            <span className="font-semibold">Email: </span>
            {data.email}
          </p>
        </>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (error instanceof Error) {
    return (
      <div className="bg-red-300 border-2 border-red-600 rounded-md p-4">
        <h1>Woops, Something went wrong!</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-red-300 border-2 border-red-600 rounded-md p-4">
      Unexpected Error!
    </div>
  );
}
