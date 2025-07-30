import { PageLayout } from "~/components/layout";

export default function Settings() {
  return (
    <PageLayout
      title="Settings"
      links={[
        { to: "app", label: "App" },
        { to: "profile", label: "Profile" },
      ]}
    ></PageLayout>
  );
}





// import { json, LoaderFunction } from "@remix-run/node";
// import { Link, Outlet, useLoaderData } from "@remix-run/react";
// import { useMatchsData } from "~/utils/misc";

// export const loader: LoaderFunction = () => {
//   return new Response(JSON.stringify({message: "Hello, Dihan!"}), {
//     status: 200,
//     headers: {
//       custom: "hey",
//       "Content-Type" : "application/json",
//     }
//   });
// }

// export default function Settings() {
//   // const data = useLoaderData<typeof loader>();
//   // console.log(data);

//   // useMatchsData to match the route and pass the data from parent to child component or vice verca
//   const data = useMatchsData("routes/settings/profile")
//   // console.log(data);

//     return (
//       <div className="">
//         <h1 className="">Settings</h1>
//         <p>This is the Settings page. Hello, Settings!</p>
//         <p>The message is only for profile data : { data?.message }</p>
//         <nav>
//             <Link to='app'>App</Link>
//             <Link to='profile'>Profile</Link>
//         </nav>
//         <Outlet />
//       </div>
//     )
//   }

//  export function ErrorBoundary(){
//   return <div>Something went wrong!</div>
//  }
