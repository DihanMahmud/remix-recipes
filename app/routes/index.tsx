// import type { LinksFunction, MetaFunction } from "@remix-run/node";
// import styles from "~/styles/index.css?url"

// export const meta: MetaFunction = () => {
//   return [
//     { title: "New Remix App" },
//     { name: "description", content: "Welcome to Remix!" },
//   ];
// };

// export const links: LinksFunction = () => {
//   return [{
//     rel: "stylesheet",
//     href: styles
//   }]
// }

// export default function Index() {
//   return (
//     <div className="">
//       <h1 className=" text-5xl text-blue-600 font-bold underline">Home</h1>
//       <p>This is the Home page. Hello, Home!</p>
//     </div>
//   );
// }


import { redirect } from "@remix-run/node";

export function loader(){
  return redirect("/discover")
}