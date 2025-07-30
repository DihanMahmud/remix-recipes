import { LocalFileStorage } from "@mjackson/file-storage/local";

export const fileStorage = new LocalFileStorage("recipe-images")

export function getStorageKey(recipeId: string){

    console.log(`recipe-image-${recipeId}`,"7");
    
    return `recipe-image-${recipeId}`
}