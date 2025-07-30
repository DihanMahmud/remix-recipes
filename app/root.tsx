import {
  data,
  Form,
  isRouteErrorResponse,
  json,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  ShouldRevalidateFunctionArgs,
  useLoaderData,
  useMatches,
  useNavigation,
  useResolvedPath,
  useRouteError,
} from "@remix-run/react";
import type {
  ActionFunction,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
// import shared from "~/shared.css?url"
import styles from "app/tailwind.css?url";
import {
  Discover,
  HomeIcon,
  Login,
  LogOut,
  RecipeBook,
  Settings,
} from "./components/icons";
import classNames from "classnames";
import React from "react";
import { getCurrentUser } from "./utils/auth.server";
import { destroySession, getSession } from "./sessions";
import { isOpeningOrClosing } from "./utils/revalidation";

export function shouldRevalidate(arg: ShouldRevalidateFunctionArgs) {
  // console.log(!isOpeningOrClosing(arg), "root");

  return !isOpeningOrClosing(arg);
}

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: styles,
  },
  {
    rel: "stylesheet",
    href: "/theme.css",
  },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: styles,
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="root" className=" md:flex md:h-screen bg-background">
          {children}
          <ScrollRestoration />
          <Scripts />
        </div>
      </body>
    </html>
  );
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getCurrentUser(request);
  console.log(user, "not user");
  
  return data({ isLoggedIn: user !== null });
};

// with this process we can also logout,

// export const action: ActionFunction = async ({ request }) => {
//   const cookieHeader = request.headers.get("cookie");
//   const session = await getSession(cookieHeader);
//   const userId = await getCurrentUser(request);
//   const user = session.get("userId");
//   const formData = await request.formData();

//   const data = formData.get("_action");

//   console.log(data, user, userId);

//   if (data === "logout" && user === userId?.id) {
//     return json(
//       { message: "Logout Successful" },
//       {
//         headers: {
//           "Set-Cookie": await destroySession(session),
//         },
//       }
//     );
//   }

//   console.log(data, user, userId);

//   return null;
// };

type LoaderData = {
  isLoggedIn: boolean;
};

export default function App() {
  const data = useLoaderData() as LoaderData;
  // console.log(data);

  // const logOutHandler = () => {

  // }

  const matchs = useMatches();
  React.useEffect(() => {
    console.log(matchs);
  });
  return (
    <>
      <nav
        className={classNames(
          "bg-primary text-white",
          "flex justify-between md:flex-col"
        )}
      >
        <ul className={classNames("flex md:flex-col")}>
          {/* <AppNavLink to="/">
            <HomeIcon />
          </AppNavLink> */}
          <AppNavLink to="discover">
            <Discover />
          </AppNavLink>
          {data.isLoggedIn ? (
            <AppNavLink to="app/recipes">
              <RecipeBook />
            </AppNavLink>
          ) : null}

          <AppNavLink to="settings">
            <Settings />
          </AppNavLink>
        </ul>
        {/* <ul>
          {data.isLoggedIn ? <Form method="post" action="/" className="py-4 flex justify-center hover:bg-light-primary px-3"><button name="_action" value="logout"><LogOut /></button> </Form> : (
            <AppNavLink to="login">
              <Login />
            </AppNavLink>
          )}
        </ul> */}

        <ul>
          {data.isLoggedIn ? (
            <AppNavLink to="/logout">
              <LogOut />
            </AppNavLink>
          ) : (
            <AppNavLink to="/login">
              <Login />
            </AppNavLink>
          )}
        </ul>
      </nav>
      <div className="p-4 w-full md:w-[calc(100%-4rem)]">
        <Outlet />
      </div>
    </>
  );
}

type AppNavLinkProps = {
  children: React.ReactNode;
  to: string;
};

function AppNavLink({ children, to }: AppNavLinkProps) {
  const path = useResolvedPath(to);
  // console.log(path);

  // navigation.location.pathname -> it is the path/route where we want to go, thats why we clicked
  const navigation = useNavigation();
  const isLoading =
    navigation.state === "loading" &&
    navigation.location.pathname === path.pathname &&
    navigation.formData === undefined; // navigation.location.pathname === path.pathname, if you don't use it, it will animation the whole nav not the single one.
  // console.log(navigation.state, navigation.location?.pathname, path.pathname, navigation);

  return (
    <li className="w-16">
      <NavLink to={to}>
        {({ isActive }) => (
          <div
            className={classNames(
              "py-4 flex justify-center hover:bg-light-primary",
              isActive ? "bg-light-primary" : "",
              isLoading ? "animate-pulse bg-light-primary" : ""
            )}
          >
            {children}
          </div>
        )}
      </NavLink>
    </li>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  // console.log(error);
  // console.log(isRouteErrorResponse(error));

  return (
    <html>
      <head>
        <title>Woops! [but this title is not working]</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>

      <body>
        <div>
          {isRouteErrorResponse(error) ? (
            <>
              <h1>{error.status}</h1>
              <p>{error.statusText}</p>
              <p>{error.data.message}</p>
            </>
          ) : (
            <>
              {" "}
              <h1>Something went wrong!</h1>
              {error instanceof Error ? <p>{error.message}</p> : null}
            </>
          )}

          <NavLink to="/">Go to Home Page</NavLink>
        </div>
      </body>
    </html>
  );
}
