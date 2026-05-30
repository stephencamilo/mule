import { EntityModel } from '../models/EntityModel.js';

export class ContentTypeBuilder {
  #data = {};

  setName(v) { this.#data.name = v; return this; }
  setLabel(v) { this.#data.label = v; return this; }

  async create() {
    return new EntityModel('content_type').insert(this.#data);
  }
}

export class FieldTypeBuilder {
  #data = {};

  setName(v) { this.#data.name = v; return this; }
  setLabel(v) { this.#data.label = v; return this; }
  setStorageType(v) { this.#data.storage_type = v; return this; }

  async create() {
    return new EntityModel('field_type').insert(this.#data);
  }
}

export class FieldBuilder {
  #data = {};

  constructor(fieldTypeRecord) {
    this.#data.field_type_id = fieldTypeRecord.id;
  }

  setName(v) { this.#data.name = v; return this; }
  setLabel(v) { this.#data.label = v; return this; }
  setStorageType(v) { this.#data.storage_type = v; return this; }
  setContentType(contentTypeRecord) {
    this.#data.content_type_id = contentTypeRecord.id;
    return this;
  }

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

  setValue(fieldConfigRecord, value) {
    this.#values.push({ fieldConfig: fieldConfigRecord, value });
    return this;
  }

  async save() {
    const contentData = await new EntityModel('content_data').insert(this.#data);

    for (const { fieldConfig, value } of this.#values) {
      const table = this.#valueTableFor(fieldConfig.storage_type);
      const valueModel = new EntityModel(table);
      await valueModel.insert({
        content_data_id: contentData.id,
        field_config_id: fieldConfig.id,
        value,
      });
    }

    return contentData;
  }

  #valueTableFor(storageType) {            // ← fixed name
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