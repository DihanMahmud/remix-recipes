import { LoaderFunction } from "@remix-run/node"
import { useLoaderData, useRouteError } from "@remix-run/react"

export const loader: LoaderFunction = () => {
  return new Response(JSON.stringify({message: "Hey bro!"}), {
    status: 200,
    headers: {
      "Content-Type" : "application/json",
      custom: "dihan mahmud"
    }
  })
}

export default function Profile() {
  const data = useLoaderData<typeof loader>();
    return (
      <div className="">
        <h1 className=" text-3xl">Profile</h1>
        <p>This is the Profile page. Hello, Profile!</p>
        <p> The message is {data.message}</p>
      </div>
    )
}

export function ErrorBoundary(){
  const error = useRouteError();

  if (error instanceof Error) {
    return <div className="bg-red-300 border-2 border-red-600 rounded-md p-4">
    <h1>Woops, Something went wrong!</h1>
    <p>{error.message}</p>
  </div>
  }

  return <div className="bg-red-300 border-2 border-red-600 rounded-md p-4">Unexpected Error!</div>


}
  