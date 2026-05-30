// seed.js – Example usage of the fluent builder library
import { PrismaClient } from '@prisma/client';
import {
  ContentTypeBuilder,
  FieldTypeBuilder,
  FieldBuilder,
  ContentBuilder,
} from './lib/builders.js';

// Prisma must be generated before running this script
const prisma = new PrismaClient();

async function seed() {
  // 1. Create content types
  const recipeType = await new ContentTypeBuilder()
    .setName('recipe')
    .setLabel('Recipe')
    .create();

  const ingredientType = await new ContentTypeBuilder()
    .setName('ingredient')
    .setLabel('Ingredient')
    .create();

  // 2. Create field types
  const textType = await new FieldTypeBuilder()
    .setName('text')
    .setLabel('Text')
    .setStorageType('text')
    .create();

  const longTextType = await new FieldTypeBuilder()
    .setName('long_text')
    .setLabel('Long Text')
    .setStorageType('text')
    .create();

  const referenceType = await new FieldTypeBuilder()
    .setName('reference')
    .setLabel('Reference')
    .setStorageType('reference')
    .create();

  // 3. Create field configs (fields on content types)
  const nameField = await new FieldBuilder(textType)
    .setName('name')
    .setLabel('Name')
    .setContentType(recipeType)
    .create();

  const descriptionField = await new FieldBuilder(longTextType)
    .setName('description')
    .setLabel('Description')
    .setContentType(recipeType)
    .create();

  const ingredientsField = await new FieldBuilder(referenceType)
    .setName('ingredients')
    .setLabel('Ingredients')
    .setContentType(recipeType)
    .create();

  // 4. Create some ingredient content
  const cheese = await new ContentBuilder(ingredientType)
    .setValue(nameField, 'Cheese Cake')
    .save();

  const milk = await new ContentBuilder(ingredientType)
    .setValue(nameField, 'Milk')
    .save();

  const salt = await new ContentBuilder(ingredientType)
    .setValue(nameField, 'Salt')
    .save();

  const pepper = await new ContentBuilder(ingredientType)
    .setValue(nameField, 'Pepper')
    .save();

  // 5. Create a recipe that references those ingredients
  const newRecipe = await new ContentBuilder(recipeType)
    .setValue(nameField, 'Cheese Cake')
    .setValue(descriptionField, 'This is a Cheese Cake')
    .setValue(ingredientsField, [cheese.id, milk.id, salt.id, pepper.id])
    .save();

  console.log('✅ Seed data created successfully!');
  console.log('Recipe:', newRecipe);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());