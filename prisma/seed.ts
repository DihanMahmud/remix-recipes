// import { PrismaClient } from "@prisma/client/extension";

import { PrismaClient } from "@prisma/client";


const db = new PrismaClient();

function createUser(){
  return db.user.create({
    data: {
      email: "me@example.com",
      firstName: "Mr.",
      lastName: "Alex"
    }
  })
}

function getShelves(userId: string) {
  return [
    {
      userId,
      name: "Dairy",
      item: {
        create: [
          {userId, name: "Eggs" },
          {userId, name: "Milk" },
          {userId, name: "Cheese" },
          {userId, name: "Youg" },
        ],
      },
    },
    {
      userId,
      name: "Fruits",
      item: {
        create: [{userId, name: "Mango" }, {userId, name: "Apple" }, {userId, name: "Banana" }],
      },
    },
  ];
}

function getRecipes(userId: string) {

  return [
    {
      name: "Spaghetti Bolognese",
      instructions: "Cook pasta according to package instructions. In a separate pan, sauté onions, garlic, and ground beef until browned. Add tomato sauce and simmer for 20 minutes. Combine with pasta and serve.",
      totalTime: "40 minutes",
      imageUrl: "https://picsum.photos/400/300?random=1",
      userId: userId,
      ingredients: {create : [
        { name: "Spaghetti", amount: "200g" },
        { name: "Ground beef", amount: "300g" },
        { name: "Tomato sauce", amount: "2 cups" },
        { name: "Garlic", amount: "2 cloves" },
        { name: "Onion", amount: "1 medium" },
        { name: "Olive oil", amount: "1 tbsp" },
        { name: "Salt & pepper", amount: "to taste" }
      ] }
    },
    {
      name: "Chicken Caesar Salad",
      instructions: "Grill chicken breast until cooked through. Slice and combine with romaine lettuce, croutons, parmesan cheese, and Caesar dressing.",
      totalTime: "25 minutes",
      imageUrl: "https://picsum.photos/400/300?random=2",
      userId: userId,
      ingredients: {create : [
        { name: "Chicken breast", amount: "2" },
        { name: "Romaine lettuce", amount: "4 cups" },
        { name: "Croutons", amount: "1 cup" },
        { name: "Parmesan cheese", amount: "1/2 cup" },
        { name: "Caesar dressing", amount: "1/4 cup" }
      ] }
    },
    {
      name: "Vegetable Stir-fry",
      instructions: "Sauté mixed vegetables in a hot pan with olive oil for 5 minutes. Add soy sauce and stir until vegetables are tender. Serve with rice.",
      totalTime: "20 minutes",
      imageUrl: "https://picsum.photos/400/300?random=3",
      userId: userId,
      ingredients: {create : [
        { name: "Mixed vegetables", amount: "2 cups" },
        { name: "Olive oil", amount: "1 tbsp" },
        { name: "Soy sauce", amount: "3 tbsp" },
        { name: "Rice", amount: "1 cup" }
      ] }
    },
    {
      name: "Chicken Tacos",
      instructions: "Cook chicken in a pan with taco seasoning until fully cooked. Serve with tortillas, lettuce, cheese, and salsa.",
      totalTime: "30 minutes",
      imageUrl: "https://picsum.photos/400/300?random=4",
      userId: userId,
      ingredients: {create : [
        { name: "Chicken breast", amount: "300g" },
        { name: "Taco seasoning", amount: "2 tbsp" },
        { name: "Tortillas", amount: "4" },
        { name: "Lettuce", amount: "1 cup" },
        { name: "Cheese", amount: "1/2 cup" },
        { name: "Salsa", amount: "1/4 cup" }
      ] }
    },
    {
      name: "Pancakes",
      instructions: "Mix flour, milk, eggs, and baking powder to form a batter. Cook in a hot pan until golden brown on both sides.",
      totalTime: "15 minutes",
      imageUrl: "https://picsum.photos/400/300?random=5",
      userId: userId,
      ingredients: {create : [
        { name: "Flour", amount: "1 cup" },
        { name: "Milk", amount: "1 cup" },
        { name: "Eggs", amount: "2" },
        { name: "Baking powder", amount: "2 tsp" },
        { name: "Butter", amount: "1 tbsp" }
      ] }
    },
    {
      name: "Beef Tacos",
      instructions: "Brown ground beef in a pan, add taco seasoning, and cook until ready. Serve with taco shells, lettuce, and cheese.",
      totalTime: "25 minutes",
      imageUrl: "https://picsum.photos/400/300?random=6",
      userId: userId,
      ingredients: {create : [
        { name: "Ground beef", amount: "300g" },
        { name: "Taco seasoning", amount: "2 tbsp" },
        { name: "Taco shells", amount: "6" },
        { name: "Lettuce", amount: "1 cup" },
        { name: "Cheese", amount: "1/2 cup" }
      ] }
    }
  ];
}

async function deleteAll() {
  await db.recipe.deleteMany()
  await db.pantryShelf.deleteMany()
  await db.user.deleteMany()
}

async function createAll() { 
  const user = await createUser();
  await Promise.all(
    [
      ...getShelves(user.id).map((shelf) => db.pantryShelf.create({ data: shelf })),
      ...getRecipes(user.id).map((recipe) => db.recipe.create({data: recipe}))
    ]
  );
}


async function seed() {
  await deleteAll()
  await createAll()
}

seed();
