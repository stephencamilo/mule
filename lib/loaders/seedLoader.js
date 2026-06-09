import { ContentBuilder } from '../builders.js';

export async function seedContent(seedData, { contentTypeMap, fieldMap }) {
  for (const item of seedData.content) {
    const ctRec = contentTypeMap[item.content_type];
    if (!ctRec) throw new Error(`Content type "${item.content_type}" not found`);

    for (const row of item.rows) {
      const builder = new ContentBuilder(ctRec);
      for (const [fieldName, value] of Object.entries(row)) {
        // Skip auto‑increment primary key (id)
        if (fieldName === 'id') continue;

        const fieldConfig = fieldMap[`${item.content_type}.${fieldName}`];
        if (!fieldConfig) throw new Error(`Field "${fieldName}" not found on "${item.content_type}"`);
        builder.set(fieldConfig, value);
      }
      await builder.save();
    }
  }
}