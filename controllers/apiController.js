import { Router } from 'express';
import { EntityModel } from '../models/EntityModel.js';
import { entityDefinitions } from '../config/entityDefinitions.js';

const router = Router();

function loadDefinition(entityKey) {
  const def = entityDefinitions[entityKey];
  if (!def) { const err = new Error('Entity not found'); err.status = 404; throw err; }
  return def;
}

router.get('/:entity', async (req, res) => {
  try {
    const entity = new EntityModel(req.params.entity);
    const items = await entity.findAll();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:entity/:id', async (req, res) => {
  try {
    const def = loadDefinition(req.params.entity);
    const entity = new EntityModel(req.params.entity);
    if (def.compositeKey) {
      const keys = req.query;
      if (!Object.keys(keys).length) return res.status(400).json({ error: 'Composite key required' });
      const where = {};
      for (const [k, v] of Object.entries(keys)) where[k] = isNaN(v) ? v : Number(v);
      const record = await entity.findAll(where);
      if (!record || record.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json(record[0]);
    } else {
      const record = await entity.find(Number(req.params.id));
      if (!record) return res.status(404).json({ error: 'Not found' });
      return res.json(record);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:entity', async (req, res) => {
  try {
    const entity = new EntityModel(req.params.entity);
    const record = await entity.insert(req.body);
    res.status(201).json({ status: 'success', id: record[entity.primaryKey[0]] ?? record.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:entity/:id', updateHandler);
router.patch('/:entity/:id', updateHandler);

async function updateHandler(req, res) {
  try {
    const def = loadDefinition(req.params.entity);
    const entity = new EntityModel(req.params.entity);
    if (def.compositeKey) throw new Error('Composite key update not supported');
    await entity.update(Number(req.params.id), req.body);
    res.json({ status: 'success', message: 'Record updated' });
  } catch (err) { res.status(400).json({ error: err.message }); }
}

router.delete('/:entity/:id', async (req, res) => {
  try {
    const def = loadDefinition(req.params.entity);
    const entity = new EntityModel(req.params.entity);
    if (def.compositeKey) throw new Error('Composite key delete not supported');
    await entity.delete(Number(req.params.id));
    res.status(204).send();
  } catch (err) { res.status(404).json({ error: err.message }); }
});

export default router;
