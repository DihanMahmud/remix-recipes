import {
  NavLink as RemixNavLink,
  Outlet,
  useRouteError,
} from "@remix-run/react";
import classNames from "classnames";

type PageLayoutProps = {
  title: string;
  links: Array<{
    to: string;
    label: string;
  }>;
};

export function PageLayout({ title, links }: PageLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      <h1 className=" text-2xl font-bold my-4">{title}</h1>
      <nav className="border-b-2 pb-2 mt-2">
        {links.map((link) => (
          <NavLink key={link.label} to={link.to}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="py-4 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

type NavLinkProps = {
  to: string;
  children: React.ReactNode;
};

function NavLink({ to, children }: NavLinkProps) {
  return (
    <RemixNavLink
      to={to}
      className={({ isActive }) =>
        classNames(
          "hover:text-gray-500 pb-2.5 px-2 md:px-4",
          isActive ? "border-b-2 border-b-primary" : ""
        )
      }
    >
      {children}
    </RemixNavLink>
  );
}

// export function ErrorBoundary() {

//   const error = useRouteError();

//   if (error instanceof Error) {
//     return(
//       <>
//       <p>{error.message}</p>
//       </>
//     )
//   }

//   return   <div>Something went wrong</div>

// }
