import { PrismaClient } from '@prisma/client';
import { FieldTypeBuilder, ContentTypeBuilder } from '../builders.js';

const prisma = new PrismaClient();

export async function loadStructure(structure) {
  const fieldTypeMap = {};

  for (const ft of structure.field_types) {
    let rec = await prisma.field_type.findUnique({ where: { name: ft.name } });
    if (!rec) {
      rec = await FieldTypeBuilder.of(ft.name, ft.storage_type).label(ft.label).create();
    }
    fieldTypeMap[ft.name] = rec;
  }

  const contentTypeMap = {};
  const fieldMap = {};

  for (const ct of structure.content_types) {
    let ctRec = await prisma.content_type.findUnique({ where: { name: ct.name } });
    if (!ctRec) {
      const builder = ContentTypeBuilder.of(ct.name, ct.label);
      for (const f of ct.fields) {
        const fieldType = fieldTypeMap[f.field_type];
        if (!fieldType) throw new Error(`Unknown field type: ${f.field_type}`);
        builder.addField(fieldType, {
          name: f.name,
          label: f.label,
          storage_type: fieldType.storage_type,
        });
      }
      ctRec = await builder.create();
    }
    contentTypeMap[ct.name] = ctRec;

    const fields = await prisma.field_configs.findMany({
      where: { content_type_id: ctRec.id },
    });
    for (const f of fields) {
      fieldMap[`${ct.name}.${f.name}`] = f;
    }
  }

  return { fieldTypeMap, contentTypeMap, fieldMap };
}