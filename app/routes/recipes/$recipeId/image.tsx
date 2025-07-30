import { LoaderFunctionArgs } from "@remix-run/node";

import { getStorageKey, fileStorage } from "~/recipe-image-storage.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const recipeId = params.recipeId;
  if (!recipeId) {
    throw new Response("Recipe ID is required", { status: 400 });
  }

  const key = getStorageKey(recipeId);
  const file = await fileStorage.get(key);

  if (!file) {
    throw new Response("Recipe image is not found", { status: 404 });
  }

  return new Response(file.stream(), {
    headers: {
        "Content-Type": file.type,
    }
  })

}
