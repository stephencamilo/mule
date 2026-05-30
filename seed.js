import { PrismaClient } from '@prisma/client';
import { ContentTypeBuilder, FieldTypeBuilder, ContentBuilder } from './lib/builders.js';

const prisma = new PrismaClient();

async function seed() {
  // 1. Delete existing data (reverse dependency order)
  await prisma.content_reference.deleteMany();
  await prisma.field_value_blob.deleteMany();
  await prisma.field_value_real.deleteMany();
  await prisma.field_value_integer.deleteMany();
  await prisma.field_value_text.deleteMany();
  await prisma.content_data.deleteMany();
  await prisma.content_type_field_type.deleteMany();
  await prisma.field_configs.deleteMany();
  await prisma.content_type.deleteMany();
  await prisma.field_type.deleteMany();

  // 2. Create field types
  const textType      = await FieldTypeBuilder.of('text', 'text').label('Text').create();
  const longTextType  = await FieldTypeBuilder.of('long_text', 'text').label('Long Text').create();
  const referenceType = await FieldTypeBuilder.of('reference', 'reference').label('Reference').create();

  // 3. Create content types with their fields
  const recipeType = await ContentTypeBuilder.of('recipe', 'Recipe')
    .addField(textType, { name: 'name', label: 'Name' })
    .addField(longTextType, { name: 'description', label: 'Description' })
    .addField(referenceType, { name: 'ingredients', label: 'Ingredients' })
    .create();

  const ingredientType = await ContentTypeBuilder.of('ingredient', 'Ingredient')
    .addField(textType, { name: 'name', label: 'Name' })
    .create();

  // 4. Look up the created field configs
  const getField = (contentTypeId, name) =>
    prisma.field_configs.findFirst({ where: { content_type_id: contentTypeId, name } });

  const nameField          = await getField(recipeType.id, 'name');
  const descriptionField   = await getField(recipeType.id, 'description');
  const ingredientsField   = await getField(recipeType.id, 'ingredients');
  const ingredientNameField= await getField(ingredientType.id, 'name');

  // 5. Create ingredient content
  const cheese = await new ContentBuilder(ingredientType).set(ingredientNameField, 'Cheese Cake').save();
  const milk   = await new ContentBuilder(ingredientType).set(ingredientNameField, 'Milk').save();
  const salt   = await new ContentBuilder(ingredientType).set(ingredientNameField, 'Salt').save();
  const pepper = await new ContentBuilder(ingredientType).set(ingredientNameField, 'Pepper').save();

  // 6. Create a recipe referencing those ingredients
  const newRecipe = await new ContentBuilder(recipeType)
    .set(nameField, 'Cheese Cake')
    .set(descriptionField, 'This is a Cheese Cake')
    .set(ingredientsField, [cheese.id, milk.id, salt.id, pepper.id])
    .save();

  console.log('✅ Seed complete!');
  console.log('Recipe:', newRecipe);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());