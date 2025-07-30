import { ShouldRevalidateFunctionArgs } from "@remix-run/react";

export function isOpeningOrClosing(arg: ShouldRevalidateFunctionArgs) {
  // console.log("This is revalidation function", arg);

  const modalIsOpening = arg.nextUrl.pathname.endsWith("update-meal-plan");
  const modalIsClosing =
    arg.currentUrl.pathname.endsWith("update-meal-plan") &&
    !arg.nextUrl.pathname.includes("update-meal-plan");

  // console.log(modalIsOpening, "and", modalIsClosing);

  if (modalIsOpening) {
    // console.log(modalIsOpening, "open?");

    return true;
  }

  if (modalIsClosing && typeof arg.formData === "undefined") {
    // console.log(modalIsClosing,"close?");

    return true;
  }

  return false;
}
