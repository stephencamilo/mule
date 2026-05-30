import { EntityModel } from '../models/EntityModel.js';

export class ContentTypeBuilder {
  #data = {};
  #fields = [];

  constructor(name) {
    if (name) this.#data.name = name;
  }

  name(v)  { this.#data.name = v;  return this; }
  label(v) { this.#data.label = v; return this; }

  addField(fieldType, fieldData) {
    this.#fields.push({
      field_type_id:   fieldType.id,
      field_type_name: fieldType.name,
      storage_type:    fieldType.storage_type,   // inherit storage type
      ...fieldData,
    });
    return this;
  }

  async create() {
    const contentType = await new EntityModel('content_type').insert(this.#data);
    const fieldModel = new EntityModel('field_configs');
    for (const f of this.#fields) {
      await fieldModel.insert({
        content_type_id: contentType.id,
        field_type_id:   f.field_type_id,
        name:            f.name,
        label:           f.label,
        storage_type:    f.storage_type || 'text',
        validation:      f.validation || null,
        filters:         f.filters || null,
      });
    }
    return contentType;
  }

  static of(name, label) {
    return new ContentTypeBuilder(name).label(label);
  }
}

export class FieldTypeBuilder {
  #data = {};

  constructor(name) {
    if (name) this.#data.name = name;
  }

  name(v)        { this.#data.name = v;         return this; }
  label(v)       { this.#data.label = v;        return this; }
  storageType(v) { this.#data.storage_type = v; return this; }

  async create() {
    return new EntityModel('field_type').insert(this.#data);
  }

  static of(name, storageType = 'text') {
    return new FieldTypeBuilder(name).storageType(storageType);
  }
}

export class FieldBuilder {
  #data = {};

  constructor(fieldTypeRecord) {
    this.#data.field_type_id = fieldTypeRecord.id;
    this.#data.storage_type  = fieldTypeRecord.storage_type;
  }

  name(v)        { this.#data.name = v;         return this; }
  label(v)       { this.#data.label = v;        return this; }
  storageType(v) { this.#data.storage_type = v; return this; }

  async create() {
    return new EntityModel('field_configs').insert(this.#data);
  }
}

export class ContentBuilder {
  #data = {};
  #values = [];

  constructor(contentTypeRecord) {
    this.#data.content_type_id = contentTypeRecord.id;
  }

  set(fieldConfigRecord, value) {
    this.#values.push({ fieldConfig: fieldConfigRecord, value });
    return this;
  }

  async save() {
    // 1. Create the content_data record
    const contentData = await new EntityModel('content_data').insert(this.#data);

    // 2. Insert each field value into the appropriate table
    for (const { fieldConfig, value } of this.#values) {
      const storage = fieldConfig.storage_type;

      if (storage === 'reference') {
        // Expect value to be an array of content IDs
        const ids = Array.isArray(value) ? value : [value];
        const refModel = new EntityModel('content_reference');
        for (const refId of ids) {
          await refModel.insert({
            content_data_id: contentData.id,
            field_config_id: fieldConfig.id,
            referenced_content_id: refId,
          });
        }
      } else {
        const table = this.#valueTableFor(storage);
        const valueModel = new EntityModel(table);
        await valueModel.insert({
          content_data_id: contentData.id,
          field_config_id: fieldConfig.id,
          value,
        });
      }
    }

    return contentData;
  }

  #valueTableFor(storageType) {
    switch (storageType) {
      case 'text':      return 'field_value_text';
      case 'integer':   return 'field_value_integer';
      case 'real':      return 'field_value_real';
      case 'blob':      return 'field_value_blob';
      default:          return 'field_value_text';
    }
  }
}