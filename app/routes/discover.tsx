import { json, useLoaderData } from "@remix-run/react"
import { DiscoverGrid, DiscoverListItem } from "~/components/discover"
import db from "~/db.server"

// export function headers(){
//   return {
//     "Cache-Control": `max-age=3600, stale-while-revalidate=${3600 * 24 * 7}`
//   }
// }

export async function loader(){

  const recipes = await db.recipe.findMany({
    take: 25,
    orderBy: {updatedAt: "desc"},
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  })

  

  return json({recipes})
}

export default function Discover() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="md:h-[calc(100vh-1rem)] p-4 m-[-1rem] overflow-auto">
      <h1 className="text-2xl mb-4 font-bold">Discover</h1>
      <DiscoverGrid>
        {
          data.recipes.map((recipe => (
            <DiscoverListItem key={recipe.id} recipe={recipe}></DiscoverListItem>
          )))
        }
      </DiscoverGrid>
    </div>
  )
}
