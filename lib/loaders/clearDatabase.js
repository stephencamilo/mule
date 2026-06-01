import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function clearContent() {
  await prisma.content_reference.deleteMany();
  await prisma.field_value_blob.deleteMany();
  await prisma.field_value_real.deleteMany();
  await prisma.field_value_integer.deleteMany();
  await prisma.field_value_text.deleteMany();
  await prisma.content_data.deleteMany();
}

export async function clearStructure() {
  await clearContent();
  await prisma.content_type_field_type.deleteMany();
  await prisma.field_configs.deleteMany();
  await prisma.content_type.deleteMany();
  await prisma.field_type.deleteMany();
}
