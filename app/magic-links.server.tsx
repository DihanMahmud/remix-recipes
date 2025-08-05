import { data } from "@remix-run/node";
import Cryptr from "cryptr";
import { sendEmail } from "./utils/emails.server";
import { renderToStaticMarkup } from "react-dom/server";

if (typeof process.env.MAGIC_LINK_SECRET !== "string") {
  throw new Error("Secret key is missing.");
}

const cryptr = new Cryptr(process.env.MAGIC_LINK_SECRET);

type MagicLinkPayload = {
  email: string;
  nonce: string;
  createAt: string;
};

export function generateMagicLinks(email: string, nonce: string) {
  const payload: MagicLinkPayload = {
    email,
    nonce,
    createAt: new Date().toISOString(),
  };

  if (typeof process.env.ORIGIN !== "string") {
    throw new Error("Missing Origin env");
  }

  const encryptedPayload = cryptr.encrypt(JSON.stringify(payload));

  const url = new URL(process.env.ORIGIN);
  url.pathname = "/validate-magic-link";
  url.searchParams.set("magic", encryptedPayload);

  return url.toString();
}

// value is MagicLinkPayload, it is call type preticate or something like that
function isMagicLinkPayload(value: any): value is MagicLinkPayload {
  return (
    typeof value === "object" &&
    typeof value.email === "string" &&
    typeof value.nonce === "string" &&
    typeof value.createAt === "string"
  );
}

export function throwError(message: string) {
  return data({ message: message }, { status: 400 });
}

export function getMagicLinkPayload(request: Request) {
  // console.log(request.url);

  const url = new URL(request.url);
  const magic = url.searchParams.get("magic");

  if (typeof magic !== "string") {
    throw throwError("magic params doesn't exist!");
  }

  //   const magicLinkPayloads = cryptr.decrypt(magic)

  const magicLinkPayload = JSON.parse(cryptr.decrypt(magic));

  if (!isMagicLinkPayload(magicLinkPayload)) {
    // throw data({message: "Invalid magic link payload"}, {status: 400})
    throw throwError("Invalid magic link payload");
  }

  return magicLinkPayload;
}

export function sendMagicLinkEmail(link: string, email: string) {
  if (process.env.NODE_ENV === "production") {
    const html = renderToStaticMarkup(
      <div>
        <h1>
          Log In to remix app
          <p>Hey there, click the link to finish login</p>
          <a href={link}>Log In</a>
        </h1>
      </div>
    );
  
    return sendEmail({
      from: "Remix app <dihanmahmud1@gmail.com>",
      to: email,
      subject: "Log In Email",
      html,
    });
  } else{
    console.log(link); 
  }
}
