import {
  ActionFunction,
  ActionFunctionArgs,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import {
  Form,
  Link,
  NavLink,
  Outlet,
  ShouldRevalidateFunctionArgs,
  useFetchers,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import classNames from "classnames";
import { DeleteButton, PrimaryButton, SearchBar } from "~/components/form";
import { Calender, PlusIcon } from "~/components/icons";
import {
  RecipeCard,
  RecipeDetailWrapper,
  RecipeListWrapper,
  RecipePageWrapper,
} from "~/components/recipes";
import db from "~/db.server";
import { requireLoggedInUser } from "~/utils/auth.server";
import { useBuildSearchParams } from "~/utils/misc";
import { isOpeningOrClosing } from "~/utils/revalidation";

export function shouldRevalidate(arg: ShouldRevalidateFunctionArgs) {
  //  console.log(!isOpeningOrClosing(arg), "recipe");

  return !isOpeningOrClosing(arg);
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireLoggedInUser(request);
  const url = new URL(request.url);

  const q = url.searchParams.get("q");
  const filter = url.searchParams.get("filter");

  const recipes = await db.recipe.findMany({
    where: {
      userId: user.id,
      name: {
        contains: q ?? "",
        mode: "insensitive",
      },
      mealPlanMultiplier: filter === "mealPlanOnly" ? { not: null } : {},
    },
    select: {
      id: true,
      name: true,
      totalTime: true,
      imageUrl: true,
      mealPlanMultiplier: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // console.log(recipes);

  return json({ recipes });
};

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireLoggedInUser(request);

  const formData = await request.formData();

  switch (formData.get("_action")) {
    case "createRecipe": {
      const recipe = await db.recipe.create({
        data: {
          name: "New Recipe",
          instructions: "",
          totalTime: "0 minutes",
          imageUrl: "https://picsum.photos/400/300?random=1",
          userId: user.id,
        },
      });

      const url = new URL(request.url);

      // console.log(url);
      url.pathname = `/app/recipes/${recipe.id}`;

      console.log(url);

      return redirect(url.toString());
    }

    case "clearMealPlan": {
      await db.recipe.updateMany({
        where: { userId: user.id },
        data: {
          mealPlanMultiplier: null,
        },
      });

      return redirect("/app/recipes");
    }

    default: {
      return null;
    }
  }
}

interface Recipe {
  id: string;
  name: string;
  mealPlanMultiplier: number | null;
  totalTime: string;
  imageUrl: string;
}

export default function Recipes() {
  const data = useLoaderData<typeof loader>();
  const location = useLocation();
  const navigation = useNavigation();
  // console.log(navigation);
  // console.log(location);
  //   console.log(data);

  const fetchers = useFetchers();
  // console.log(fetchers);

  const [searchParams] = useSearchParams();

  const mealPlanOnlyFilterOn = searchParams.get("filter") === "mealPlanOnly";
  // console.log(mealPlanOnlyFilterOn);

  const buildSearchParams = useBuildSearchParams();

  return (
    <RecipePageWrapper>
      <RecipeListWrapper>
        <div className=" flex gap-4">
          <SearchBar placeholder="Search Recipe..." className="flex-grow" />
          <Link
            reloadDocument
            to={buildSearchParams(
              "filter",
              mealPlanOnlyFilterOn ? "" : "mealPlanOnly"
            )}
            className={classNames(
              "flex flex-col justify-center border-2 border-primary rounded-md px-2",
              mealPlanOnlyFilterOn ? "text-white bg-primary" : "text-primary"
            )}
          >
            <Calender />
          </Link>
        </div>
        <Form method="post" className="mt-4">
          {mealPlanOnlyFilterOn ? (
            <DeleteButton
              name="_action"
              value="clearMealPlan"
              className="w-full"
            >
              Clear Plan
            </DeleteButton>
          ) : (
            <PrimaryButton
              name="_action"
              value="createRecipe"
              className="w-full"
            >
              <div className="flex justify-center w-full">
                <PlusIcon></PlusIcon>
                <span className="ml-2">Create New Recipe</span>
              </div>
            </PrimaryButton>
          )}
        </Form>
        <ul>
          {data?.recipes.map((recipe: Recipe) => {
            const isLoading = navigation.location?.pathname.endsWith(recipe.id);

            const optimisticData = new Map();

            for (const fetcher of fetchers) {
              if (fetcher.formAction?.includes(recipe.id)) {
                // console.log(fetcher.formData?.get("totalTime"));

                if (fetcher.formData?.get("_action") === "saveName") {
                  optimisticData.set("name", fetcher.formData?.get("name"));
                }

                if (fetcher.formData?.get("_action") === "saveTotalTime") {
                  optimisticData.set(
                    "totalTime",
                    fetcher.formData?.get("totalTime")
                  );
                }
              }
            }

            return (
              <li className="my-4" key={recipe.id}>
                <NavLink to={{ pathname: recipe.id, search: location.search }} prefetch="intent">
                  {(isActive) => (
                    <RecipeCard
                      name={optimisticData.get("name") ?? recipe.name}
                      totalTime={
                        optimisticData.get("totalTime") ?? recipe.totalTime
                      }
                      mealPlanMultiplier={recipe.mealPlanMultiplier}
                      imageUrl={recipe.imageUrl}
                      isActive={isActive.isActive}
                      isLoading={isLoading}
                    ></RecipeCard>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </RecipeListWrapper>
      <RecipeDetailWrapper>
        <Outlet />
      </RecipeDetailWrapper>
    </RecipePageWrapper>
  );
}
