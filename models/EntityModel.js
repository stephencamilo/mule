import { PrismaClient } from '@prisma/client';
import { entityDefinitions } from '../config/entityDefinitions.js';

const prisma = new PrismaClient();

export class EntityModel {
  static prisma = prisma;   // <-- this line exposes the instance

  constructor(entityKey) {
    const def = entityDefinitions[entityKey];
    if (!def) throw new Error(`Unknown entity: ${entityKey}`);
    this.entityKey = entityKey;
    this.def = def;
    this.table = def.table;
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

  _buildWhereClause(where) {
    const keys = Object.keys(where);
    if (keys.length === 0) return { sql: '', params: [] };
    const conditions = keys.map((k, i) => `${k} = $${i + 1}`);
    return {
      sql: `WHERE ${conditions.join(' AND ')}`,
      params: keys.map(k => where[k])
    };
  }

  async findAll(where = {}) {
    const { sql: whereSql, params } = this._buildWhereClause(where);
    const query = `SELECT * FROM ${this.table} ${whereSql}`;
    const result = await prisma.$queryRawUnsafe(query, ...params);
    return result;
  }

  async find(id) {
    if (this.primaryKey.length !== 1) {
      throw new Error('find() with composite key is not supported; use findAll()');
    }
    const pk = this.primaryKey[0];
    const query = `SELECT * FROM ${this.table} WHERE ${pk} = $1`;
    const rows = await prisma.$queryRawUnsafe(query, id);
    return rows[0] || null;
  }

  async insert(data) {
    const clean = this._pickAllowed(data);
    const fields = [...Object.keys(clean)];
    const values = [...Object.values(clean)];

    if (this.useTimestamps) {
      const now = new Date().toISOString();
      fields.push(this.createdField, this.updatedField);
      values.push(now, now);
    }

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
      INSERT INTO ${this.table} (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    const rows = await prisma.$queryRawUnsafe(query, ...values);
    return rows[0];
  }

  async update(id, data) {
    const clean = this._pickAllowed(data);
    if (this.primaryKey.length !== 1) {
      throw new Error('update() with composite key is not supported');
    }
    const pk = this.primaryKey[0];
    let fields = Object.keys(clean);
    let values = [...Object.values(clean)];

    if (this.useTimestamps) {
      fields.push(this.updatedField);
      values.push(new Date().toISOString());
    }

    const setClause = fields.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);
    const query = `
      UPDATE ${this.table}
      SET ${setClause}
      WHERE ${pk} = $${fields.length + 1}
      RETURNING *
    `;
    const rows = await prisma.$queryRawUnsafe(query, ...values);
    return rows[0];
  }

  async delete(id) {
    if (this.primaryKey.length !== 1) {
      throw new Error('delete() with composite key is not supported');
    }
    const pk = this.primaryKey[0];
    const query = `DELETE FROM ${this.table} WHERE ${pk} = $1 RETURNING *`;
    const rows = await prisma.$queryRawUnsafe(query, id);
    return rows[0];
  }
}