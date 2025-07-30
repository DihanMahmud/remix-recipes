import { PrismaClient } from "@prisma/client";

interface CustomNodeJSGlobal extends NodeJS.Global {
    db: PrismaClient;
}

declare const global: CustomNodeJSGlobal;

//we created this file and created one instence of new PrismaClient(), otherwise in every component, in every loading loader function will execute/run and create new instence or object everytime. It creates too many pooling and connections.
const db = global.db || new PrismaClient();

if (process.env.NODE_ENV === "development") global.db = db;

export default db;