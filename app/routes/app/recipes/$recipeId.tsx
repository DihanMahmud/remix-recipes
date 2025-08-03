import {
  ActionFunctionArgs,
  data,
  HeadersFunction,
  json,
  LoaderFunctionArgs,
  redirect,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  Link,
  Outlet,
  ShouldRevalidateFunctionArgs,
  useActionData,
  useFetcher,
  useLoaderData,
  useOutletContext,
  useRouteError,
} from "@remix-run/react";
import classNames from "classnames";
import React from "react";
import { z } from "zod";
import {
  DeleteButton,
  ErrorMessage,
  Input,
  PrimaryButton,
} from "~/components/form";
import { Calender, SaveIcon, TimeIcon, Trash } from "~/components/icons";
import db from "~/db.server";
import { handleDelete } from "~/models/utils";
import { canChangeRecipe } from "~/utils/abilities.server";
import { requireLoggedInUser } from "~/utils/auth.server";
import { useDebouncedFunction, useServerLayoutEffect } from "~/utils/misc";
import { isOpeningOrClosing } from "~/utils/revalidation";
import { validateForm } from "~/utils/validation";
import { getStore } from "@netlify/blobs";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

export function shouldRevalidate(arg: ShouldRevalidateFunctionArgs) {
  // console.log(!isOpeningOrClosing(arg), "id");

  return !isOpeningOrClosing(arg);
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return {
    "Cache-Control": loaderHeaders.get("Cache-Control") ?? "no-cache",
  };
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireLoggedInUser(request);
  const recipe = await db.recipe.findUnique({
    where: {
      id: params.recipeId,
    },
    include: {
      ingredients: {
        select: {
          id: true,
          name: true,
          amount: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (recipe === null) {
    throw json({ message: "Recipe doesn't found" }, { status: 404 });
  }

  if (recipe?.userId !== user.id) {
    throw json(
      { message: "You are not authorized to view this recipe" },
      { status: 401 }
    );
  }

  // console.log(recipe, "37.....");

  return json({ recipe }, { headers: { "Cache-Control": "max-age=60" } });

  // const response = json(
  //   { recipe },
  //   {
  //     headers: {
  //       "Cache-Control": "public, max-age=60",
  //     },
  //   }
  // );

  // console.log("header: ", request.headers.get("Cache-Control"));

  // return response
}

const saveNameSchema = z.object({
  name: z.string().min(1, "Name can't be blank"),
});

const saveTotalTimeSchema = z.object({
  totalTime: z.string().min(1, "Time can't be blank"),
});

const saveInstructionsSchema = z.object({
  instructions: z.string().min(1, "Instructions can't be blank"),
});

const saveIngredientAmountSchema = z.object({
  amount: z.string().nullable(),
  id: z.string().min(1, "Id is missing"),
});

const saveIngredientNameSchema = z.object({
  name: z.string().min(1, "Name can't be blank"),
  id: z.string().min(1, "Id is missing"),
});

const saveRecipeSchema = z
  .object({
    imageUrl: z.string().optional(),
    ingredientIds: z.array(z.string().min(1, "Id is missing")).optional(),
    ingredientAmounts: z.array(z.string().nullable()).optional(),
    ingredientNames: z
      .array(z.string().min(1, "Name can't be blank"))
      .optional(),
  })
  .and(saveNameSchema)
  .and(saveTotalTimeSchema)
  .and(saveInstructionsSchema)
  .refine(
    (data) =>
      data.ingredientIds?.length === data.ingredientAmounts?.length &&
      data.ingredientIds?.length === data.ingredientNames?.length,
    { message: "Ingredient arrays must all be same length" }
  );

const createIngredientSchema = z.object({
  newIngredientAmount: z.string().nullable(),
  newIngredientName: z.string().min(1, "Ingredient can't be blank"),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const recipeId = String(params.recipeId);
  await canChangeRecipe(request, recipeId);

  // file uploading in previous version

  let formData;

  if (request.headers.get("Content-Type")?.includes("multipart/form-data")) {
    // const uploadHandler = ({filename, contentType, name, data}) => {
    //   // return file | string | null | undefined
    //   return null
    // }
    // formData = await unstable_parseMultipartFormData(request, uploadHandler)

    // const uploadHandler = unstable_composeUploadHandlers(
    //   unstable_createFileUploadHandler({ directory: "public/images" }),
    //   unstable_createMemoryUploadHandler()
    // );
    // formData = await unstable_parseMultipartFormData(request, uploadHandler);
    // // console.log(formData, "148");

    // const image = formData.get("image") as File;
    // // console.log(image, "151");

    // if (image.size !== 0) {
    //   formData.set("imageUrl", `/images/${image.name}`);
    // }

    // Check if we're in Netlify environment
    // const isNetlifyEnvironment =
    //   process.env.NETLIFY === "true" || process.env.NODE_ENV === "production";

    // async function handleImageUpload(image: File): Promise<string> {
    //   const timestamp = Date.now();
    //   const extension = image.name.split(".").pop() || "jpg";
    //   const filename = `recipe-${timestamp}-${Math.random()
    //     .toString(36)
    //     .substring(7)}.${extension}`;

    //   if (isNetlifyEnvironment) {
    //     // Production: Use Netlify Blobs
    //     const store = getStore("recipe-images");
    //     const buffer = await image.arrayBuffer();

    //     await store.set(filename, buffer, {
    //       metadata: {
    //         contentType: image.type,
    //         originalName: image.name,
    //         uploadedAt: new Date().toISOString(),
    //       },
    //     });

    //     return `/api/images/${filename}`;
    //   } else {
    //     // Development: Use local file system
    //     const buffer = Buffer.from(await image.arrayBuffer());
    //     const uploadsDir = join(process.cwd(), "public", "images");

    //     // Create directory if it doesn't exist
    //     if (!existsSync(uploadsDir)) {
    //       mkdirSync(uploadsDir, { recursive: true });
    //     }

    //     // Write file locally
    //     const filePath = join(uploadsDir, filename);
    //     writeFileSync(filePath, buffer);

    //     return `/images/${filename}`;
    //   }
    // }

    // Fix the environment detection
    const isNetlifyEnvironment =
      process.env.NETLIFY === "true" ||
      process.env.AWS_LAMBDA_FUNCTION_NAME || // Netlify Functions run on AWS Lambda
      process.env.LAMBDA_TASK_ROOT ||
      !process.env.NODE_ENV ||
      process.env.NODE_ENV === "production";

    async function handleImageUpload(image: File): Promise<string> {
      const timestamp = Date.now();
      const extension = image.name.split(".").pop() || "jpg";
      const filename = `recipe-${timestamp}-${Math.random()
        .toString(36)
        .substring(7)}.${extension}`;

      console.log("Environment check:", {
        NETLIFY: process.env.NETLIFY,
        NODE_ENV: process.env.NODE_ENV,
        AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
        isNetlifyEnvironment,
      });

      if (isNetlifyEnvironment) {
        console.log("Using Netlify Blobs");
        // Production: Use Netlify Blobs
        const store = getStore("recipe-images");
        const buffer = await image.arrayBuffer();

        await store.set(filename, buffer, {
          metadata: {
            contentType: image.type,
            originalName: image.name,
            uploadedAt: new Date().toISOString(),
          },
        });

        return `/api/images/${filename}`;
      } else {
        console.log("Using local file system");
        // Development: Use local file system
        const buffer = Buffer.from(await image.arrayBuffer());
        const uploadsDir = join(process.cwd(), "public", "images");

        // Create directory if it doesn't exist
        if (!existsSync(uploadsDir)) {
          mkdirSync(uploadsDir, { recursive: true });
        }

        // Write file locally
        const filePath = join(uploadsDir, filename);
        writeFileSync(filePath, buffer);

        return `/images/${filename}`;
      }
    }

    // Your updated upload handler
    const uploadHandler = unstable_createMemoryUploadHandler({
      maxPartSize: 5_000_000, // 5MB limit
    });

    formData = await unstable_parseMultipartFormData(request, uploadHandler);
    const image = formData.get("image") as File;

    if (image && image.size !== 0) {
      const imageUrl = await handleImageUpload(image);
      formData.set("imageUrl", imageUrl);
    }
  } else {
    formData = await request.formData();
    // console.log(formData.entries(), "141");
  }

  // const formData = await request.formData();
  // console.log(Object.fromEntries(formData), formData.get("totalTime"));

  const _action = formData.get("_action");
  // console.log(_action, "75");

  if (typeof _action === "string" && _action.includes("deleteIngredient")) {
    // console.log(ingredientId, "80"); log -> [ 'deleteIngredient', 'cm84fbvmx000tyl64g8y6juy5' ]
    const ingredientId = _action.split(".")[1];

    return handleDelete(() =>
      db.ingredient.delete({ where: { id: ingredientId } })
    );
  }

  switch (_action) {
    case "saveRecipe": {
      return validateForm(
        formData,
        saveRecipeSchema,
        ({ ingredientIds, ingredientNames, ingredientAmounts, ...data }) =>
          db.recipe.update({
            where: { id: recipeId },
            data: {
              ...data,
              ingredients: {
                updateMany: ingredientIds?.map((id, index) => ({
                  where: { id },
                  data: {
                    amount: ingredientAmounts?.[index],
                    name: ingredientNames?.[index],
                  },
                })),
              },
            },
          }),
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "createIngredient": {
      return validateForm(
        formData,
        createIngredientSchema,
        ({ newIngredientAmount, newIngredientName }) =>
          db.ingredient.create({
            data: {
              recipeId,
              amount: newIngredientAmount,
              name: newIngredientName,
            },
          }),
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "deleteRecipe": {
      await handleDelete(() => db.recipe.delete({ where: { id: recipeId } }));
      return redirect("/app/recipes");
    }

    case "saveName": {
      return validateForm(
        formData,
        saveNameSchema,
        (data) => db.recipe.update({ where: { id: recipeId }, data }),
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "saveTotalTime": {
      return validateForm(
        formData,
        saveTotalTimeSchema,
        (data) => db.recipe.update({ where: { id: recipeId }, data }),
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "saveInstructions": {
      return validateForm(
        formData,
        saveInstructionsSchema,
        (data) => db.recipe.update({ where: { id: recipeId }, data }),
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "saveIngredientAmount": {
      return validateForm(
        formData,
        saveIngredientAmountSchema,
        ({ id, amount }) =>
          db.ingredient.update({ where: { id }, data: { amount } }),
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "saveIngredientName": {
      return validateForm(
        formData,
        saveIngredientNameSchema,
        ({ id, name }) =>
          db.ingredient.update({ where: { id }, data: { name } }),
        (errors) => json({ errors }, { status: 400 })
      );
    }

    default: {
      return null;
    }
  }
}

export function useRecipeContext() {
  return useOutletContext<{
    recipeName?: string;
    mealPlanMultiplier?: number | null;
  }>();
}

export default function Recipe() {
  const data = useLoaderData();
  const actionData = useActionData();
  // console.log(actionData);

  const saveNameFetcher = useFetcher();
  const saveTotalTimeFetcher = useFetcher();
  const saveInstructionsFetcher = useFetcher();
  const createIngredientFetcher = useFetcher();
  const { renderedIngredients, addIngredient } = useOptimisticIngredients(
    data.recipe.ingredients,
    createIngredientFetcher.state
  );
  const [ingredientForm, setIngredientForm] = React.useState({
    amount: "",
    name: "",
  });
  const newIngredientAmountRef = React.useRef<HTMLInputElement>(null);

  const saveName = useDebouncedFunction((name: string) => {
    // console.log(name, "252");

    return saveNameFetcher.submit(
      {
        _action: "saveName",
        name, // it has to be the name attribute of the input tag (not sure), but it has to be the name like the database has
      },
      { method: "post" }
    );
  }, 2000);

  const saveTotalTime = useDebouncedFunction(
    (totalTime: string) =>
      saveTotalTimeFetcher.submit(
        {
          _action: "saveTotalTime",
          totalTime, // it has to be the name attribute of the input tag (not sure), but it has to be the name like the database has
        },
        { method: "post" }
      ),
    2000
  );

  const saveInstructions = useDebouncedFunction(
    (instructions: string) =>
      saveInstructionsFetcher.submit(
        {
          _action: "saveInstructions",
          instructions, // it has to be the name attribute of the input tag (not sure), but it has to be the name like the database has
        },
        { method: "post" }
      ),
    2000
  );

  const createIngredientFn = () => {
    addIngredient(ingredientForm.amount, ingredientForm.name);
    createIngredientFetcher.submit(
      {
        _action: "createIngredient",
        newIngredientAmount: ingredientForm.amount,
        newIngredientName: ingredientForm.name,
      },
      { method: "post" }
    );
    setIngredientForm({ amount: "", name: "" });
    newIngredientAmountRef.current?.focus();
  };

  return (
    <>
      <Outlet
        context={{
          recipeName: data.recipe?.name,
          mealPlanMultiplier: data.recipe?.mealPlanMultiplier,
        }}
      ></Outlet>
      <Form method="post" encType="multipart/form-data" reloadDocument>
        <button name="_action" value="saveRecipe" className=" hidden" />
        <div className="flex mb-2">
          <Link
            to="update-meal-plan"
            replace
            className={classNames(
              "flex flex-col justify-center",
              data.recipe?.mealPlanMultiplier !== null ? "text-primary" : ""
            )}
          >
            <Calender />
          </Link>
          <div className="ml-2 flex-grow">
            <Input
              key={data.recipe?.id}
              type="text"
              autoComplete="off"
              name="name"
              placeholder="Recipe Name"
              className="text-2xl font-extrabold"
              defaultValue={data.recipe?.name}
              error={
                !!(
                  saveNameFetcher?.data?.errors?.name ??
                  actionData?.errors?.name
                )
              }
              onChange={(e) => saveName(e.target.value)}
            />

            <ErrorMessage>
              {" "}
              {saveNameFetcher?.data?.errors?.name ??
                actionData?.errors?.name}{" "}
            </ErrorMessage>
          </div>
        </div>

        <div className="flex">
          <TimeIcon />
          <div className="ml-2 flex-grow">
            <Input
              key={data.recipe?.id}
              name="totalTime"
              autoComplete="off"
              type="text"
              placeholder="Time"
              defaultValue={data.recipe?.totalTime}
              error={
                !!(
                  saveTotalTimeFetcher?.data?.errors?.totalTime ??
                  actionData?.errors?.totalTime
                )
              }
              onChange={(e) => saveTotalTime(e.target.value)}
            />

            <ErrorMessage>
              {saveTotalTimeFetcher?.data?.errors?.totalTime ??
                actionData?.errors?.totalTime}
            </ErrorMessage>
          </div>
        </div>

        <div className="grid grid-cols-[30%_auto_min-content] my-4 gap-2">
          <h2 className="font-bold text-sm pb-1">Amount</h2>
          <h2 className="font-bold text-sm pb-1">Name</h2>
          <div></div>
          {renderedIngredients.map((ingredient, idx) => (
            <IngredientRow
              key={ingredient.id}
              id={ingredient.id}
              amount={ingredient.amount}
              name={ingredient.name}
              amountError={actionData?.errors?.[`ingredientAmounts.${idx}`]}
              nameError={actionData?.errors?.[`ingredientNames.${idx}`]}
              isOptimistic={ingredient?.isOptimistic}
            />
          ))}

          <div>
            <Input
              // ref={newIngredientAmountRef}
              ref={newIngredientAmountRef}
              type="text"
              autoComplete="off"
              name="newIngredientAmount"
              className="border-b-gray-200"
              error={
                !!(
                  createIngredientFetcher?.data?.errors?.newIngredientAmount ??
                  actionData?.errors?.newIngredientAmount
                )
              }
              value={ingredientForm.amount}
              onChange={(e) =>
                setIngredientForm((values) => ({
                  ...values,
                  amount: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createIngredientFn();
                }
              }}
            />
            <ErrorMessage>
              {createIngredientFetcher?.data?.errors?.newIngredientAmount ??
                actionData?.errors?.newIngredientAmount}{" "}
            </ErrorMessage>
          </div>
          <div>
            <Input
              type="text"
              autoComplete="off"
              name="newIngredientName"
              className="border-b-gray-200"
              error={
                !!(
                  createIngredientFetcher?.data?.errors?.newIngredientName ??
                  actionData?.errors?.newIngredientName
                )
              }
              value={ingredientForm.name}
              onChange={(e) =>
                setIngredientForm((values) => ({
                  ...values,
                  name: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createIngredientFn();
                }
              }}
            />
            <ErrorMessage>
              {createIngredientFetcher?.data?.errors?.newIngredientName ??
                actionData?.errors?.newIngredientName}
            </ErrorMessage>
          </div>
          <button
            name="_action"
            value="createIngredient"
            onClick={(e) => {
              // default behavior of a button is full page refresh, e.preventDefault(); it is used to prevent default behavior
              e.preventDefault();
              createIngredientFn();
            }}
          >
            <SaveIcon />
          </button>
        </div>

        <label
          htmlFor="instructions"
          className="block font-bold text-sm pb-2 w-fit"
        >
          Instructions
        </label>
        <textarea
          key={data.recipe?.id}
          id="instructions"
          name="instructions"
          placeholder="Instructions go here"
          defaultValue={data.recipe?.instructions}
          onChange={(e) => saveInstructions(e.target.value)}
          className={classNames(
            "w-full h-56 rounded-md outline-none",
            "focus:border-2 focus:p-3 focus:border-primary duration-300",
            !!(
              saveInstructionsFetcher?.data?.errors?.instructions ??
              actionData?.errors?.instructions
            )
              ? "border-2 border-red-500 p-3"
              : ""
          )}
        ></textarea>
        <ErrorMessage>
          {" "}
          {saveInstructionsFetcher?.data?.errors?.instructions ??
            actionData?.errors?.instructions}{" "}
        </ErrorMessage>
        <label
          htmlFor="image"
          className="text-sm font-bold block pb-2 w-fit mt-4"
        >
          Image
        </label>
        <input
          id="image"
          type="file"
          name="image"
          key={`${data.recipe?.id}.image`}
        />
        <hr className="my-4" />
        <div className="flex justify-between">
          <DeleteButton name="_action" value="deleteRecipe">
            Delete this Recipe
          </DeleteButton>
          <PrimaryButton name="_action" value="saveRecipe">
            <div className="flex flex-col justify-center h-full">Save</div>
          </PrimaryButton>
        </div>
      </Form>
    </>
  );
}

type IngredientRowProps = {
  id: string;
  amount: string | null;
  amountError?: string;
  name: string;
  nameError?: string;
  isOptimistic?: boolean;
};

function IngredientRow({
  id,
  amount,
  amountError,
  name,
  nameError,
  isOptimistic,
}: IngredientRowProps) {
  const saveAmountFetcher = useFetcher();
  const saveIngreNameFetcher = useFetcher();
  const deleteIngredientFetcher = useFetcher();

  const saveAmount = useDebouncedFunction((amount: string) => {
    console.log(amount, id, "437");

    return saveAmountFetcher.submit(
      {
        _action: "saveIngredientAmount",
        amount,
        id,
      },
      { method: "post" }
    );
  }, 2000);

  const saveIngreName = useDebouncedFunction(
    (name: string) =>
      saveIngreNameFetcher.submit(
        {
          _action: "saveIngredientName",
          name,
          id,
        },
        { method: "post" }
      ),
    2000
  );
  return deleteIngredientFetcher.state !== "idle" ? null : (
    <React.Fragment>
      <input type="hidden" name="ingredientIds[]" value={id} />
      <div>
        <Input
          type="text"
          autoComplete="off"
          name="ingredientAmounts[]"
          defaultValue={amount ?? ""}
          error={!!(saveAmountFetcher.data?.errors?.amount ?? amountError)}
          onChange={(e) => saveAmount(e.target.value)}
          disabled={isOptimistic}
        />
        <ErrorMessage>
          {" "}
          {saveAmountFetcher.data?.errors?.amount ?? amountError}
        </ErrorMessage>
      </div>
      <div>
        <Input
          type="text"
          autoComplete="off"
          name="ingredientNames[]"
          defaultValue={name}
          error={!!(saveIngreNameFetcher.data?.errors?.name ?? nameError)}
          onChange={(e) => saveIngreName(e.target.value)}
          disabled={isOptimistic}
        />
        <ErrorMessage>
          {" "}
          {saveIngreNameFetcher.data?.errors?.name ?? nameError}{" "}
        </ErrorMessage>
      </div>
      <button
        name="_action"
        value={`deleteIngredient.${id}`}
        disabled={isOptimistic}
        onClick={(e) => {
          e.preventDefault();
          deleteIngredientFetcher.submit(
            {
              _action: `deleteIngredient.${id}`,
            },
            { method: "post" }
          );
        }}
      >
        <Trash />
      </button>
    </React.Fragment>
  );
}

type RenderedIngredient = {
  name: string;
  id: string;
  amount: string | null;
  isOptimistic?: boolean;
};

function useOptimisticIngredients(
  savedIngredients: Array<RenderedIngredient>,
  createIngredientState: "idle" | "submitting" | "loading"
) {
  const [optimisticIngredients, setOptimisticIngredients] = React.useState<
    Array<RenderedIngredient>
  >([]);

  const renderedIngredients = [...savedIngredients, ...optimisticIngredients];

  // renderedIngredients.sort((a, b) => {
  //   if (a.name === b.name) return 0;
  //   return a.name < b.name ? -1 : 1;
  // });

  // React.useLayoutEffect(() => {
  //   setOptimisticItems([]);
  // }, [savedItems]);
  useServerLayoutEffect(() => {
    if (createIngredientState === "idle") {
      setOptimisticIngredients([]);
    }
  }, [createIngredientState]);

  const addIngredient = (amount: string | null, name: string) => {
    setOptimisticIngredients((ingredients) => [
      ...ingredients,
      { id: createItemId(), name, amount, isOptimistic: true },
    ]);
  };

  return { renderedIngredients, addIngredient };
}

function createItemId() {
  return `${Math.round(Math.random() * 1_000_000)}`;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="bg-red-600 text-white rounded-md p-4">
        <h1 className="mb-2">
          {error.status} - {error.statusText}
        </h1>
        <p>{error.data.message}</p>
      </div>
    );
  }
  return (
    <div className="bg-red-600 text-white rounded-md p-4">
      <h1 className="mb-2">An unexpected error occoured</h1>
    </div>
  );
}

// const uploadHandler = async (fileUpload: FileUpload) => {
//   console.log(fileUpload, "137");

//   if (fileUpload.fieldName === "image") {
//     console.log(fileUpload, "140");

//     const key = getStorageKey(recipeId);
//     await fileStorage.set(key, fileUpload);
//     console.log(fileStorage.get(key), "142");

//     return fileStorage.get(key);
//   }
// };

// const formData = await parseFormData(request, uploadHandler);
