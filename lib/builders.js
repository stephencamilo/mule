import { EntityModel } from '../models/EntityModel.js';

export class ContentTypeBuilder {
  #data = {};
  #fields = [];

  constructor(name) {
    if (name) this.#data.name = name;
  }

  name(v)  { this.#data.name = v;  return this; }
  label(v) { this.#data.label = v; return this; }

  /**
   * Add a field to the content type.
   * @param {object|EntityModel} fieldType - either a FieldTypeBuilder instance, or plain object { name, storage_type? }
   * @param {object} fieldData - { name, label, storage_type?, validation?, filters? }
   */
  addField(fieldType, fieldData) {
    const ftId   = fieldType.id;
    const ftName = fieldType.name;
    this.#fields.push({
      field_type_id: ftId,
      field_type_name: ftName,
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
        field_type_id: f.field_type_id,
        name: f.name,
        label: f.label,
        storage_type: f.storage_type || 'text',
        validation: f.validation || null,
        filters: f.filters || null,
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
    const contentData = await new EntityModel('content_data').insert(this.#data);
    for (const { fieldConfig, value } of this.#values) {
      const table = this.#valueTableFor(fieldConfig.storage_type);
      await new EntityModel(table).insert({
        content_data_id: contentData.id,
        field_config_id: fieldConfig.id,
        value,
      });
    }
    return contentData;
  }

  #valueTableFor(storageType) {
    switch (storageType) {
      case 'text':      return 'field_value_text';
      case 'integer':   return 'field_value_integer';
      case 'real':      return 'field_value_real';
      case 'blob':      return 'field_value_blob';
      case 'reference': return 'content_reference';
      default:          return 'field_value_text';
    }
  }
}