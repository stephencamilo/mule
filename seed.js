import { PrismaClient } from '@prisma/client';
import { ContentTypeBuilder, FieldTypeBuilder, ContentBuilder } from './lib/builders.js';

const prisma = new PrismaClient();

async function seed() {
  // 1. Create field types
  const textType      = await FieldTypeBuilder.of('text', 'text').label('Text').create();
  const longTextType  = await FieldTypeBuilder.of('long_text', 'text').label('Long Text').create();
  const referenceType = await FieldTypeBuilder.of('reference', 'reference').label('Reference').create();

  // 2. Create content types with their fields
  const recipeType = await ContentTypeBuilder.of('recipe', 'Recipe')
    .addField(textType, { name: 'name', label: 'Name' })
    .addField(longTextType, { name: 'description', label: 'Description' })
    .addField(referenceType, { name: 'ingredients', label: 'Ingredients' })
    .create();

  const ingredientType = await ContentTypeBuilder.of('ingredient', 'Ingredient')
    .addField(textType, { name: 'name', label: 'Name' })
    .create();

  // 3. Look up the created field configs
  const getField = (contentTypeId, name) =>
    prisma.field_configs.findFirst({ where: { content_type_id: contentTypeId, name } });

  const nameField          = await getField(recipeType.id, 'name');
  const descriptionField   = await getField(recipeType.id, 'description');
  const ingredientsField   = await getField(recipeType.id, 'ingredients');
  const ingredientNameField= await getField(ingredientType.id, 'name');

  // 4. Create ingredient content
  const cheese = await new ContentBuilder(ingredientType).set(ingredientNameField, 'Cheese Cake').save();
  const milk   = await new ContentBuilder(ingredientType).set(ingredientNameField, 'Milk').save();
  const salt   = await new ContentBuilder(ingredientType).set(ingredientNameField, 'Salt').save();
  const pepper = await new ContentBuilder(ingredientType).set(ingredientNameField, 'Pepper').save();

  // 5. Create a recipe referencing those ingredients
  const newRecipe = await new ContentBuilder(recipeType)
    .set(nameField, 'Cheese Cake')
    .set(descriptionField, 'This is a Cheese Cake')
    .set(ingredientsField, [cheese.id, milk.id, salt.id, pepper.id])
    .save();

  console.log('✅ Seed complete!', newRecipe);
}

seed().catch(console.error).finally(() => prisma.$disconnect());