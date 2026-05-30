// middleware/entityLoader.js
import { entityDefinitions } from '../config/entityDefinitions.js';

export function loadApiEntity(req, res, next) {
  const entityKey = req.params.entity;
  if (!entityKey || !entityDefinitions[entityKey]) {
    return res.status(404).json({ error: 'Entity not found' });
  }

  req.entityKey = entityKey;
  req.entityDef = entityDefinitions[entityKey];
  req.modelName = getModelName(entityKey);
  req.model = req.app.get('prisma')[req.modelName];
  next();
}

// Keep this helper in sync with other parts
function getModelName(key) {
  const map = {
    content_type: 'contentType',
    field_configs: 'fieldConfig',
    content_data: 'contentData',
    field_value_text: 'fieldValueText',
    field_value_integer: 'fieldValueInteger',
    field_value_real: 'fieldValueReal',
    field_value_blob: 'fieldValueBlob',
    content_reference: 'contentReference',
  };
  return map[key] || key;
}