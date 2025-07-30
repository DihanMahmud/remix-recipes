// import {
//   data,
//   HeadersArgs,
//   json,
//   LoaderFunctionArgs,
// } from "@remix-run/node";
// import { useLoaderData } from "@remix-run/react";
// import {
//   DiscoverRecipeDetails,
//   DiscoverRecipeHeader,
// } from "~/components/discover";
// import db from "~/db.server";
// import { getCurrentUser } from "~/utils/auth.server";
// import { hash } from "~/utils/cryptography.server";

//   export function headers({ loaderHeaders }: HeadersArgs) {
//     return {
//       etag: loaderHeaders.get("x-page-etag"),
//       "Cache-Control": `max-age=3600, stale-while-revalidate=${3600 * 24 * 7}`
//     };
//   }

// /*
//  headers doesn't work without function.
//  if-none-match is not showing in the headers.
//  if i login/out the page is being cache thats why it doesn't show the proper UI while login/out
// */

// export async function loader({ params, request }: LoaderFunctionArgs) {
//   const recipe = await db.recipe.findUnique({
//     where: { id: params.recipeId },
//     include: {
//       ingredients: {
//         select: {
//           id: true,
//           name: true,
//           amount: true,
//         },
//       },
//     },
//   });

//   if (recipe === null) {
//     throw json(`A recipe with this id ${params.recipeId} is not found`, {
//       status: 404,
//     });
//   }

//   const etag = hash(JSON.stringify(recipe));

//   // if (etag === request.headers.get("if-none-match")) {
//   //   return new Response(null, {
//   //     status: 304,
//   //   });
//   // }

//   const user = await getCurrentUser(request)
//   const pageEtag = `${hash(user?.id ?? "anonymous")}.${etag}`

//   return data({recipe}, { headers: { etag, "x-page-etag": pageEtag, "Cache-Control": "max-age=30, stale-while-revalidate=60" } });
// }

// export default function DiscoverRecipe() {
//   const data = useLoaderData<typeof loader>();
//   return (
//     <div className="md:h-[calc(100vh-1rem)] m-[-1rem] overflow-auto">
//       <DiscoverRecipeHeader recipe={data.recipe} />
//       <DiscoverRecipeDetails recipe={data.recipe} />
//     </div>
//   );
// }



import {
  data,
  HeadersArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  DiscoverRecipeDetails,
  DiscoverRecipeHeader,
} from "~/components/discover";
import db from "~/db.server";
import { getCurrentUser } from "~/utils/auth.server";
import { hash } from "~/utils/cryptography.server";

export function headers({ loaderHeaders }: HeadersArgs) {
  return {
    "Cache-Control": loaderHeaders.get("Cache-Control") ?? "no-cache",
    "Vary": "Cookie, Authorization",
    "ETag": loaderHeaders.get("x-page-etag"),
  };
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  // First, get the authentication state - do this BEFORE any caching logic
  const user = await getCurrentUser(request);
  const userContext = user?.id ?? "anonymous";
  
  // Generate the authentication-specific part of the ETag
  const authEtag = hash(userContext);
  
  // Extract the If-None-Match header
  const ifNoneMatch = request.headers.get("if-none-match");
  
  // Fetch data from database
  const recipe = await db.recipe.findUnique({
    where: { id: params.recipeId },
    include: {
      ingredients: {
        select: {
          id: true,
          name: true,
          amount: true,
        },
      },
    },
  });

  if (recipe === null) {
    throw json(`A recipe with this id ${params.recipeId} is not found`, {
      status: 404,
    });
  }

  // Generate the data-specific part of the ETag
  const dataEtag = hash(JSON.stringify(recipe));
  
  // Combine auth and data ETags for a complete ETag that changes with either auth or data changes
  const combinedEtag = `${authEtag}_${dataEtag}`;
  
  // Check if the client's ETag matches our combined ETag
  if (ifNoneMatch === combinedEtag) {
    return new Response(null, {
      status: 304,
      headers: {
        "ETag": combinedEtag,
        "Vary": "Cookie, Authorization" 
      }
    });
  }

  // Set cache headers based on authentication state
  const cacheControl = user 
    ? "private, max-age=30, stale-while-revalidate=60" // Authenticated - private cache only
    : "public, max-age=3600, stale-while-revalidate=86400"; // Anonymous - can use public cache
  
  return data(
    { recipe },
    { 
      headers: { 
        "x-page-etag": combinedEtag,
        "ETag": combinedEtag,
        "Cache-Control": cacheControl,
        "Vary": "Cookie, Authorization"
      } 
    }
  );
}

export default function DiscoverRecipe() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="md:h-[calc(100vh-1rem)] m-[-1rem] overflow-auto">
      <DiscoverRecipeHeader recipe={data.recipe} />
      <DiscoverRecipeDetails recipe={data.recipe} />
    </div>
  );
}