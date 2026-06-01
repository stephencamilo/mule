import { writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { entityDefinitions } from '../config/entityDefinitions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fresh = process.argv.includes('--fresh');
const migrate = process.argv.includes('--migrate');

const schemaPath = resolve(__dirname, '..', 'prisma', 'schema.prisma');
const dbPath = resolve(__dirname, '..', 'dev.db');

if (fresh) {
  if (existsSync(schemaPath)) { unlinkSync(schemaPath); console.log(`Deleted ${schemaPath}`); }
  if (existsSync(dbPath)) { unlinkSync(dbPath); console.log(`Deleted ${dbPath}`); }
}

const tableToEntity = {};
for (const [entity, config] of Object.entries(entityDefinitions)) {
  tableToEntity[config.table] = entity;
}

const graph = {};
for (const [entity, config] of Object.entries(entityDefinitions)) {
  graph[entity] = [];
  if (config.foreignKeys) {
    for (const [, [refTable]] of Object.entries(config.foreignKeys)) {
      if (tableToEntity[refTable]) graph[entity].push(tableToEntity[refTable]);
    }
  }
}

function topologicalSort(g, nodes) {
  const inDegree = Object.fromEntries(nodes.map(n => [n, 0]));
  for (const deps of Object.values(g)) for (const dep of deps) inDegree[dep]++;
  const queue = nodes.filter(n => inDegree[n] === 0);
  const sorted = [];
  while (queue.length) {
    const node = queue.shift();
    sorted.push(node);
    for (const dependent of g[node]) {
      if (--inDegree[dependent] === 0) queue.push(dependent);
    }
  }
  return sorted;
}
const order = topologicalSort(graph, Object.keys(entityDefinitions));

function mapPrismaType(meta) {
  const type = meta.type.toUpperCase();
  if (type.startsWith('INT')) return 'Int';
  if (type.startsWith('DECIMAL') || type === 'FLOAT' || type === 'REAL') return 'Float';
  if (type === 'BOOLEAN') return 'Boolean';
  if (type === 'DATETIME' || type === 'TIMESTAMP') return 'DateTime';
  return 'String';
}

const modelStrings = {};
const reverseRelations = {};

for (const entity of order) {
  const config = entityDefinitions[entity];
  let modelStr = `model ${entity} {\n`;

  for (const [fieldName, meta] of Object.entries(config.fields)) {
    const prismaType = mapPrismaType(meta);
    let line = `  ${fieldName}  ${prismaType}`;
    if (meta.auto) line += ' @id @default(autoincrement())';
    if (meta.unique) line += ' @unique';
    if (meta.null) line += '?';
    line += '\n';
    modelStr += line;
  }

  if (config.useTimestamps) {
    const created = config.createdField || 'created_at';
    const updated = config.updatedField || 'updated_at';
    modelStr += `  ${created}  DateTime @default(now()) @map("${created}")\n`;
    if (updated) modelStr += `  ${updated}  DateTime @updatedAt @map("${updated}")\n`;
  }

  if (config.foreignKeys) {
    for (const [fieldName, [refTable, refColumn]] of Object.entries(config.foreignKeys)) {
      const refEntity = tableToEntity[refTable];
      if (refEntity) {
        const relationField = fieldName.replace(/_id$/, '');
        modelStr += `  ${relationField}  ${refEntity} @relation("${relationField}", fields: [${fieldName}], references: [${refColumn}])\n`;
        if (!reverseRelations[refEntity]) reverseRelations[refEntity] = [];
        reverseRelations[refEntity].push({ childEntity: entity, relationName: relationField });
      }
    }
  }

  modelStr += `  // @@reverse@@\n`;
  modelStr += `  @@map("${config.table}")\n`;
  modelStr += '}';
  modelStrings[entity] = modelStr;
}

for (const [parentEntity, relations] of Object.entries(reverseRelations)) {
  if (!modelStrings[parentEntity]) continue;
  const reverseLines = relations.map(r => {
    const fieldName = `${r.childEntity}_${r.relationName}`;
    return `  ${fieldName}  ${r.childEntity}[]  @relation("${r.relationName}")`;
  }).join('\n');
  modelStrings[parentEntity] = modelStrings[parentEntity].replace('  // @@reverse@@', reverseLines);
}

let schema = `// Auto-generated schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

`;
for (const entity of order) schema += modelStrings[entity] + '\n\n';

mkdirSync(dirname(schemaPath), { recursive: true });
writeFileSync(schemaPath, schema, 'utf-8');
console.log(`✅ Generated Prisma schema at ${schemaPath}`);

if (migrate) {
  console.log('⚙️  Running prisma migrate dev --name init...');
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit', cwd: resolve(__dirname, '..') });
  console.log('✅ Migration complete.');
} else {
  console.log('Next steps: npx prisma migrate dev --name init');
}
