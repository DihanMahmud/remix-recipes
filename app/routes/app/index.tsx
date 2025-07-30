
// export default function Index() {
//   return (
//     <div>index page</div>
//   )
// }


// import { LoaderFunction } from "@remix-run/node";

// this is not only remix specific thing. This how redirects work in web. You can you it in any server-side framework
// export const loader: LoaderFunction = () => {
//     return new Response(null, {
//         status: 302,
//         headers: {
//             Location: "/app/pantry"
//         }
//     })
// }



import { LoaderFunction, redirect } from "@remix-run/node";

export const loader: LoaderFunction = () => {
    return redirect("/app/recipes")
}