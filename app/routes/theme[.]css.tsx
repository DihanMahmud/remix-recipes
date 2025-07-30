import { LoaderFunctionArgs } from "@remix-run/node";
import { themeCookie } from "~/cookies";

function getTheme(color: string) {
  switch (color) {
    case "red": {
      return {
        colorPrimary: "#f22524",
        colorPrimaryLight: "#f56665",
      };
    }
    case "orange": {
      return {
        colorPrimary: "#ff4b00",
        colorPrimaryLight: "#ff814d",
      };
    }
    case "yellow": {
      return {
        colorPrimary: "#cc9800",
        colorPrimaryLight: "#ffbf00",
      };
    }
    case "blue": {
      return {
        colorPrimary: "#01a3e1",
        colorPrimaryLight: "#30c5fe",
      };
    }
    case "purple": {
      return {
        colorPrimary: "#5325c0",
        colorPrimaryLight: "#8666d2",
      };
    }
    default: {
      return {
        colorPrimary: "#00743e",
        colorPrimaryLight: "#4c9d77",
      };
    }
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("cookie");
  const cookieValue = await themeCookie.parse(cookieHeader);
  const theme = getTheme(cookieValue);
  const data = `
  :root{
  --color-primary: ${theme.colorPrimary};
  --color-light-primary: ${theme.colorPrimaryLight};
  }`;
  return new Response(data, {
    headers: {
      "content-type": "text/css",
      "last-modified": "May 21, 2023"
    },
  });
}

/*

theme.css.tsx means localhost:3000/theme/css,

if we use theme[.]css.tsx,

it would be localhost:3000/theme.css

*/
