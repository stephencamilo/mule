import { readFileSync } from 'fs';
import { loadStructure } from './lib/loaders/structureLoader.js';
import { seedContent } from './lib/loaders/seedLoader.js';
import { clearContent } from './lib/loaders/clearDatabase.js';

const structure = JSON.parse(readFileSync('./structure.json', 'utf-8'));
const seedData = JSON.parse(readFileSync('./seed-data.json', 'utf-8'));

const maps = await loadStructure(structure);
console.log('✅ Structure ready.');

await clearContent();
console.log('🗑️  Old content cleared.');

await seedContent(seedData, maps);
console.log('✅ Seed data loaded.');