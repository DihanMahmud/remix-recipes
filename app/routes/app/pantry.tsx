import {
  ActionFunction,
  data,
  json,
  LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useNavigation,
  useRouteError,
  useSearchParams,
} from "@remix-run/react";
import classNames from "classnames";
import React from "react";
import { z } from "zod";
import { DeleteButton, ErrorMessage, Input, PrimaryButton, SearchBar } from "~/components/form";
import { PlusIcon, SaveIcon, SearchIcon, Trash } from "~/components/icons";
import {
  createShelfItem,
  deleteShelfItem,
  getShelfItem,
} from "~/models/pantry-item.server";
import {
  createShelf,
  deleteShelf,
  getAllShelves,
  getShelf,
  saveShelfName,
} from "~/models/pantry-shelf.server";
import { getUserById } from "~/models/user.server";
import { getSession } from "~/sessions";
import { requireLoggedInUser } from "~/utils/auth.server";
import { useIsHydrated, useServerLayoutEffect } from "~/utils/misc";
import { validateForm } from "~/utils/validation";

const saveShelfNameSchema = z.object({
  shelfName: z.string().min(1, "Shelf name cannot be blank."),
  shelfId: z.string(),
});

const deleteShelfSchema = z.object({
  shelfId: z.string(),
});

const createShelfItemSchema = z.object({
  itemName: z.string().min(1, "Item name cannot be blank."),
  shelfId: z.string(),
});

const deleteShelfItemSchema = z.object({
  itemId: z.string(),
});

export const action: ActionFunction = async ({ request }) => {
  const user = await requireLoggedInUser(request);
  const formData = await request.formData();
  //console.log(formData.get("_action"), "hello"); // in button, you have to pass the name field and it will grab the value field. Otherwise it will give null or empty string and doesn't work.

  switch (formData.get("_action")) {
    case "createShelf": {
      return createShelf(user.id);
    }

    case "deleteShelf": {
      return validateForm(
        formData,
        deleteShelfSchema,
        async (datas) => {
          const shelf = await getShelf(datas.shelfId);
          if (shelf !== null && shelf.userId !== user.id) {
            throw data(
              { message: "you can't delete other's shelf" },
              { status: 401 }
            );
          }
          return deleteShelf(datas.shelfId);
        },
        (errors) => json({ errors }, { status: 400 })
      );
      // const shelfId = formData.get("shelfId");
      // if (typeof shelfId !== "string") {
      //   return json({ error: { shelfId: "Shelf ID must be string" } });
      // }
      // return deleteShelf(shelfId);
    }

    case "saveShelfName": {
      return validateForm(
        formData,
        saveShelfNameSchema,
        async (datas) => {
          const shelf = await getShelf(datas.shelfId);
          if (shelf?.userId !== user.id) {
            throw data(
              { message: "you can't change other's shelf name" },
              { status: 401 }
            );
          }
          return saveShelfName(datas.shelfId, datas.shelfName);
        },
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "createShelfItem": {
      return validateForm(
        formData,
        createShelfItemSchema,
        (data) => createShelfItem(user.id, data.shelfId, data.itemName),
        (errors) => json({ errors }, { status: 400 })
      );
    }

    case "deleteShelfItem": {
      return validateForm(
        formData,
        deleteShelfItemSchema,
        async (datas) => {
          const item = await getShelfItem(datas.itemId);
          if (item?.userId !== user.id) {
            throw data(
              { message: "You can't delete other's shelf item" },
              { status: 401 }
            );
          }
          return deleteShelfItem(datas.itemId);
        },
        (errors) => json({ errors }, { status: 400 })
      );
    }

    default: {
      return null;
    }
  }
};

type LoaderData = {
  shelves: Awaited<ReturnType<typeof getAllShelves>>;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireLoggedInUser(request);
  //   const cookie = request.headers.get("cookie");
  //   const session = await getSession(cookie)
  //   const userId = session.get("userId");
  //   const data = await getUserById(userId);
  // console.log(data);

  const url = new URL(request.url);
  // console.log(url);
  // URL {
  //   href: 'http://localhost:3000/app/pantry',
  //   origin: 'http://localhost:3000',
  //   protocol: 'http:',
  //   username: '',
  //   password: '',
  //   host: 'localhost:3000',
  //   hostname: 'localhost',
  //   port: '3000',
  //   pathname: '/app/pantry',
  //   search: '',
  //   searchParams: URLSearchParams {},
  //   hash: ''
  // }
  // console.log(request.url); -> http://localhost:3000/app/pantry
  const q = url.searchParams.get("q");
  //console.log(q); -> fruit

  const shelves = await getAllShelves(user.id, q);

  // const shelves = await db.pantryShelf.findMany();

  return json({ shelves });

  // return data({shelves},{
  // use Status and headers [good practice]
  // });

  // return new Response(JSON.stringify({shelves}),{
  //   status: 200,
  //   headers: {
  //     "Content-Type" : "application/json"
  //   }
  // });
}

export default function Pantry() {
  const data = useLoaderData() as LoaderData;
  // const data = useLoaderData<typeof loader>();
  // console.log(data);

  // const [searchParams] = useSearchParams();
  // console.log(searchParams);

  const createShelfFetcher = useFetcher();

  // const navigate = useNavigation();
  // console.log(navigate);

  // const isSearching = navigate.formData?.has("q");

  const isCreatingShelf =
    createShelfFetcher.formData?.get("_action") === "createShelf";
  // console.log(isCreatingShelf, isSearching);
  // console.log(isSearching); -> true
  // "??" -> it means OR

  return (
    <div>
      <SearchBar placeholder="Search Shelves..." className=" md:w-80"></SearchBar>

      <createShelfFetcher.Form method="post">
        <PrimaryButton
          name="_action"
          value="createShelf"
          isLoading={isCreatingShelf}
          className="w-full md:w-fit mt-4"
        >
          <PlusIcon />
          <span className="pl-2">
            {isCreatingShelf ? "Creating Shelf" : "Create Shelf"}
          </span>
        </PrimaryButton>
      </createShelfFetcher.Form>

      <ul
        className={classNames(
          "flex gap-8 overflow-x-auto pb-4 mt-4",
          "snap-x snap-mandatory md:snap-none "
        )}
      >
        {data.shelves.map((shelf) => (
          <Shelf key={shelf.id} shelf={shelf} />
        ))}
      </ul>
    </div>
  );
}

type ShelfProps = {
  // shelf: {
  //   id: string;
  //   name: string;
  //   item: {
  //     id: string;
  //     name: string;
  //   }[];
  // };
  shelf: LoaderData["shelves"][number];
};

function Shelf({ shelf }: ShelfProps) {
  // console.log(saveShelfNameFetcher);
  const saveShelfNameFetcher = useFetcher();
  const createShelfItemFetcher = useFetcher();
  const deleteShelfFetcher = useFetcher();
  const { renderedItems, addItem } = useOptimisticItem(
    shelf.item,
    createShelfItemFetcher.state
  );
  const createItemFormRef = React.useRef<HTMLFormElement>(null);
  const isHydrated = useIsHydrated();
  const isDeletingShelf =
    deleteShelfFetcher.formData?.get("_action") === "deleteShelf" &&
    deleteShelfFetcher.formData?.get("shelfId") === shelf.id;
  // console.log(deleteShelfFetcher);
  // console.log(isDeletingShelf, shelf.name); -> you will understand seeing this, form submit er pore isDeletingShelf checking that form submission er state ta ki? jodi loading hoy mane true, it won't display the shelf, and after finishing shelf will be deleted from database mane pore diye o eda display hobe na.

  //if we don't check the shelf Id here, anyone can change id from the console and can delete without authenticating
  return isDeletingShelf ? null : (
    <li
      key={shelf.id}
      className={classNames(
        "border-2 border-primary p-4 rounded-md h-fit",
        "w-[calc(100vw-2rem)] flex-none snap-center",
        "md:w-96"
      )}
    >
      <saveShelfNameFetcher.Form method="post" className="flex">
        <div className="w-full mb-2 peer">
          <Input
            type="text"
            required
            defaultValue={shelf.name}
            name="shelfName"
            autoComplete="off"
            placeholder="Shelf Name"
            aria-label="Shelf name"
            className="text-2xl font-extrabold"
            error={!!saveShelfNameFetcher.data?.errors?.shelfName}
            onChange={(event) => {
              event.target.value !== "" &&
                saveShelfNameFetcher.submit(
                  {
                    _action: "saveShelfName",
                    shelfName: event.target.value,
                    shelfId: shelf.id,
                  },
                  { method: "post" }
                );
            }}
          />
          <ErrorMessage>
            {saveShelfNameFetcher.data?.errors?.shelfName}
          </ErrorMessage>
        </div>

        {isHydrated ? null : (
          <button
            name="_action"
            value="saveShelfName"
            className={classNames(
              "ml-4 opacity-0 hover:opacity-100 focus:opacity-100",
              "peer-focus-within:opacity-100"
            )}
          >
            <SaveIcon />
          </button>
        )}

        <input type="hidden" name="shelfId" value={shelf.id} />
        <ErrorMessage className="pl-2">
          {saveShelfNameFetcher.data?.errors?.shelfId}
        </ErrorMessage>
      </saveShelfNameFetcher.Form>

      <createShelfItemFetcher.Form
        method="post"
        className="flex py-2"
        ref={createItemFormRef}
        // onSubmit handler runs before the form is submitted, form data collect kore action a jaoar agei onSubmit run hoy. and as we used "createItemFormRef.current?.reset()" the form data becomes empty, that's why it is submitted empty form everytime. the only way to submit this is prevent the default way and submit manually with fetcher. Form component is declative way to submit the form, fetcher has a function named submit, which is imperative way video -> 54
        onSubmit={(event) => {
          const target = event.target as HTMLFormElement;
          const itemNameInput = target.elements.namedItem(
            "itemName"
          ) as HTMLInputElement;
          addItem(itemNameInput.value);
          event.preventDefault(); // using this we are canceling the default way of submission
          createShelfItemFetcher.submit(
            {
              itemName: itemNameInput.value,
              shelfId: shelf.id,
              _action: "createShelfItem",
            },
            {
              method: "post",
            }
          );
          createItemFormRef.current?.reset(); //for this line we have to use preventDefault()
        }}
      >
        <div className="w-full mb-2 peer">
          <input
            placeholder="New Item"
            required
            autoComplete="off"
            type="text"
            name="itemName"
            className={classNames(
              " w-full outline-none",
              "border-b-2 border-b-background focus:border-b-primary",
              createShelfItemFetcher.data?.errors?.itemName
                ? "border-b-red-600"
                : ""
            )}
          />

          <ErrorMessage className="">
            {createShelfItemFetcher.data?.errors?.itemName}
          </ErrorMessage>
        </div>

        <button
          name="_action"
          value="createShelfItem"
          className={classNames(
            "ml-4 opacity-0 hover:opacity-100 focus:opacity-100",
            "peer-focus-within:opacity-100"
          )}
        >
          <SaveIcon />
        </button>

        <input type="hidden" name="shelfId" value={shelf.id} />
        <ErrorMessage className="pl-2">
          {createShelfItemFetcher.data?.errors?.shelfId}
        </ErrorMessage>
      </createShelfItemFetcher.Form>

      <ul>
        {renderedItems.map((item) => (
          <ShelfItem key={item.id} shelfItem={item} /> // not sure, but I think, useFetcher is good in function, not in nested loop function. check video -> 53
        ))}
      </ul>

      {/* <li key={item.id} className={classNames("py-2")}>
            <deleteShelfItem.Form method="post" className="flex justify-between">
              <span>{item.name}</span>
              <input type="hidden" name="itemId" value={item.id}></input>
              <button name="_action" value="deleteShelfItem">Delete</button>
            </deleteShelfItem.Form> 
          </li> */}

      {/* <deleteShelfFetcher.Form method="post" className="pt-8">
        <input type="hidden" name="shelfId" value={shelf.id} />
        <DeleteButton
          className={classNames("w-full")}
          name="_action"
          value="deleteShelf"
          isLoading={isDeletingShelf}
        >
          {isDeletingShelf ? "Deleting Shelf" : "Delete Shelf"}
        </DeleteButton>
      </deleteShelfFetcher.Form> */}

      <deleteShelfFetcher.Form
        method="post"
        className="pt-8"
        onSubmit={(event) => {
          if (!confirm("Are you sure to delete the Shelf?")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="shelfId" value={shelf.id} />
        <ErrorMessage className="pb-2">
          {deleteShelfFetcher.data?.errors?.shelfId}
        </ErrorMessage>
        <DeleteButton
          className={classNames("w-full")}
          name="_action"
          value="deleteShelf"
        >
          Delete Shelf
        </DeleteButton>
      </deleteShelfFetcher.Form>
    </li>
  );
}

type ShelfItemProps = {
  // shelfItem: LoaderData["shelves"][number]["item"][number]
  // in database they named items, but I named item

  shelfItem: RenderedItem;
};

function ShelfItem({ shelfItem }: ShelfItemProps) {
  const deleteShelfItemFetcher = useFetcher();
  const isDeleting = !!deleteShelfItemFetcher.formData;
  // console.log(isDeleting);

  return (
    <li className={classNames("py-2")}>
      {isDeleting ? null : (
        <deleteShelfItemFetcher.Form method="post" className="flex ">
          <p className="w-full">{shelfItem.name}</p>
          {shelfItem.isOptimistic ? null : (
            <button name="_action" value="deleteShelfItem" aria-label={`delete ${shelfItem.name}`}>
              <Trash />
            </button>
          )}
          <input type="hidden" name="itemId" value={shelfItem.id} />
          <ErrorMessage className="pl-2">
            {deleteShelfItemFetcher.data?.errors?.itemId}
          </ErrorMessage>
        </deleteShelfItemFetcher.Form>
      )}
    </li>
  );
}

type RenderedItem = {
  name: string;
  id: string;
  isOptimistic?: boolean;
};

function useOptimisticItem(
  savedItems: Array<RenderedItem>,
  createShelfItemState: "idle" | "submitting" | "loading"
) {
  const [optimisticItems, setOptimisticItems] = React.useState<
    Array<RenderedItem>
  >([]);

  const renderedItems = [...optimisticItems, ...savedItems];

  renderedItems.sort((a, b) => {
    if (a.name === b.name) return 0;
    return a.name < b.name ? -1 : 1;
  });

  // React.useLayoutEffect(() => {
  //   setOptimisticItems([]);
  // }, [savedItems]);
  useServerLayoutEffect(() => {
    if (createShelfItemState === "idle") {
      setOptimisticItems([]);
    }
  }, [createShelfItemState]);

  const addItem = (name: string) => {
    setOptimisticItems((item) => [
      ...item,
      { id: createItemId(), name, isOptimistic: true },
    ]);
  };

  return { renderedItems, addItem };
}

function createItemId() {
  return `${Math.round(Math.random() * 1_000_000)}`;
}

// we need to create this id because of the optimistic Item. As it is just a fake item it has no id, but in ts type we assigned name and id. So need to create this id to escape the error

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <div className="bg-red-600 text-white rounded-md p-4">
      <h1 className="mb-2">
        {error.status} - {error.statusText}
      </h1>
      <p>{error.data.message}</p>
    </div>
  }
  return (
    <div className="bg-red-600 text-white rounded-md p-4">
      <h1 className="mb-2">An unexpected error occoured</h1>
    </div>
  );
}
