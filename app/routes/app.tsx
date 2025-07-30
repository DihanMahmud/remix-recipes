import { PageLayout } from "~/components/layout";

export default function App() {
  return (
    <PageLayout
      title="App"
      links={[
        { to: "recipes", label: "Recipes" },
        { to: "pantry", label: "Pantry" },
        { to: "grocery-list", label: "Grocery List" },
      ]}
    ></PageLayout>
  );
}

// export function ErrorBoundary() {

//   const error = useRouteError();

//   if (error instanceof Error) {
//     return(
//       <>
//       <p>{error.message}</p>
//       </>
//     )
//   }

//   return   <div>Something went wrong</div>

// }
