import { expect, test } from "@playwright/test";

// test("Redirect user to the login page if user is not logged in", async ({page}) => {
//     await page.goto("http://localhost:3000/app/pantry");
//     await expect(page.getByRole("button", {name: /log in/i})).toBeVisible();
// })

test("The flow of the pantry page", async ({ page }) => {
  await page.goto(
    "__test/login?email=demo@example.com&firstName=test&lastName=User"
  );
  await page.goto("/app/pantry");
  await page.getByRole("button", { name: /create shelf/i }).click();
  const shelfInput = page.getByRole("textbox", { name: /shelf name/i });

  await shelfInput.fill("Dairy");

  const newItemInput = page.getByPlaceholder(/new item/i);
  await newItemInput.type("Milk");
  await newItemInput.press("Enter");
  await newItemInput.type("Eggs");
  await newItemInput.press("Enter");
  await newItemInput.type("Yogurt");
  await newItemInput.press("Enter");

  await page.goto("/app/recipes");
  await page.goto("/app/pantry");

  expect(await shelfInput.inputValue()).toBe("Dairy");
  expect(page.getByText("Milk")).toBeVisible();
  expect(page.getByText("Eggs")).toBeVisible();
  expect(page.getByText("Yogurt")).toBeVisible();

  await page.getByRole("button", { name: /delete Eggs/i }).click();
  expect(page.getByText("Eggs")).not.toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /delete shelf/i }).click();
  expect(shelfInput).not.toBeVisible();
});
