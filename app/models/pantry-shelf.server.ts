import { Prisma } from "@prisma/client";
import db from "~/db.server";
import { handleDelete } from "./utils";

export function getAllShelves(userId: string, query: string | null){
    return db.pantryShelf.findMany({
        where: {
            userId,
            name: {
                contains: query ?? "",
                mode: "insensitive"
            }
        },
        include: {
            item: {
                orderBy: {
                    name: "asc",
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });
}

export function createShelf(userId: string){
    return db.pantryShelf.create({
        data: {
            userId,
            name: "New Shelf",
        }
    })
}

export function deleteShelf(shelfId: string) {

    return handleDelete(() => db.pantryShelf.delete({
        where: {
            id: shelfId
        }
    }))
    // try {
    //     const deleted = await db.pantryShelf.delete({
    //         where: {
    //             id: shelfId
    //         }
    //     })
    //     // console.log(deleted, "41");
    //     return deleted;
    // } catch (error) {
    //     // console.log("start", error, "46");   
    //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
    //         if (error.code === "P2025") {
    //             // console.log(error, "50");
                
    //             return error.message;
    //         }
    //     }
    //     // console.log(error, "56");
    //     throw error;
    // }
}


// export function saveShelfName(shelfId: string, shelfName: string) {
//     return db.pantryShelf.update({
//         where: {
//             id: shelfId
//         },
//         data: {
//             name: shelfName
//         }
//     })
// }

export async function saveShelfName(shelfId: string, shelfName: string) {
    try {
        const saveShelfName = await db.pantryShelf.update({
            where: {
                id: shelfId
            },
            data: {
                name: shelfName
            }
        })

        return saveShelfName;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                return error.message
            }
        }

        throw error;
    }
}


export function getShelf(id: string){
    return db.pantryShelf.findUnique({
        where: {
            id
        }
    })
}