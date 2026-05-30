import { PrismaClient } from '@prisma/client';
import { entityDefinitions } from '../config/entityDefinitions.js';

const prisma = new PrismaClient();

function pascalCase(key) {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
    .replace(/(s)$/i, '');  // remove trailing 's' only if it's not 'ss'
}

function findModel(entityKey) {
  const pascal = pascalCase(entityKey);
  if (prisma[pascal]) return prisma[pascal];
  if (prisma[entityKey]) return prisma[entityKey];
  // If neither found, throw with helpful list
  const available = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
  throw new Error(
    `Prisma model not found for "${entityKey}". ` +
    `Tried "${pascal}" and "${entityKey}". ` +
    `Available models: ${available.join(', ')}`
  );
}

export class EntityModel {
  constructor(entityKey) {
    const def = entityDefinitions[entityKey];
    if (!def) throw new Error(`Unknown entity: ${entityKey}`);

    this.entityKey = entityKey;
    this.def = def;
    this.model = findModel(entityKey);

    this.primaryKey = Array.isArray(def.primaryKey) ? def.primaryKey : [def.primaryKey];
    this.allowedFields = Object.entries(def.fields)
      .filter(([name, meta]) => !this.primaryKey.includes(name) && !meta.auto)
      .map(([name]) => name);

    this.useTimestamps = def.useTimestamps ?? false;
    if (this.useTimestamps) {
      this.createdField = def.createdField ?? 'created_at';
      this.updatedField = def.updatedField ?? 'updated_at';
    }
    this.validationRules = {};
    for (const [name, meta] of Object.entries(def.fields)) {
      if (meta.validation) this.validationRules[name] = meta.validation;
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
    throw new Error('Composite key not supported');
  }

  async insert(data) {
    return this.model.create({ data: this._pickAllowed(data) });
  }

  async update(id, data) {
    if (this.primaryKey.length === 1) {
      return this.model.update({
        where: { [this.primaryKey[0]]: Number(id) },
        data: this._pickAllowed(data),
      });
    }
    throw new Error('Composite key not supported');
  }

  async delete(id) {
    if (this.primaryKey.length === 1) {
      return this.model.delete({ where: { [this.primaryKey[0]]: Number(id) } });
    }
    throw new Error('Composite key not supported');
  }
}