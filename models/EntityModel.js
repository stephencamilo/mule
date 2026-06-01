import { PrismaClient } from '@prisma/client';
import { entityDefinitions } from '../config/entityDefinitions.js';

const prisma = new PrismaClient();

function getModelName(key) {
  const pascal = key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return pascal.endsWith('s') && !pascal.endsWith('ss') ? pascal.slice(0, -1) : pascal;
}

export class EntityModel {
  constructor(entityKey) {
    const def = entityDefinitions[entityKey];
    if (!def) throw new Error(`Unknown entity: ${entityKey}`);
    this.entityKey = entityKey;
    this.def = def;
    const modelName = getModelName(entityKey);
    this.model = prisma[modelName];
    if (!this.model) throw new Error(`Prisma model not found for "${entityKey}" (resolved to ${modelName})`);
    this.primaryKey = Array.isArray(def.primaryKey) ? def.primaryKey : [def.primaryKey];
    this.allowedFields = Object.entries(def.fields)
      .filter(([fieldName, meta]) => !this.primaryKey.includes(fieldName) && !meta.auto)
      .map(([fieldName]) => fieldName);
    this.useTimestamps = def.useTimestamps ?? false;
    if (this.useTimestamps) {
      this.createdField = def.createdField ?? 'created_at';
      this.updatedField = def.updatedField ?? 'updated_at';
    }
    this.validationRules = {};
    for (const [fieldName, meta] of Object.entries(def.fields)) {
      if (meta.validation) this.validationRules[fieldName] = meta.validation;
    }
  }

  _pickAllowed(data) {
    const clean = {};
    for (const field of this.allowedFields) {
      if (data[field] !== undefined) clean[field] = data[field];
    }
    return clean;
  }

  async findAll(where = {}) {
    return this.model.findMany({ where });
  }

  async find(id) {
    if (this.primaryKey.length === 1) {
      return this.model.findUnique({ where: { [this.primaryKey[0]]: Number(id) } });
    }
    throw new Error('find() with composite key is not supported; use findAll()');
  }

  async insert(data) {
    const clean = this._pickAllowed(data);
    return this.model.create({ data: clean });
  }

  async update(id, data) {
    const clean = this._pickAllowed(data);
    if (this.primaryKey.length === 1) {
      return this.model.update({ where: { [this.primaryKey[0]]: Number(id) }, data: clean });
    }
    throw new Error('update() with composite key is not supported');
  }

  async delete(id) {
    if (this.primaryKey.length === 1) {
      return this.model.delete({ where: { [this.primaryKey[0]]: Number(id) } });
    }
    throw new Error('delete() with composite key is not supported');
  }
}
