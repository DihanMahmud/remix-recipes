import { Form, Link, useActionData, useOutletContext } from "@remix-run/react";
import React from "react";
import ReactModal from "react-modal";
import {
  DeleteButton,
  ErrorMessage,
  IconInput,
  PrimaryButton,
} from "~/components/form";
import { XIcon } from "~/components/icons";
import { useRecipeContext } from "../$recipeId";
import { canChangeRecipe } from "~/utils/abilities.server";
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import db from "~/db.server";
import { z } from "zod";
import { validateForm } from "~/utils/validation";

if (typeof window !== "undefined") {
  ReactModal.setAppElement("#root");
}

type ActionData = {
  errors?: {
    mealPlanMultiplier?: string;
  };
};

const updateMealPlanSchema = z.object({
  mealPlanMultiplier: z.preprocess(
    (value) => parseInt(String(value)),
    z.number().min(1)
  ),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const recipeId = String(params.recipeId);
  await canChangeRecipe(request, recipeId);

  const formData = await request.formData();

  switch (formData.get("_action")) {
    case "updateMealPlan": {
      return validateForm(
        formData,
        updateMealPlanSchema,
        async (data) => {
          const mealPlanMultiplier = data.mealPlanMultiplier as number;
          await db.recipe.update({
            where: { id: recipeId },
            data: { mealPlanMultiplier },
          });
          return redirect("..");
        },
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "removeFromMealPlan": {
      await db.recipe.update({
        where: { id: recipeId },
        data: {
          mealPlanMultiplier: null,
        },
      });
      return redirect("..");
    }

    default: {
      return null;
    }
  }
}

export default function UpdateMealPlanModal() {
  const { recipeName, mealPlanMultiplier } = useRecipeContext();
  // const value = useOutletContext();
  // console.log(value); this is also OK, but for extra type checking we used the context;

  const actionData = useActionData<ActionData>();

  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => {
    setIsOpen(true);
  }, []);
  return (
    <>
      <ReactModal
        isOpen={isOpen}
        className="md:h-fit lg:w-1/2 md:mx-auto md:mt-24"
      >
        <div className=" p-4 bg-white rounded-md shadow-md">
          <div className="flex justify-between mb-8">
            <h1 className="font-bold text-lg">Update Meal Plan</h1>
            <Link to=".." replace>
              <XIcon />
            </Link>
          </div>

          <Form method="post" reloadDocument>
            <h2 className="mb-2">{recipeName}</h2>
            <IconInput
              icon={<XIcon />}
              defaultValue={mealPlanMultiplier ?? 1}
              autoComplete="off"
              type="number"
              name="mealPlanMultiplier"
            />

            <ErrorMessage>
              {actionData?.errors?.mealPlanMultiplier}
            </ErrorMessage>

            <div className="flex justify-end mt-8 gap-4">
              {mealPlanMultiplier !== null ? (
                <DeleteButton name="_action" value="removeFromMealPlan">
                  Remove from meal plan
                </DeleteButton>
              ) : null}
              <PrimaryButton name="_action" value="updateMealPlan">
                Save
              </PrimaryButton>
            </div>
          </Form>
        </div>
      </ReactModal>
    </>
  );
}
